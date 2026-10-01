import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { CATALOG_BY_ID } from "@/lib/asset-inventory/catalog";
import {
  CATALOG_LABELS,
  catalogNames,
  nameKey,
} from "@/lib/asset-inventory/catalog-labels";
import { logAudit } from "@/lib/audit";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { mayWalkDurchgang } from "@/lib/billing/access";
import { FREQUENCIES, IMPACTS, type RiskLevel } from "@/lib/compliance/bsi-200-3";
import { invalidateModuleSignOffs } from "@/lib/compliance/module-recheck";
import { getDefaultMethodology } from "@/lib/compliance/risk-methodology-defaults";
import { seedLocale } from "@/lib/compliance/seed-locale";
import type { DbOrTx } from "@/lib/db";
import {
  type AnyScreen,
  agreementsNote,
  approvedNote,
  askedFields,
  criticalNote,
  criticalProcessesText,
  declinedNote,
  levelOf,
  loginsNote,
  marker,
  methodNote,
  noteLine,
  POLICY_LISTS,
  type PolicyList,
  policyNames,
  policyText,
  policyTitle,
  ratingKey,
  ratingText,
  recoveryOrder,
  recoveryOrderText,
  resolveItem,
  SOURCE_IDS,
  SUPPLIER_LEVEL,
  sourcesNote,
  standingOf,
  toScale,
  treatmentFor,
  WAIT_REASONS,
  WALK,
  WALK_POLICIES,
  waitingNote,
} from "@/lib/durchgang";
import { getRegistrationPortals } from "@/lib/registration-portals";
import durchgangDe from "@/messages/durchgang/de.json";
import durchgangEn from "@/messages/durchgang/en.json";
import {
  asset,
  auditLog,
  company,
  companyCategoryIntake,
  companyPolicyConfig,
  companyRiskMethodology,
  policy,
  requirement,
  risk,
  riskAsset,
  riskSupplier,
  supplier,
} from "@/schema";
import { policyInsertSchema } from "@/schema/validators";
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

/** The policy an item writes, from its script; an item without a policy screen writes none. */
const policyTypeOf = (c: string) => {
  const screens: readonly AnyScreen[] = itemOf(c).screens;
  const screen = screens.find((s) => s.kind === "policy");
  if (screen?.kind !== "policy") {
    throw new TRPCError({ code: "BAD_REQUEST", message: `${c} writes no policy.` });
  }
  return screen.policy;
};

/** The item's policy screen with its words in `locale`; an item without one writes no policy. */
const policyScreenOf = (c: string, locale: "de" | "en") => {
  const words = resolveItem(NAMESPACES[locale], itemOf(c));
  const screen = words.ok
    ? words.value.screens.find((s) => s.kind === "policy")
    : undefined;
  if (screen?.kind !== "policy") {
    throw new TRPCError({ code: "BAD_REQUEST", message: `${c} writes no policy.` });
  }
  return screen;
};

/**
 * A walk-written policy's stored choices: the clauses, and for the continuity plan one line per
 * process on how it goes on without IT, by asset id. The config column is JSON, so its shape is
 * checked, not assumed; a part that does not parse reads as empty and leaves the rest.
 */
const STORED_CONFIG = z
  .object({
    clauses: z.array(z.string()).catch([]),
    fallbacks: z.record(z.string(), z.string()).catch({}),
  })
  .catch({ clauses: [], fallbacks: {} });

const storedConfigOf = async (db: DbOrTx, companyId: string, type: string) => {
  const [row] = await db
    .select({ config: companyPolicyConfig.config })
    .from(companyPolicyConfig)
    .where(
      and(
        eq(companyPolicyConfig.companyId, companyId),
        eq(companyPolicyConfig.policyType, type),
      ),
    );
  return STORED_CONFIG.parse(row?.config ?? {});
};

/**
 * What a plan's list names stand for, read off the company's own rows: the processes marked
 * `is_critical` with their line, and the systems in the order their 2.3 ratings give.
 */
const policyListsOf = async (
  db: DbOrTx,
  companyId: string,
  fallbacks: Readonly<Record<string, string>>,
): Promise<Record<PolicyList, string>> => {
  const [assets, links] = await Promise.all([
    db
      .select({
        id: asset.id,
        name: asset.name,
        type: asset.type,
        isCritical: asset.isCritical,
      })
      .from(asset)
      .where(eq(asset.companyId, companyId))
      .orderBy(asset.name),
    db
      .select({
        id: risk.id,
        likelihood: risk.likelihood,
        impact: risk.impact,
        assetId: riskAsset.assetId,
      })
      .from(riskAsset)
      .innerJoin(risk, eq(risk.id, riskAsset.riskId))
      .where(eq(risk.companyId, companyId)),
  ]);
  return {
    criticalProcesses: criticalProcessesText(
      assets
        .filter((a) => a.type === "process" && a.isCritical)
        .map((a) => ({ name: a.name, how: fallbacks[a.id] ?? "" })),
    ),
    recoveryOrder: recoveryOrderText(
      recoveryOrder(
        assets,
        links.map((l) => ({ ...l, linked: [l.assetId] })),
      ),
    ),
  };
};

