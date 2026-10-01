import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { CATALOG_BY_ID } from "@/lib/asset-inventory/catalog";
import { CATALOG_LABELS, catalogNames } from "@/lib/asset-inventory/catalog-labels";
import { logAudit } from "@/lib/audit";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { mayWalkDurchgang } from "@/lib/billing/access";
import { FREQUENCIES, IMPACTS, type RiskLevel } from "@/lib/compliance/bsi-200-3";
import { invalidateModuleSignOffs } from "@/lib/compliance/module-recheck";
import { getDefaultMethodology } from "@/lib/compliance/risk-methodology-defaults";
import { seedLocale } from "@/lib/compliance/seed-locale";
import {
  declinedNote,
  levelOf,
  methodNote,
  noteLine,
  ratingKey,
  ratingText,
  resolveItem,
  SOURCE_IDS,
  SUPPLIER_LEVEL,
  sourcesNote,
  standingOf,
  toScale,
  treatmentFor,
  WAIT_REASONS,
  WALK,
  waitingNote,
} from "@/lib/durchgang";
import { getRegistrationPortals } from "@/lib/registration-portals";
import durchgangDe from "@/messages/durchgang/de.json";
import durchgangEn from "@/messages/durchgang/en.json";
import {
  asset,
  auditLog,
  company,
  companyRiskMethodology,
  risk,
  riskAsset,
  riskSupplier,
  supplier,
} from "@/schema";
import {
  appendNote,
  type DurchgangActor,
  durchgangItem,
  walkStates,
} from "../helpers/durchgang";
import {
  activatedCompanyProcedure,
  companyProcedure,
  router,
  type TRPCContext,
} from "../init";

/**
 * The Durchgang's own writes: what the existing procedures cannot record. Field answers, uploads
 * and register entries go through intake, evidence and the module routers, as on the requirement
 * page. This router adds the item's trail (a line in `internal_notes`) and its state (an audit row
 * logged like `announceWithdrawal`, which `walk` reads back).
 *
 * The layout gate is not enough on its own: an API call skips it. So every procedure checks the
 * same rule, paid or platform admin, and resolves the item from the session's company and a fixed
 * list of codes.
 */
const gate = (session: TRPCContext["session"]) => {
  if (
    !session ||
    !mayWalkDurchgang(session.accessLevel, isPlatformAdmin(session.user.email))
  ) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "The Durchgang is not part of this plan.",
    });
  }
};

const durchgangProcedure = companyProcedure.use(({ ctx, next }) => {
  gate(ctx.session);
  return next({ ctx });
});

/** Writes into the company's registers, which need a set-up company like the module routers do. */
const durchgangWrite = activatedCompanyProcedure.use(({ ctx, next }) => {
  gate(ctx.session);
  return next({ ctx });
});

/**
 * A register changed: sign-offs that relied on it are rechecked, in the background, as the module
 * routers do.
 */
const recheck = (
  ctx: { db: TRPCContext["db"]; companyId: string; userId: string },
  module: string,
) =>
  invalidateModuleSignOffs(ctx.db, ctx.companyId, module, ctx.userId).catch((err) =>
    console.error(`[background] ${module} recheck:`, err),
  );

/** Names compared as a person reads them, so "Datev " and "DATEV" are one supplier. */
const nameKey = (name: string) => name.trim().toLowerCase();

/** How many steps a stored scale has; the column is JSON, so its shape is checked, not assumed. */
const steps = (levels: unknown) => (Array.isArray(levels) ? levels.length : 0);

const code = z.string().max(10);
const NAMESPACES = { de: durchgangDe.durchgang, en: durchgangEn.durchgang } as const;

const actorOf = (ctx: {
  companyId: string;
  userId: string;
  session: { role: string };
}): DurchgangActor => ({
  companyId: ctx.companyId,
  userId: ctx.userId,
  role: ctx.session.role,
});

const itemOf = (c: string) => {
  const item = WALK.find((i) => i.code === c);
  if (!item)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `${c} is not in the Durchgang.`,
    });
  return item;
};