/**
 * A policy as the walk writes it for this company: the template in the record language, the
 * company's name, the clauses chosen so far and, where the template names them, the lists read
 * off the company's rows. The screen shows exactly this, so the text that is printed and signed
 * is the text that is stored.
 */
const policyDraftOf = async (
  ctx: { db: TRPCContext["db"]; companyId: string; userId: string },
  c: string,
) => {
  const locale = await seedLocale(ctx.db, ctx.userId, ctx.companyId);
  const screen = policyScreenOf(c, locale);
  const type = screen.screen.policy;
  const document = screen.copy.document;
  const [org, stored] = await Promise.all([
    ctx.db.query.company.findFirst({
      where: eq(company.id, ctx.companyId),
      columns: { name: true },
    }),
    storedConfigOf(ctx.db, ctx.companyId, type),
  ]);
  if (!org) throw new TRPCError({ code: "NOT_FOUND" });
  const usesLists = POLICY_LISTS.some((name) =>
    JSON.stringify(document).includes(marker(name)),
  );
  return {
    type,
    document,
    company: org.name,
    clauses: stored.clauses,
    fallbacks: stored.fallbacks,
    lists: usesLists ? await policyListsOf(ctx.db, ctx.companyId, stored.fallbacks) : {},
  };
};

/**
 * The company's policies the walk wrote, in walk order: each one of an item's template on that
 * item's requirement, so a policy of the same type added by hand elsewhere is not among them.
 */
const walkPolicyRows = async (db: TRPCContext["db"], companyId: string) => {
  const rows = await db
    .select({
      code: requirement.code,
      type: policy.type,
      title: policy.title,
      status: policy.status,
      effectiveFrom: policy.effectiveFrom,
    })
    .from(policy)
    .innerJoin(requirement, eq(requirement.id, policy.requirementId))
    .where(
      and(
        eq(policy.companyId, companyId),
        inArray(
          policy.type,
          WALK_POLICIES.map((p) => p.policy),
        ),
      ),
    );
  return WALK_POLICIES.flatMap((p) =>
    rows
      .filter((row) => row.code === p.code && row.type === p.policy)
      .map((row) => ({ ...row, type: p.policy })),
  );
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

  /**
   * 5.2: what each supplier's contract, AVV or terms already settle about security and about
   * reporting incidents to the company. Only the customer's own two columns are written, only on
   * the company's own rows, and only where a value changed. The item's trail names every supplier
   * checked, which is also the record that a row with neither agreement was looked at.
   */
  recordAgreements: durchgangWrite
    .input(
      z.object({
        code,
        rows: z
          .array(
            z.object({
              supplierId: z.string().uuid(),
              security: z.boolean(),
              incidents: z.boolean(),
            }),
          )
          .min(1)
          .max(500),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const screens: readonly AnyScreen[] = itemOf(input.code).screens;
      if (!screens.some((s) => s.kind === "agreements")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `${input.code} records no agreements.`,
        });
      }
      const ref = await durchgangItem(ctx.db, actorOf(ctx), input.code);
      const rows = [...new Map(input.rows.map((r) => [r.supplierId, r])).values()];
      const ids = rows.map((r) => r.supplierId);
      const owned = await ctx.db
        .select({
          id: supplier.id,
          name: supplier.name,
          security: supplier.hasSecurityClauses,
          incidents: supplier.hasIncidentNotificationClause,
        })
        .from(supplier)
        .where(
          and(eq(supplier.customerCompanyId, ctx.companyId), inArray(supplier.id, ids)),
        );
      if (owned.length !== ids.length) throw new TRPCError({ code: "NOT_FOUND" });

      const before = new Map(owned.map((s) => [s.id, s]));
      const changed = rows.filter((row) => {
        const was = before.get(row.supplierId);
        return (
          was !== undefined &&
          (row.security !== Boolean(was.security) ||
            row.incidents !== Boolean(was.incidents))
        );
      });
      for (const row of changed) {
        await ctx.db
          .update(supplier)
          .set({
            hasSecurityClauses: row.security,
            hasIncidentNotificationClause: row.incidents,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(supplier.id, row.supplierId),
              eq(supplier.customerCompanyId, ctx.companyId),
            ),
          );
      }
      const locale = await seedLocale(ctx.db, ctx.userId, ctx.companyId);
      await appendNote(
        ctx.db,
        ref.statusId,
        noteLine(
          new Date(),
          agreementsNote(
            locale,
            rows.map((row) => ({
              name: before.get(row.supplierId)?.name ?? "",
              security: row.security,
              incidents: row.incidents,
            })),
          ),
        ),
      );
      await logAudit({
        companyId: ctx.companyId,
        userId: ctx.userId,
        action: "durchgang.agreements",
        entityType: "requirement",
        entityId: ref.requirementId,
        description: `${ref.code} supplier agreements checked`,
        newValue: { checked: rows.length, changed: changed.length },
      });
      if (changed.length > 0) recheck(ctx, "supplier");
      return { changed: changed.length };
    }),

  /**
   * 11.1: whether signing in to each listed program and remote access takes a second factor.
   * Only `has_mfa` is written, only on the company's own assets, and only where it changed. The
   * column defaults to false, so the item's trail is the record that a row was answered "no".
   */
  recordLogins: durchgangWrite
    .input(
      z.object({
        code,
        rows: z
          .array(z.object({ assetId: z.string().uuid(), mfa: z.boolean() }))
          .min(1)
          .max(500),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const screens: readonly AnyScreen[] = itemOf(input.code).screens;
      if (!screens.some((s) => s.kind === "logins")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `${input.code} records no sign-ins.`,
        });
      }
      const ref = await durchgangItem(ctx.db, actorOf(ctx), input.code);
      const rows = [...new Map(input.rows.map((r) => [r.assetId, r])).values()];
      const ids = rows.map((r) => r.assetId);
      const owned = await ctx.db
        .select({ id: asset.id, name: asset.name, mfa: asset.hasMfa })
        .from(asset)
        .where(and(eq(asset.companyId, ctx.companyId), inArray(asset.id, ids)));
      if (owned.length !== ids.length) throw new TRPCError({ code: "NOT_FOUND" });

      const before = new Map(owned.map((a) => [a.id, a]));
      const changed = rows.filter((row) => {
        const was = before.get(row.assetId);
        return was !== undefined && row.mfa !== Boolean(was.mfa);
      });
      for (const row of changed) {
        await ctx.db
          .update(asset)
          .set({ hasMfa: row.mfa, updatedAt: new Date() })
          .where(and(eq(asset.id, row.assetId), eq(asset.companyId, ctx.companyId)));
      }
      const locale = await seedLocale(ctx.db, ctx.userId, ctx.companyId);
      await appendNote(
        ctx.db,
        ref.statusId,
        noteLine(
          new Date(),
          loginsNote(
            locale,
            rows.map((row) => ({
              name: before.get(row.assetId)?.name ?? "",
              mfa: row.mfa,
            })),
          ),
        ),
      );
      await logAudit({
        companyId: ctx.companyId,
        userId: ctx.userId,
        action: "durchgang.logins",
        entityType: "requirement",
        entityId: ref.requirementId,
        description: `${ref.code} sign-ins checked`,
        newValue: { checked: rows.length, changed: changed.length },
      });
      if (changed.length > 0) recheck(ctx, "asset");
      return { changed: changed.length };
    }),

  /** The policies the walk wrote for the company, with their state, for the approval screen. */
  walkPolicies: durchgangProcedure.query(({ ctx }) =>
    walkPolicyRows(ctx.db, ctx.companyId),
  ),

  /**
   * 7.3: the drafts management approved in one sitting become approved from that day. Each
   * document is resolved through its own item, so approving it takes what writing it takes, and
   * only drafts change: an approved document keeps its day. As on the signature screens, the
   * approval columns (who, when, in which role) stay untouched. The review's trail names every
   * document approved.
   */
  approvePolicies: durchgangWrite
    .input(
      z.object({
        code,
        approvedOn: z.iso.date(),
        types: z.array(z.string().max(60)).min(1).max(20),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const screens: readonly AnyScreen[] = itemOf(input.code).screens;
      if (!screens.some((s) => s.kind === "approve")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `${input.code} approves no policies.`,
        });
      }
      const chosen = WALK_POLICIES.filter((p) => input.types.includes(p.policy));
      if (chosen.length !== new Set(input.types).size) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Not a walk policy." });
      }
      const ref = await durchgangItem(ctx.db, actorOf(ctx), input.code);
      const targets = await Promise.all(
        chosen.map(async (p) => ({
          type: p.policy,
          owner: await durchgangItem(ctx.db, actorOf(ctx), p.code),
        })),
      );
      const approved = await ctx.db.transaction(async (tx) => {
        const titles: string[] = [];
        for (const { type, owner } of targets) {
          const rows = await tx
            .update(policy)
            .set({
              status: "approved",
              effectiveFrom: input.approvedOn,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(policy.companyId, ctx.companyId),
                eq(policy.requirementId, owner.requirementId),
                eq(policy.type, type),
                eq(policy.status, "draft"),
              ),
            )
            .returning({ title: policy.title });
          titles.push(...rows.map((r) => r.title));
        }
        return titles;
      });
      if (approved.length > 0) {
        const locale = await seedLocale(ctx.db, ctx.userId, ctx.companyId);
        await appendNote(
          ctx.db,
          ref.statusId,
          noteLine(new Date(), approvedNote(locale, input.approvedOn, approved)),
        );
        await logAudit({
          companyId: ctx.companyId,
          userId: ctx.userId,
          action: "durchgang.policies_approved",
          entityType: "requirement",
          entityId: ref.requirementId,
          description: `${ref.code} management approved ${approved.length} walk documents`,
          newValue: { approvedOn: input.approvedOn, count: approved.length },
        });
        recheck(ctx, "policy");
      }
      return { approved: approved.length };
    }),

  /** The policy an item writes, as its screen shows it and the server stores it. */
  policyDraft: durchgangProcedure
    .input(z.object({ code }))
    .query(async ({ ctx, input }) => {
      const draft = await policyDraftOf(ctx, input.code);
      return {
        document: draft.document,
        company: draft.company,
        clauses: draft.clauses,
        fallbacks: draft.fallbacks,
        lists: draft.lists,
      };
    }),

  /**
   * 4.2: which of the company's business processes must keep running without IT. The mark is
   * the asset's own column (`is_critical`), written only on the company's process assets and only
   * where it changed. The one-line fallback per process has no column; it is kept with the plan's
   * other choices in the plan's policy config, which the plan prints.
   */
  recordCritical: durchgangWrite
    .input(
      z.object({
        code,
        rows: z
          .array(
            z.object({
              assetId: z.string().uuid(),
              critical: z.boolean(),
              how: z.string().trim().max(300),
            }),
          )
          .min(1)
          .max(200),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const screens: readonly AnyScreen[] = itemOf(input.code).screens;
      if (!screens.some((s) => s.kind === "critical")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `${input.code} marks no processes.`,
        });
      }
      const ref = await durchgangItem(ctx.db, actorOf(ctx), input.code);
      const type = policyTypeOf(input.code);
      const rows = [...new Map(input.rows.map((r) => [r.assetId, r])).values()];
      const ids = rows.map((r) => r.assetId);

      const result = await ctx.db.transaction(async (tx) => {
        const owned = await tx
          .select({ id: asset.id, name: asset.name, isCritical: asset.isCritical })
          .from(asset)
          .where(
            and(
              eq(asset.companyId, ctx.companyId),
              eq(asset.type, "process"),
              inArray(asset.id, ids),
            ),
          )
          .for("update");
        if (owned.length !== ids.length) throw new TRPCError({ code: "NOT_FOUND" });

        const before = new Map(owned.map((a) => [a.id, a]));
        const changed = rows.filter(
          (row) => row.critical !== Boolean(before.get(row.assetId)?.isCritical),
        );
        for (const row of changed) {
          await tx
            .update(asset)
            .set({ isCritical: row.critical, updatedAt: new Date() })
            .where(and(eq(asset.id, row.assetId), eq(asset.companyId, ctx.companyId)));
        }

        const stored = await storedConfigOf(tx, ctx.companyId, type);
        const config = {
          ...stored,
          fallbacks: Object.fromEntries([
            ...Object.entries(stored.fallbacks).filter(([id]) => !ids.includes(id)),
            ...rows.flatMap((row) =>
              row.critical && row.how ? [[row.assetId, row.how] as const] : [],
            ),
          ]),
        };
        await tx
          .insert(companyPolicyConfig)
          .values({ companyId: ctx.companyId, policyType: type, config })
          .onConflictDoUpdate({
            target: [companyPolicyConfig.companyId, companyPolicyConfig.policyType],
            set: { config, updatedAt: new Date() },
          });
        return {
          changed: changed.length,
          critical: rows.flatMap((row) =>
            row.critical ? [before.get(row.assetId)?.name ?? ""] : [],
          ),
        };
      });

      const locale = await seedLocale(ctx.db, ctx.userId, ctx.companyId);
      await appendNote(
        ctx.db,
        ref.statusId,
        noteLine(new Date(), criticalNote(locale, result.critical)),
      );
      await logAudit({
        companyId: ctx.companyId,
        userId: ctx.userId,
        action: "durchgang.critical",
        entityType: "requirement",
        entityId: ref.requirementId,
        description: `${ref.code} processes that must keep running checked`,
        newValue: { checked: rows.length, changed: result.changed },
      });
      if (result.changed > 0) recheck(ctx, "asset");
      return { changed: result.changed };
    }),

  /**
   * A policy written from the walk's template (the 2.4 Leitlinie, the 3.1 incident plan): its
   * sections and the clauses the person chose, in the record language, with the company's name
   * and the item's saved answers. The choice is kept in the company's policy config and the text
   * in one `policy` row of the requirement. A text that changes goes back to draft, because what
   * management approved was the earlier one.
   */
  writePolicy: durchgangWrite
    .input(
      z.object({
        code,
        /** Null keeps the stored choice: the text is still written, with no clause or the old ones. */
        clauses: z.array(z.string().min(1).max(60)).max(50).nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ref = await durchgangItem(ctx.db, actorOf(ctx), input.code);
      const [draft, intake] = await Promise.all([
        policyDraftOf(ctx, input.code),
        ctx.db.query.companyCategoryIntake.findFirst({
          where: and(
            eq(companyCategoryIntake.assessmentId, ref.assessmentId),
            eq(companyCategoryIntake.categoryId, ref.categoryId),
          ),
          columns: { answers: true },
        }),
      ]);
      const known = new Set(draft.document.clauses.map((c) => c.id));
      const clauses = (input.clauses ?? draft.clauses).filter((id) => known.has(id));
      // The answers as saved: the queue stores a screen's answers before the policy after it.
      const names = {
        ...policyNames(
          draft.company,
          askedFields(itemOf(input.code)),
          intake?.answers ?? {},
        ),
        ...draft.lists,
      };
      const title = policyTitle(draft.document, names);
      const content = policyText(draft.document, clauses, names);
      const { type } = draft;
      const config = { clauses, fallbacks: draft.fallbacks };

      const changed = await ctx.db.transaction(async (tx) => {
        // One writer per company at a time, so two tabs add the policy once.
        await tx
          .select({ id: company.id })
          .from(company)
          .where(eq(company.id, ctx.companyId))
          .for("update");
        if (input.clauses !== null) {
          await tx
            .insert(companyPolicyConfig)
            .values({ companyId: ctx.companyId, policyType: type, config })
            .onConflictDoUpdate({
              target: [companyPolicyConfig.companyId, companyPolicyConfig.policyType],
              set: { config, updatedAt: new Date() },
            });
        }
        const [stored] = await tx
          .select({ id: policy.id, content: policy.content })
          .from(policy)
          .where(
            and(
              eq(policy.companyId, ctx.companyId),
              eq(policy.requirementId, ref.requirementId),
              eq(policy.type, type),
            ),
          );
        if (!stored) {
          await tx.insert(policy).values({
            companyId: ctx.companyId,
            requirementId: ref.requirementId,
            title,
            type,
            content,
          });
          return true;
        }
        if (stored.content === content) return false;
        await tx
          .update(policy)
          .set({
            title,
            content,
            status: "draft",
            effectiveFrom: null,
            updatedAt: new Date(),
          })
          .where(and(eq(policy.id, stored.id), eq(policy.companyId, ctx.companyId)));
        return true;
      });
      if (changed) recheck(ctx, "policy");
      return { changed };
    }),

  /**
   * The signature page of a policy the walk wrote: the version and the day management signed
   * become the policy's version and its start, and the policy is approved. The approval columns
   * (who, when, in which role) stay untouched: they are a sign-off no client path writes.
   */
  approvePolicy: durchgangWrite
    .input(
      z.object({
        code,
        version: policyInsertSchema.shape.version.unwrap(),
        approvedOn: z.iso.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ref = await durchgangItem(ctx.db, actorOf(ctx), input.code);
      const type = policyTypeOf(input.code);
      const approved = await ctx.db
        .update(policy)
        .set({
          status: "approved",
          version: input.version,
          effectiveFrom: input.approvedOn,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(policy.companyId, ctx.companyId),
            eq(policy.requirementId, ref.requirementId),
            eq(policy.type, type),
          ),
        )
        .returning({ id: policy.id });
      if (approved.length > 0) recheck(ctx, "policy");
      return { approved: approved.length > 0 };
    }),
});