export const durchgangRouter = router({
  /** Where each item stands. Read on the server by every Durchgang page. */
  walk: durchgangProcedure.query(async ({ ctx }) => {
    const states = await walkStates(ctx.db, ctx.companyId);
    return WALK.map((item) => ({
      code: item.code,
      state: states.get(item.code) ?? { kind: "open" as const },
    }));
  }),

  /**
   * When the company last took over the BSI method here, or null. A method row alone says nothing:
   * `risk.getMethodology` writes the default on its first read, before anyone chose it.
   */
  adoption: durchgangProcedure.query(async ({ ctx }) => {
    const row = await ctx.db.query.auditLog.findFirst({
      where: and(
        eq(auditLog.companyId, ctx.companyId),
        eq(auditLog.action, "durchgang.adopted"),
      ),
      orderBy: desc(auditLog.createdAt),
      columns: { createdAt: true },
    });
    return { adoptedAt: row?.createdAt ?? null };
  }),

  /**
   * Where a company registers: every member state's authority and portal, with the company's own
   * country, which the screen puts first. The list is the one the wiki's portal page shows.
   */
  portals: durchgangProcedure.query(async ({ ctx }) => {
    const [org, data] = await Promise.all([
      ctx.db.query.company.findFirst({
        where: eq(company.id, ctx.companyId),
        columns: { country: true },
      }),
      Promise.resolve(getRegistrationPortals()),
    ]);
    return {
      country: org?.country ?? null,
      lastUpdated: data.lastUpdated,
      portals: data.portals.map((p) => ({
        countryCode: p.countryCode,
        authority: p.authority,
        portalName: p.portalName,
        portalUrl: p.portalUrl,
        status: p.status,
      })),
    };
  }),

  /** "Geht noch nicht": the reason goes into the audit row, the free text only into the notes. */
  wait: durchgangProcedure
    .input(
      z.object({
        code,
        reason: z.enum(WAIT_REASONS),
        note: z.string().trim().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ref = await durchgangItem(ctx.db, actorOf(ctx), input.code);
      const locale = await seedLocale(ctx.db, ctx.userId, ctx.companyId);
      const reason = NAMESPACES[locale].waitReasons[input.reason];
      await appendNote(
        ctx.db,
        ref.statusId,
        noteLine(new Date(), waitingNote(locale, reason, input.note || null)),
      );
      await logAudit({
        companyId: ctx.companyId,
        userId: ctx.userId,
        action: "durchgang.waiting",
        entityType: "requirement",
        entityId: ref.requirementId,
        description: `${ref.code} waiting`,
        newValue: { reason: input.reason },
      });
    }),

  resume: durchgangProcedure
    .input(z.object({ code }))
    .mutation(async ({ ctx, input }) => {
      const ref = await durchgangItem(ctx.db, actorOf(ctx), input.code);
      await logAudit({
        companyId: ctx.companyId,
        userId: ctx.userId,
        action: "durchgang.resumed",
        entityType: "requirement",
        entityId: ref.requirementId,
        description: `${ref.code} resumed`,
      });
    }),

  /** "Nachgesehen": where the person looked, recorded with the day, for the report. */
  sources: durchgangProcedure
    .input(
      z.object({
        code,
        sources: z.array(z.enum(SOURCE_IDS)).min(1).max(SOURCE_IDS.length),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ref = await durchgangItem(ctx.db, actorOf(ctx), input.code);
      const locale = await seedLocale(ctx.db, ctx.userId, ctx.companyId);
      const copy = resolveItem(NAMESPACES[locale], itemOf(input.code));
      const chosen = new Set<string>(input.sources);
      const labels = copy.ok
        ? copy.value.screens.flatMap((s) =>
            "sources" in s.copy
              ? s.copy.sources.filter((x) => chosen.has(x.key)).map((x) => x.label)
              : [],
          )
        : [...input.sources];
      await appendNote(
        ctx.db,
        ref.statusId,
        noteLine(new Date(), sourcesNote(locale, labels)),
      );
      await logAudit({
        companyId: ctx.companyId,
        userId: ctx.userId,
        action: "durchgang.sources",
        entityType: "requirement",
        entityId: ref.requirementId,
        description: `${ref.code} sources consulted`,
        newValue: { sources: input.sources },
      });
    }),

  /**
   * "Übernehmen" on 2.1: the BSI 200-3 scales, in the person's language, as an explicit write. A
   * company that set its own scales on the requirement page gets them replaced only by this click.
   */
  adoptMethod: durchgangProcedure.mutation(async ({ ctx }) => {
    const ref = await durchgangItem(ctx.db, actorOf(ctx), "2.1");
    const locale = await seedLocale(ctx.db, ctx.userId, ctx.companyId);
    const method = getDefaultMethodology(locale);
    const values = {
      name: method.name,
      likelihoodLevels: method.likelihoodLevels,
      impactLevels: method.impactLevels,
      updatedAt: new Date(),
    };
    await ctx.db
      .insert(companyRiskMethodology)
      .values({
        companyId: ctx.companyId,
        ...values,
        acceptanceThreshold: method.acceptanceThreshold,
        includesOt: method.includesOt,
      })
      .onConflictDoUpdate({ target: companyRiskMethodology.companyId, set: values });
    await appendNote(ctx.db, ref.statusId, noteLine(new Date(), methodNote(locale)));
    await logAudit({
      companyId: ctx.companyId,
      userId: ctx.userId,
      action: "durchgang.adopted",
      entityType: "requirement",
      entityId: ref.requirementId,
      description: "2.1 BSI 200-3 method adopted",
      newValue: { method: method.name },
    });
  }),

  /**
   * "Wir haben entschieden, das nicht zu tun": finished without doing it, for the Geschäftsführung
   * to sign. The written reason is the record of that decision and goes only into the notes; the
   * audit row carries no free text.
   */
  decline: durchgangProcedure
    .input(z.object({ code, reason: z.string().trim().min(20).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      const ref = await durchgangItem(ctx.db, actorOf(ctx), input.code);
      const locale = await seedLocale(ctx.db, ctx.userId, ctx.companyId);
      await appendNote(
        ctx.db,
        ref.statusId,
        noteLine(new Date(), declinedNote(locale, input.reason)),
      );
      await logAudit({
        companyId: ctx.companyId,
        userId: ctx.userId,
        action: "durchgang.declined",
        entityType: "requirement",
        entityId: ref.requirementId,
        description: `${ref.code} decided not to do`,
      });
    }),

  /** The end of an item: filled in, waiting for the signature. The status column stays. */
  finish: durchgangProcedure
    .input(z.object({ code }))
    .mutation(async ({ ctx, input }) => {
      const ref = await durchgangItem(ctx.db, actorOf(ctx), input.code);
      await logAudit({
        companyId: ctx.companyId,
        userId: ctx.userId,
        action: "durchgang.item_done",
        entityType: "requirement",
        entityId: ref.requirementId,
        description: `${ref.code} filled in`,
      });
    }),

  /**
   * 2.2: the ticked catalogue items and the person's own entries become asset rows, named in the
   * seed language like every other default the platform writes. An item already listed under any
   * of its names is skipped, so a second pass adds only what is new, and nothing is ever deleted
   * here.
   */
  addAssets: durchgangWrite
    .input(
      z.object({
        catalogIds: z.array(z.string().max(80)).max(CATALOG_BY_ID.size),
        custom: z
          .array(z.object({ name: z.string().trim().min(1).max(255) }))
          .max(50)
          .default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const labels = CATALOG_LABELS[await seedLocale(ctx.db, ctx.userId, ctx.companyId)];
      const wanted = [
        ...input.catalogIds.flatMap((id) => {
          const item = CATALOG_BY_ID.get(id);
          const label = labels[id]?.label;
          return item && label
            ? [{ name: label, type: item.category, names: catalogNames(id) }]
            : [];
        }),
        ...input.custom.map((c) => ({ name: c.name, type: "other", names: [c.name] })),
      ];
      const existing = await ctx.db.query.asset.findMany({
        where: eq(asset.companyId, ctx.companyId),
        columns: { name: true },
      });
      const taken = new Set(existing.map((a) => nameKey(a.name)));
      // The first spelling of a name wins, and an item already on the list is left alone.
      const fresh = wanted.filter(
        (a, i) =>
          !a.names.some((n) => taken.has(nameKey(n))) &&
          wanted.findIndex((b) => nameKey(b.name) === nameKey(a.name)) === i,
      );
      if (fresh.length > 0) {
        await ctx.db
          .insert(asset)
          .values(
            fresh.map((a) => ({ companyId: ctx.companyId, name: a.name, type: a.type })),
          );
        recheck(ctx, "asset");
      }
      return { added: fresh.length };
    }),

  /**
   * 2.2, which one exactly and from whom. Each row gives the asset the name the company knows it
   * by and its provider, found on the company's supplier list by name or added to it. An emptied
   * provider unlinks the asset and leaves the supplier listed. The first rename moves the old
   * name into an empty description, so the list still says what kind of thing it is.
   */
  specifyAssets: durchgangWrite
    .input(
      z.object({
        rows: z
          .array(
            z.object({
              id: z.string().uuid(),
              name: z.string().trim().min(1).max(255),
              provider: z.string().trim().max(255),
            }),
          )
          .max(500),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ids = [...new Set(input.rows.map((r) => r.id))];
      if (ids.length === 0) return { updated: 0, suppliersAdded: 0 };
      const result = await ctx.db.transaction(async (tx) => {
        // One writer per company at a time, so two tabs naming the same new provider add it once.
        await tx
          .select({ id: company.id })
          .from(company)
          .where(eq(company.id, ctx.companyId))
          .for("update");
        const owned = await tx
          .select({
            id: asset.id,
            name: asset.name,
            description: asset.description,
            supplierId: asset.supplierId,
          })
          .from(asset)
          .where(and(eq(asset.companyId, ctx.companyId), inArray(asset.id, ids)));
        if (owned.length !== ids.length) throw new TRPCError({ code: "NOT_FOUND" });

        const listed = await tx
          .select({ id: supplier.id, name: supplier.name })
          .from(supplier)
          .where(eq(supplier.customerCompanyId, ctx.companyId));
        const known = new Map(listed.map((s) => [nameKey(s.name), s.id]));
        // The first spelling of a new provider wins.
        const fresh = input.rows
          .map((r) => r.provider)
          .filter(
            (name, i, all) =>
              name !== "" &&
              !known.has(nameKey(name)) &&
              all.findIndex((n) => nameKey(n) === nameKey(name)) === i,
          );
        const added =
          fresh.length > 0
            ? await tx
                .insert(supplier)
                .values(fresh.map((name) => ({ name, customerCompanyId: ctx.companyId })))
                .returning({ id: supplier.id, name: supplier.name })
            : [];
        const supplierOf = new Map([
          ...known,
          ...added.map((s) => [nameKey(s.name), s.id] as const),
        ]);

        const before = new Map(owned.map((a) => [a.id, a]));
        const changes = input.rows.flatMap((row) => {
          const was = before.get(row.id);
          if (!was) return [];
          const supplierId =
            row.provider === "" ? null : (supplierOf.get(nameKey(row.provider)) ?? null);
          const renamed = row.name !== was.name;
          if (!renamed && supplierId === was.supplierId) return [];
          const description =
            renamed && !was.description?.trim() ? was.name : was.description;
          return [{ id: row.id, name: row.name, supplierId, description }];
        });
        for (const change of changes) {
          await tx
            .update(asset)
            .set({
              name: change.name,
              supplierId: change.supplierId,
              description: change.description,
              updatedAt: new Date(),
            })
            .where(and(eq(asset.id, change.id), eq(asset.companyId, ctx.companyId)));
        }
        return { updated: changes.length, suppliersAdded: added.length };
      });
      if (result.updated > 0) recheck(ctx, "asset");
      if (result.suppliersAdded > 0) recheck(ctx, "supplier");
      return result;
    }),

  /**
   * 2.3: one rating per listed asset or supplier on the two 200-3 scales. A thing with no risk
   * yet gets one, linked to it, with the treatment its level suggests; a thing with exactly one
   * risk on these scales has that risk re-rated, and its treatment follows only while it is still
   * the walk's proposal; anything else is worked on in the risk register and left alone here. A
   * supplier's own register level follows its rating.
   */
  rate: durchgangWrite
    .input(
      z.object({
        rows: z
          .array(
            z.object({
              kind: z.enum(["asset", "supplier"]),
              id: z.string().uuid(),
              frequency: z.enum(FREQUENCIES),
              impact: z.enum(IMPACTS),
            }),
          )
          .max(1000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // One rating per thing: the last one sent wins.
      const rows = [
        ...new Map(input.rows.map((r) => [ratingKey(r.kind, r.id), r])).values(),
      ];
      if (rows.length === 0) return { written: 0 };
      const locale = await seedLocale(ctx.db, ctx.userId, ctx.companyId);
      const assetIds = rows.filter((r) => r.kind === "asset").map((r) => r.id);
      const supplierIds = rows.filter((r) => r.kind === "supplier").map((r) => r.id);

      /** The kind of each thing a rating was written for. */
      const written = await ctx.db.transaction(async (tx) => {
        const method = await tx.query.companyRiskMethodology.findFirst({
          where: eq(companyRiskMethodology.companyId, ctx.companyId),
          columns: { likelihoodLevels: true, impactLevels: true },
        });
        if (
          method &&
          (steps(method.likelihoodLevels) !== FREQUENCIES.length ||
            steps(method.impactLevels) !== IMPACTS.length)
        ) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "The company's risk method uses other scales than BSI 200-3.",
          });
        }

        // Locking the rated rows keeps two tabs from each adding a first risk to the same thing.
        const assets =
          assetIds.length > 0
            ? await tx
                .select({ id: asset.id, name: asset.name })
                .from(asset)
                .where(
                  and(eq(asset.companyId, ctx.companyId), inArray(asset.id, assetIds)),
                )
                .for("update")
            : [];
        const suppliers =
          supplierIds.length > 0
            ? await tx
                .select({ id: supplier.id, name: supplier.name })
                .from(supplier)
                .where(
                  and(
                    eq(supplier.customerCompanyId, ctx.companyId),
                    inArray(supplier.id, supplierIds),
                  ),
                )
                .for("update")
            : [];
        if (
          assets.length !== assetIds.length ||
          suppliers.length !== supplierIds.length
        ) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        const risks = {
          id: risk.id,
          likelihood: risk.likelihood,
          impact: risk.impact,
          treatment: risk.treatment,
        };
        const assetLinks =
          assetIds.length > 0
            ? await tx
                .select({ ...risks, target: riskAsset.assetId })
                .from(riskAsset)
                .innerJoin(risk, eq(risk.id, riskAsset.riskId))
                .where(
                  and(
                    eq(risk.companyId, ctx.companyId),
                    inArray(riskAsset.assetId, assetIds),
                  ),
                )
            : [];
        const supplierLinks =
          supplierIds.length > 0
            ? await tx
                .select({ ...risks, target: riskSupplier.supplierId })
                .from(riskSupplier)
                .innerJoin(risk, eq(risk.id, riskSupplier.riskId))
                .where(
                  and(
                    eq(risk.companyId, ctx.companyId),
                    inArray(riskSupplier.supplierId, supplierIds),
                  ),
                )
            : [];

        const names = new Map([...assets, ...suppliers].map((t) => [t.id, t.name]));
        const links = { asset: assetLinks, supplier: supplierLinks };
        /** One write: a new risk (`riskId` null) or a re-rated one, with the treatment to store. */
        type Step = {
          readonly row: (typeof rows)[number];
          readonly level: RiskLevel;
          readonly scale: ReturnType<typeof toScale>;
          readonly riskId: string | null;
          readonly treatment: string;
        };
        const plan = rows.flatMap((row): Step[] => {
          const rating = { frequency: row.frequency, impact: row.impact };
          const scale = toScale(rating);
          const level = levelOf(rating);
          const linked = links[row.kind].filter((l) => l.target === row.id);
          const standing = standingOf(linked);
          if (standing.kind === "kept") return [];
          if (standing.kind === "open") {
            return [{ row, level, scale, riskId: null, treatment: treatmentFor(level) }];
          }
          const unchanged =
            standing.rating.frequency === rating.frequency &&
            standing.rating.impact === rating.impact;
          if (unchanged) return [];
          // A treatment someone chose in the risk register stays; the walk's own proposal follows
          // the new level.
          const stored = linked[0]?.treatment;
          const proposed = stored === treatmentFor(levelOf(standing.rating));
          return [
            {
              row,
              level,
              scale,
              riskId: standing.riskId,
              treatment: proposed || !stored ? treatmentFor(level) : stored,
            },
          ];
        });

        for (const step of plan) {
          const { row } = step;
          const values = {
            ...step.scale,
            // Scored as the risk register scores every risk.
            riskScore: step.scale.likelihood * step.scale.impact,
            treatment: step.treatment,
          };
          if (step.riskId) {
            await tx
              .update(risk)
              .set({ ...values, updatedAt: new Date() })
              .where(and(eq(risk.id, step.riskId), eq(risk.companyId, ctx.companyId)));
          } else {
            const [added] = await tx
              .insert(risk)
              .values({
                companyId: ctx.companyId,
                ...ratingText(locale, row.kind, names.get(row.id) ?? ""),
                ...values,
              })
              .returning({ id: risk.id });
            if (!added) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
            if (row.kind === "asset") {
              await tx.insert(riskAsset).values({ riskId: added.id, assetId: row.id });
            } else {
              await tx
                .insert(riskSupplier)
                .values({ riskId: added.id, supplierId: row.id });
            }
          }
          if (row.kind === "supplier") {
            await tx
              .update(supplier)
              .set({ riskLevel: SUPPLIER_LEVEL[step.level], updatedAt: new Date() })
              .where(
                and(
                  eq(supplier.id, row.id),
                  eq(supplier.customerCompanyId, ctx.companyId),
                ),
              );
          }
        }
        return plan.map((step) => step.row.kind);
      });
      // Only a register that changed has its sign-offs rechecked.
      if (written.length > 0) recheck(ctx, "risk");
      if (written.includes("supplier")) recheck(ctx, "supplier");
      return { written: written.length };
    }),
});
