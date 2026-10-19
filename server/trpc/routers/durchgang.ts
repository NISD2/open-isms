import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { createTranslator } from "next-intl";
import { z } from "zod";
import { CATALOG_BY_ID } from "@/lib/asset-inventory/catalog";
import {
  CATALOG_LABELS,
  catalogIdByName,
  catalogIdOf,
  catalogLabel,
  isBackupSystem,
  nameKey,
  onRegister,
  ownDescription,
} from "@/lib/asset-inventory/catalog-labels";
import { CUSTOM_ASSET_TYPE } from "@/lib/asset-inventory/types";
import { logAudit } from "@/lib/audit";
import { isFreeMailAddress } from "@/lib/auth/free-mail";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { mayWalkDurchgang } from "@/lib/billing/access";
import { FREQUENCIES, IMPACTS, type RiskLevel } from "@/lib/compliance/bsi-200-3";
import { invalidateModuleSignOffs } from "@/lib/compliance/module-recheck";
import type { CountableModule } from "@/lib/compliance/module-tables";
import { getDefaultPolicyConfig } from "@/lib/compliance/policy-config-defaults";
import { getDefaultMethodology } from "@/lib/compliance/risk-methodology-defaults";
import { seedLocale } from "@/lib/compliance/seed-locale";
import { MAX_DECLINE_REASON, MIN_DECLINE_REASON } from "@/lib/compliance/sign-off-state";
import {
  ALL_ITEMS,
  type AnyScreen,
  agreementsNote,
  approvalOf,
  approvedNote,
  askedFields,
  backupsNote,
  contactSuggestions,
  criticalNote,
  cryptoNote,
  type DurchgangAction,
  declinedNote,
  gapLines,
  levelOf,
  loginsNote,
  MANAGEMENT_ROLE,
  methodNote,
  noteLine,
  POLICY_TEMPLATES,
  type ProviderLink,
  policiesOf,
  policyNames,
  policyText,
  policyTitle,
  ratingKey,
  ratingText,
  recordDay,
  resolveItem,
  SUPPLIER_LEVEL,
  standingOf,
  toScale,
  treatmentFor,
  WAIT_REASONS,
  WALK_FRAMEWORKS,
  WALK_LOCALES,
  WALKS,
  waitingNote,
  walkOfCode,
} from "@/lib/durchgang";
import { renderDocumentMarkdown } from "@/lib/mail/markdown";
import { getRegistrationPortals } from "@/lib/registration-portals";
import {
  asset,
  assetProvider,
  auditLog,
  company,
  companyCategoryIntake,
  companyPolicyConfig,
  companyRequirementStatus,
  companyRiskMethodology,
  improvementItem,
  policy,
  requirement,
  risk,
  riskAsset,
  riskSupplier,
  supplier,
} from "@/schema";
import { improvementItemInsertSchema } from "@/schema/validators";
import { verifyMemberReferences } from "../guards";
import {
  appendNote,
  type DurchgangActor,
  declineReason,
  durchgangItem,
  refuseSettled,
  walkItemRef,
  walkPolicyRows,
  walkRows,
  walkStates,
} from "../helpers/durchgang";
import {
  shownGapsOf,
  signWaiting,
  waitingForManagement,
} from "../helpers/durchgang-approval";
import { MEASURE_SOURCE, openMeasureOf, walkMeasuresOf } from "../helpers/durchgang-gaps";
import {
  addAssetsInput,
  itemCode as code,
  rateInput,
  recordAgreementsInput,
  recordBackupsInput,
  recordCriticalInput,
  recordLoginsInput,
  specifyAssetsInput,
  writePolicyInput,
} from "../helpers/durchgang-inputs";
import {
  CRYPTO_LIST,
  cryptoListOf,
  policyDraftOf,
  policyTypeOf,
  storedConfigOf,
} from "../helpers/durchgang-policy";
import {
  headlineOf,
  NAMESPACES,
  recordLocaleOf,
  walkItem,
} from "../helpers/durchgang-words";
import { approvePolicies, WITHDRAWN_APPROVAL } from "../helpers/policy-approval";
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
 * routers do. A new or renamed row reverts every framework that reads the register; facts only one
 * item's walk records (`of`, that item's code) revert only that walk's framework.
 */
const recheck = (
  ctx: { db: TRPCContext["db"]; companyId: string; userId: string },
  module: CountableModule,
  of?: string,
) => {
  const only = of === undefined ? undefined : walkOfCode(of)?.framework;
  return invalidateModuleSignOffs(
    ctx.db,
    ctx.companyId,
    module,
    ctx.userId,
    only ? [only] : undefined,
  ).catch((err) => console.error(`[background] ${module} recheck:`, err));
};

/** The walk's audit entry: its action is one the walk's state and overview know. */
const logWalk = (entry: Parameters<typeof logAudit>[0] & { action: DurchgangAction }) =>
  logAudit(entry);

/** How many steps a stored scale has; the column is JSON, so its shape is checked, not assumed. */
const steps = (levels: unknown) => (Array.isArray(levels) ? levels.length : 0);

const actorOf = (ctx: {
  companyId: string;
  userId: string;
  session: { role: string };
}): DurchgangActor => ({
  companyId: ctx.companyId,
  userId: ctx.userId,
  role: ctx.session.role,
});

/** A walk-level procedure names its walk; an item-level one names an item, which names its walk. */
const framework = z.object({ framework: z.enum(WALK_FRAMEWORKS) });

export const durchgangRouter = router({
  /** Where each item of the company's walk stands. Read on the server by every Durchgang page. */
  walk: durchgangProcedure
    .input(framework)
    .query(({ ctx, input }) => walkStates(ctx.db, ctx.companyId, WALKS[input.framework])),

  /**
   * When the company last took over the BSI method here, or null. A method row alone says nothing:
   * `risk.getMethodology` writes the default on its first read, before anyone chose it.
   */
  adoption: durchgangProcedure.query(async ({ ctx }) => {
    const row = await ctx.db.query.auditLog.findFirst({
      where: and(
        eq(auditLog.companyId, ctx.companyId),
        eq(auditLog.action, "durchgang.adopted" satisfies DurchgangAction),
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
        authorityUrl: p.authorityUrl,
        csirt: p.csirt,
        portalName: p.portalName,
        portalUrl: p.portalUrl,
        status: p.status,
      })),
    };
  }),

  /**
   * Common answers for the vulnerability report address, read off the company's contact email, or
   * the caller's own when the company has none: setting the company up no longer asks for one. A
   * free-mail address names no company domain, so it suggests nothing.
   */
  contactSuggestions: durchgangProcedure.query(async ({ ctx }) => {
    const org = await ctx.db.query.company.findFirst({
      where: eq(company.id, ctx.companyId),
      columns: { contactEmail: true },
    });
    const own = ctx.session.user.email;
    const fallback = own && !isFreeMailAddress(own) ? own : null;
    return contactSuggestions(org?.contactEmail ?? fallback);
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
      refuseSettled(ref);
      const locale = await seedLocale(ctx.db, ctx.userId, ctx.companyId);
      const reason = NAMESPACES[locale].waitReasons[input.reason];
      await appendNote(
        ctx.db,
        ref.statusId,
        noteLine(new Date(), waitingNote(locale, reason, input.note || null)),
      );
      await logWalk({
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
      // Picked up again: an earlier decision not to do it no longer stands either.
      await declineReason(ctx.db, ctx.companyId, ref.statusId, null);
      await logWalk({
        companyId: ctx.companyId,
        userId: ctx.userId,
        // An assistant picks an item up as it fills it (lib/mcp/tools.ts): the entry names it.
        userAgent: ctx.userAgent,
        action: "durchgang.resumed",
        entityType: "requirement",
        entityId: ref.requirementId,
        description: `${ref.code} resumed`,
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
    await logWalk({
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
   * to sign in the approval. Refused on an item the law leaves no choice on (`mustDo`). The
   * written reason goes into the notes and onto the row as the reason the signature will record
   * (`notApplicableReason`); the status stays until management signs. The audit row carries no
   * free text.
   */
  decline: durchgangProcedure
    .input(
      z.object({
        code,
        reason: z.string().trim().min(MIN_DECLINE_REASON).max(MAX_DECLINE_REASON),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (walkItem(input.code).mustDo) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `${input.code} is a duty the law leaves no choice on.`,
        });
      }
      const ref = await durchgangItem(ctx.db, actorOf(ctx), input.code);
      refuseSettled(ref);
      const locale = await seedLocale(ctx.db, ctx.userId, ctx.companyId);
      await declineReason(ctx.db, ctx.companyId, ref.statusId, input.reason);
      await appendNote(
        ctx.db,
        ref.statusId,
        noteLine(new Date(), declinedNote(locale, input.reason)),
      );
      await logWalk({
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
      // Filled in after all: an earlier decision not to do it no longer stands.
      await declineReason(ctx.db, ctx.companyId, ref.statusId, null);
      await logWalk({
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
   * seed language like every other default the platform writes, each with the catalogue item it
   * is. An item already listed, under any name, is skipped, so a second pass adds only what is
   * new, and nothing is ever deleted here.
   */
  addAssets: durchgangWrite
    // The input is shared with the MCP tools, which save this screen for an assistant.
    .input(addAssetsInput)
    .mutation(async ({ ctx, input }) => {
      const labels = CATALOG_LABELS[await seedLocale(ctx.db, ctx.userId, ctx.companyId)];
      const wanted = [
        ...input.catalogIds.flatMap((id) => {
          const item = CATALOG_BY_ID.get(id);
          const label = labels[id]?.label;
          return item && label
            ? [{ name: label, type: item.category, catalogId: id }]
            : [];
        }),
        ...input.custom.map((c) => ({
          name: c.name,
          type: CUSTOM_ASSET_TYPE[c.layer],
          catalogId: catalogIdByName(c.name),
        })),
      ];
      const existing = await ctx.db.query.asset.findMany({
        where: eq(asset.companyId, ctx.companyId),
        columns: { catalogId: true, name: true, description: true },
      });
      const { listed } = onRegister(existing);
      const takenIds = new Set(listed);
      const takenNames = new Set(existing.map((a) => nameKey(a.name)));
      const keyOf = (a: (typeof wanted)[number]) => a.catalogId ?? nameKey(a.name);
      // The first spelling of a thing wins, and a thing already on the list is left alone.
      const fresh = wanted.filter(
        (a, i) =>
          !(a.catalogId !== null && takenIds.has(a.catalogId)) &&
          !takenNames.has(nameKey(a.name)) &&
          wanted.findIndex((b) => keyOf(b) === keyOf(a)) === i,
      );
      if (fresh.length > 0) {
        await ctx.db.insert(asset).values(
          fresh.map((a) => ({
            companyId: ctx.companyId,
            name: a.name,
            type: a.type,
            catalogId: a.catalogId,
          })),
        );
        recheck(ctx, "asset");
      }
      return { added: fresh.length };
    }),

  /**
   * Who provides each of the company's assets (`asset_provider`), any number per asset. The
   * tenant filter runs through the asset, so a link is only ever read for the company's own.
   */
  providers: durchgangProcedure.query(({ ctx }) =>
    ctx.db
      .select({ assetId: assetProvider.assetId, supplierId: assetProvider.supplierId })
      .from(assetProvider)
      .innerJoin(asset, eq(asset.id, assetProvider.assetId))
      .where(eq(asset.companyId, ctx.companyId)),
  ),

  /**
   * 2.2, which one exactly, what it is for and from whom. Each row gives the asset the name the
   * company knows it by, what it does there in the company's words, and its providers, each found
   * on the company's supplier list by name or added to it; the asset's links then match exactly
   * the names sent, so a name left out unlinks that provider and leaves it listed. A row that
   * changes keeps the catalogue item it was listed as in `catalog_id`, so a rename does not lose
   * what kind of thing it is. An omitted description keeps the stored one.
   */
  specifyAssets: durchgangWrite
    // The input is shared with the MCP tools, which save this screen for an assistant.
    .input(specifyAssetsInput)
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
            catalogId: asset.catalogId,
            name: asset.name,
            description: asset.description,
            hosting: asset.hosting,
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
          .flatMap((r) => r.providers)
          .filter(
            (name, i, all) =>
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

        // The assets are the company's (checked above), so their links are too.
        const linked = await tx
          .select({
            assetId: assetProvider.assetId,
            supplierId: assetProvider.supplierId,
          })
          .from(assetProvider)
          .where(inArray(assetProvider.assetId, ids));
        const wanted = input.rows.flatMap((row) =>
          [
            ...new Set(
              row.providers.flatMap((name) => supplierOf.get(nameKey(name)) ?? []),
            ),
          ].map((supplierId) => ({ assetId: row.id, supplierId })),
        );
        const pair = (l: ProviderLink) => `${l.assetId}:${l.supplierId}`;
        const keep = new Set(wanted.map(pair));
        const had = new Set(linked.map(pair));
        const unlink = linked.filter((l) => !keep.has(pair(l)));
        const link = wanted.filter((l) => !had.has(pair(l)));
        for (const l of unlink) {
          await tx
            .delete(assetProvider)
            .where(
              and(
                eq(assetProvider.assetId, l.assetId),
                eq(assetProvider.supplierId, l.supplierId),
              ),
            );
        }
        if (link.length > 0) {
          await tx.insert(assetProvider).values(link).onConflictDoNothing();
        }

        const before = new Map(owned.map((a) => [a.id, a]));
        const changes = input.rows.flatMap((row) => {
          const was = before.get(row.id);
          if (!was) return [];
          const description =
            row.description === undefined ? undefined : row.description || null;
          const described =
            description !== undefined && description !== ownDescription(was);
          const hosted = row.hosting !== undefined && row.hosting !== was.hosting;
          if (row.name === was.name && !described && !hosted) return [];
          return [
            {
              id: row.id,
              name: row.name,
              // Read before the name or description that told it changes.
              catalogId: catalogIdOf(was),
              ...(described ? { description } : {}),
              ...(hosted ? { hosting: row.hosting } : {}),
            },
          ];
        });
        for (const { id, ...change } of changes) {
          await tx
            .update(asset)
            .set({ ...change, updatedAt: new Date() })
            .where(and(eq(asset.id, id), eq(asset.companyId, ctx.companyId)));
        }
        const touched = new Set([
          ...changes.map((r) => r.id),
          ...[...unlink, ...link].map((l) => l.assetId),
        ]);
        return { updated: touched.size, suppliersAdded: added.length };
      });
      if (result.updated > 0) recheck(ctx, "asset");
      if (result.suppliersAdded > 0) recheck(ctx, "supplier");
      return result;
    }),

  /**
   * 2.2: a second thing of the same kind, for example a second CRM used for other work, since
   * BSI-Standard 200-2 (8.1.1) groups only alike things used alike. It takes the kind's type and
   * catalogue item and a numbered name the person then replaces; what it is for is its own, so the
   * first one's description is not copied.
   */
  addAnotherAsset: durchgangWrite
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const source = await ctx.db.query.asset.findFirst({
        where: and(eq(asset.id, input.id), eq(asset.companyId, ctx.companyId)),
        columns: { catalogId: true, name: true, type: true, description: true },
      });
      if (!source) throw new TRPCError({ code: "NOT_FOUND" });
      const catalogId = catalogIdOf(source);
      const locale = await seedLocale(ctx.db, ctx.userId, ctx.companyId);
      const kind = (catalogLabel(catalogId, locale) ?? source.name).slice(0, 240);
      const existing = await ctx.db.query.asset.findMany({
        where: eq(asset.companyId, ctx.companyId),
        columns: { name: true },
      });
      const taken = new Set(existing.map((a) => nameKey(a.name)));
      // One more candidate than there are names, so one is always free.
      const number = Array.from({ length: existing.length + 1 }, (_, i) => i + 2).find(
        (n) => !taken.has(nameKey(`${kind} ${n}`)),
      );
      const [added] = await ctx.db
        .insert(asset)
        .values({
          companyId: ctx.companyId,
          name: `${kind} ${number ?? existing.length + 2}`,
          type: source.type,
          catalogId,
        })
        .returning({ id: asset.id });
      recheck(ctx, "asset");
      return { id: added?.id ?? null };
    }),

  /**
   * 2.3: one rating per listed asset or supplier on the two 200-3 scales. A thing with no risk
   * yet gets one, linked to it, with the treatment its level suggests; a thing with exactly one
   * risk on these scales has that risk re-rated, and its treatment follows only while it is still
   * the walk's proposal; anything else is worked on in the risk register and left alone here. A
   * supplier's own register level follows its rating. A row's note, where one is sent, becomes
   * the risk's treatment description; an emptied note clears it.
   */
  rate: durchgangWrite
    // The input is shared with the MCP tools, which save this screen for an assistant.
    .input(rateInput)
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
          note: risk.treatmentDescription,
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
            standing.rating.impact === rating.impact &&
            (row.note === undefined || row.note === standing.note);
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
            ...(row.note === undefined ? {} : { treatmentDescription: row.note || null }),
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
   * the company's own rows, and only where a value changed; every row sent gets
   * `agreements_checked_at`, the record that a row with neither agreement was looked at.
   */
  recordAgreements: durchgangWrite
    // The input is shared with the MCP tools, which save this screen for an assistant.
    .input(recordAgreementsInput)
    .mutation(async ({ ctx, input }) => {
      const screens: readonly AnyScreen[] = walkItem(input.code).screens;
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
      // Every row sent was looked at, also one with nothing agreed, whose answers equal the defaults.
      await ctx.db
        .update(supplier)
        .set({ agreementsCheckedAt: new Date() })
        .where(
          and(eq(supplier.customerCompanyId, ctx.companyId), inArray(supplier.id, ids)),
        );
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
      await logWalk({
        companyId: ctx.companyId,
        userId: ctx.userId,
        action: "durchgang.agreements",
        entityType: "requirement",
        entityId: ref.requirementId,
        description: `${ref.code} supplier agreements checked`,
        newValue: { checked: rows.length, changed: changed.length },
      });
      if (changed.length > 0) recheck(ctx, "supplier", input.code);
      return { changed: changed.length };
    }),

  /**
   * 11.1: whether signing in to each listed program and remote access takes a second factor, or
   * that nobody knows yet (null). Only `has_mfa` is written, only on the company's own assets, and
   * only where it changed. The column defaults to false, so the item's trail is the record that a
   * row was actually answered "no".
   */
  recordLogins: durchgangWrite
    // The input is shared with the MCP tools, which save this screen for an assistant.
    .input(recordLoginsInput)
    .mutation(async ({ ctx, input }) => {
      const screens: readonly AnyScreen[] = walkItem(input.code).screens;
      if (!screens.some((s) => s.kind === "logins")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `${input.code} records no sign-ins.`,
        });
      }
      const ref = await durchgangItem(ctx.db, actorOf(ctx), input.code);
      // A factor is only recorded where signing in takes one.
      const rows = [
        ...new Map(
          input.rows.map((r) => [r.assetId, { ...r, method: r.mfa ? r.method : null }]),
        ).values(),
      ];
      const ids = rows.map((r) => r.assetId);
      const owned = await ctx.db
        .select({
          id: asset.id,
          name: asset.name,
          mfa: asset.hasMfa,
          method: asset.mfaMethod,
        })
        .from(asset)
        .where(and(eq(asset.companyId, ctx.companyId), inArray(asset.id, ids)));
      if (owned.length !== ids.length) throw new TRPCError({ code: "NOT_FOUND" });

      const before = new Map(owned.map((a) => [a.id, a]));
      // Null is "not known yet", a value of its own, so it is compared as it is stored.
      const changed = rows.filter((row) => {
        const was = before.get(row.assetId);
        return was !== undefined && (row.mfa !== was.mfa || row.method !== was.method);
      });
      for (const row of changed) {
        await ctx.db
          .update(asset)
          .set({ hasMfa: row.mfa, mfaMethod: row.method, updatedAt: new Date() })
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
              method: row.method,
            })),
          ),
        ),
      );
      await logWalk({
        companyId: ctx.companyId,
        userId: ctx.userId,
        action: "durchgang.logins",
        entityType: "requirement",
        entityId: ref.requirementId,
        description: `${ref.code} sign-ins checked`,
        newValue: { checked: rows.length, changed: changed.length },
      });
      if (changed.length > 0) recheck(ctx, "asset", input.code);
      return { changed: changed.length };
    }),

  /**
   * 4.4: per backup system on the company's list, how often it backs up and the day of its last
   * restore that worked, in the asset's own columns, which the requirement page shows too. Only
   * the company's own backup systems are written, and only where an answer changed; an emptied
   * day clears it. An omitted frequency keeps the stored one, which the asset page may have
   * written as free text that none of the walk's options name.
   */
  recordBackups: durchgangWrite
    // The input is shared with the MCP tools, which save this screen for an assistant.
    .input(recordBackupsInput)
    .mutation(async ({ ctx, input }) => {
      const words = resolveItem(
        NAMESPACES[await seedLocale(ctx.db, ctx.userId, ctx.companyId)],
        walkItem(input.code),
      );
      const screen = words.ok
        ? words.value.screens.find((s) => s.kind === "backups")
        : undefined;
      if (screen?.kind !== "backups") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `${input.code} records no backups.`,
        });
      }
      const ref = await durchgangItem(ctx.db, actorOf(ctx), input.code);
      const rows = [...new Map(input.rows.map((r) => [r.assetId, r])).values()];
      const ids = rows.map((r) => r.assetId);
      const owned = await ctx.db
        .select({
          id: asset.id,
          catalogId: asset.catalogId,
          name: asset.name,
          description: asset.description,
          frequency: asset.backupFrequency,
          lastRestore: asset.lastBackupTestDate,
        })
        .from(asset)
        .where(and(eq(asset.companyId, ctx.companyId), inArray(asset.id, ids)));
      if (owned.length !== ids.length || !owned.every(isBackupSystem)) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      const before = new Map(owned.map((a) => [a.id, a]));
      const kept = (row: (typeof rows)[number]) =>
        row.frequency === undefined
          ? (before.get(row.assetId)?.frequency ?? null)
          : row.frequency;
      const changed = rows.filter((row) => {
        const was = before.get(row.assetId);
        return (
          was !== undefined &&
          (kept(row) !== was.frequency || row.lastRestore !== was.lastRestore)
        );
      });
      for (const row of changed) {
        await ctx.db
          .update(asset)
          .set({
            backupFrequency: kept(row),
            lastBackupTestDate: row.lastRestore,
            updatedAt: new Date(),
          })
          .where(and(eq(asset.id, row.assetId), eq(asset.companyId, ctx.companyId)));
      }
      const locale = await seedLocale(ctx.db, ctx.userId, ctx.companyId);
      await appendNote(
        ctx.db,
        ref.statusId,
        noteLine(
          new Date(),
          backupsNote(
            locale,
            rows.map((row) => ({
              name: before.get(row.assetId)?.name ?? "",
              frequency: row.frequency ? screen.copy.options[row.frequency] : kept(row),
              lastRestore: row.lastRestore,
            })),
          ),
        ),
      );
      await logWalk({
        companyId: ctx.companyId,
        userId: ctx.userId,
        action: "durchgang.backups",
        entityType: "requirement",
        entityId: ref.requirementId,
        description: `${ref.code} backups recorded`,
        newValue: { systems: rows.length, changed: changed.length },
      });
      if (changed.length > 0) recheck(ctx, "asset", input.code);
      return { changed: changed.length };
    }),

  /**
   * 9.1: the company's crypto list, or the default list while it has not taken one over: BSI
   * TR-02102, or NÚKIB's minimum requirements for a Czech account.
   */
  cryptoList: durchgangProcedure.query(async ({ ctx }) => {
    const stored = await cryptoListOf(ctx.db, ctx.companyId);
    if (stored) return { stored: true as const, list: stored };
    const locale = await seedLocale(ctx.db, ctx.userId, ctx.companyId);
    return { stored: false as const, list: getDefaultPolicyConfig(CRYPTO_LIST, locale) };
  }),

  /**
   * 9.1: takes the default list over as the company's crypto list, as an explicit write. A
   * list the company keeps already, edited on the requirement page, is never overwritten.
   */
  adoptCrypto: durchgangWrite
    .input(z.object({ code }))
    .mutation(async ({ ctx, input }) => {
      const screens: readonly AnyScreen[] = walkItem(input.code).screens;
      if (!screens.some((s) => s.kind === "crypto")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `${input.code} keeps no crypto list.`,
        });
      }
      const ref = await durchgangItem(ctx.db, actorOf(ctx), input.code);
      const locale = await seedLocale(ctx.db, ctx.userId, ctx.companyId);
      const [row] = await ctx.db
        .insert(companyPolicyConfig)
        .values({
          companyId: ctx.companyId,
          policyType: CRYPTO_LIST,
          config: getDefaultPolicyConfig(CRYPTO_LIST, locale),
        })
        .onConflictDoNothing({
          target: [companyPolicyConfig.companyId, companyPolicyConfig.policyType],
        })
        .returning({ id: companyPolicyConfig.id });
      if (!row) return { adopted: false };
      await appendNote(ctx.db, ref.statusId, noteLine(new Date(), cryptoNote(locale)));
      await logWalk({
        companyId: ctx.companyId,
        userId: ctx.userId,
        action: "durchgang.crypto_adopted",
        entityType: "requirement",
        entityId: ref.requirementId,
        description: `${ref.code} ${locale === "cs" ? "NÚKIB" : "BSI TR-02102"} crypto list adopted`,
      });
      return { adopted: true };
    }),

  /**
   * The policies the walk wrote for the company, with their state, for the approval screen. The
   * stored text comes as HTML, so management reads exactly what it approves without needing the
   * category each document belongs to. It is rendered as a document: no raw HTML, safe links,
   * nothing loaded from outside, and every link's address in view.
   */
  walkPolicies: durchgangProcedure.input(framework).query(async ({ ctx, input }) => {
    const walk = WALKS[input.framework];
    const [rows, states] = await Promise.all([
      walkPolicyRows(ctx.db, ctx.companyId, walk),
      walkRows(ctx.db, ctx.companyId, walk),
    ]);
    // A draft of an item decided against is not management's to approve (`waitingForManagement`).
    const declined = (code: string) => states.items.get(code)?.state.kind === "declined";
    return Promise.all(
      rows
        .filter((row) => row.status !== "draft" || !declined(row.code))
        .map(async ({ content, ...row }) => ({
          ...row,
          html: await renderDocumentMarkdown(content ?? ""),
        })),
    );
  }),

  /**
   * The items management's approval also signs off, for the approval screen to list, each with
   * its headline in the viewer's language, resolved as the walk resolves it.
   */
  awaitingSignature: durchgangProcedure
    .input(framework.extend({ locale: z.enum(WALK_LOCALES) }))
    .query(async ({ ctx, input }) => {
      const walk = WALKS[input.framework];
      const { items } = await waitingForManagement(ctx.db, ctx.companyId, walk);
      return items.map(({ code, drafts, reason }) => ({
        code,
        drafts,
        headline: headlineOf(code, recordLocaleOf(walk, input.locale)),
        /** The written reason when the company decided not to do it; null when filled in. */
        declined: reason,
      }));
    }),

  /**
   * What the company's own answers still leave open (`gapsOf`), for management to see on the
   * approval before it signs; a step set aside comes with its headline in the viewer's language.
   */
  gaps: durchgangProcedure
    .input(framework.extend({ locale: z.enum(WALK_LOCALES) }))
    .query(async ({ ctx, input }) =>
      // The open-point rules read NIS 2 records (`gapsOf`); another walk lists none yet.
      input.framework === "nis2" ? shownGapsOf(ctx.db, ctx.companyId, input.locale) : [],
    ),

  /** Who takes care of each open point and by when, by step, for the approval and the export. */
  measures: durchgangProcedure.query(({ ctx }) => walkMeasuresOf(ctx.db, ctx.companyId)),

  /**
   * 7.3: who takes care of an open point and by when (Art. 21(4) NIS 2: corrective measures
   * without undue delay). The point becomes a line on the improvement register (7.4), the list the
   * requirement page and the dashboard show, and later calls change that line while it is open.
   * The line records what was open when it was made, in the company's record language; a call
   * that names nobody and no day opens none.
   *
   * Anyone who walks may plan, as anyone in the company may edit the register itself
   * (`improvement` router), and like that router each change rechecks the sign-offs resting on
   * the register (3.5, 7.4).
   */
  planMeasure: durchgangWrite
    .input(
      improvementItemInsertSchema
        .pick({ assignedTo: true, targetDate: true })
        .required()
        .extend({ code }),
    )
    .mutation(async ({ ctx, input }) => {
      const [ref, locale] = await Promise.all([
        walkItemRef(ctx.db, ctx.companyId, input.code),
        seedLocale(ctx.db, ctx.userId, ctx.companyId),
        verifyMemberReferences(ctx.db, [input.assignedTo], ctx.companyId),
      ]);
      const plan = { assignedTo: input.assignedTo, targetDate: input.targetDate };
      const wrote = await ctx.db.transaction(async (tx) => {
        // Two saves for one point at once must not open two lines: the step's status row is the lock.
        await tx
          .select({ id: companyRequirementStatus.id })
          .from(companyRequirementStatus)
          .where(eq(companyRequirementStatus.id, ref.statusId))
          .for("update");
        const [open] = await tx
          .select({ id: improvementItem.id })
          .from(improvementItem)
          .where(openMeasureOf(ctx.companyId, ref.requirementId))
          .orderBy(desc(improvementItem.createdAt))
          .limit(1);
        if (open) {
          await tx
            .update(improvementItem)
            .set({ ...plan, updatedAt: new Date() })
            .where(
              and(
                eq(improvementItem.id, open.id),
                eq(improvementItem.companyId, ctx.companyId),
              ),
            );
          return true;
        }
        if (plan.assignedTo === null && plan.targetDate === null) return false;
        const headline = headlineOf(input.code, locale);
        const t = createTranslator({
          locale,
          messages: NAMESPACES[locale],
          namespace: "ui.approve.gaps",
        });
        const openPoints = gapLines(await shownGapsOf(tx, ctx.companyId, locale), t)
          .filter((line) => line.code === input.code)
          .map((line) => line.text);
        const req = await tx.query.requirement.findFirst({
          where: eq(requirement.id, ref.requirementId),
          columns: { priority: true },
        });
        if (!req) throw new Error(`No requirement ${ref.requirementId}.`);
        await tx.insert(improvementItem).values({
          ...plan,
          companyId: ctx.companyId,
          source: MEASURE_SOURCE,
          sourceReferenceId: ref.requirementId,
          title: `${input.code} ${headline}`.slice(0, 500),
          description: openPoints.join("\n") || headline,
          priority: req.priority,
        });
        return true;
      });
      if (wrote) recheck(ctx, "improvement_item");
      return { code: input.code, ...plan };
    }),

  /**
   * 7.3: management approves the drafts it ticked, signed in with its own account. The approval
   * is that person's, now: who, when and in which role go on each policy, and the day in Berlin
   * becomes its start and its version. Each document is resolved through its own item, so
   * approving it takes what writing it takes, and only drafts change: an approved document keeps
   * its day. The review's trail names every document approved.
   *
   * The same click signs off the items waiting for management that the screen showed (`sign`),
   * once their documents are approved (see `signWaiting`), so the journey, the register and the
   * review cycle see them done. It needs no document to approve when only signatures are left.
   */
  approvePolicies: durchgangWrite
    .input(
      z.object({
        code,
        types: z.array(z.enum(POLICY_TEMPLATES)).max(POLICY_TEMPLATES.length),
        sign: z.array(code).max(ALL_ITEMS.length),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const walk = walkOfCode(input.code);
      if (!walk || approvalOf(walk)?.code !== input.code) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `${input.code} approves no policies.`,
        });
      }
      if (ctx.session.jobTitle !== MANAGEMENT_ROLE) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only management approves these documents.",
        });
      }
      const now = new Date();
      const approvedOn = recordDay(now);
      const chosen = policiesOf(walk).filter((p) => input.types.includes(p.policy));
      if (chosen.length !== new Set(input.types).size) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Not a walk policy." });
      }
      // Management's authority is its role, not a category, so no category is checked.
      const ref = await walkItemRef(ctx.db, ctx.companyId, input.code);
      const targets = await Promise.all(
        chosen.map(async (p) => ({
          type: p.policy,
          owner: await walkItemRef(ctx.db, ctx.companyId, p.code),
        })),
      );
      const approved = await ctx.db.transaction((tx) =>
        approvePolicies(tx, {
          companyId: ctx.companyId,
          userId: ctx.userId,
          approverRole: MANAGEMENT_ROLE,
          approvedOn,
          now,
          targets: targets.map(({ type, owner }) => ({
            type,
            requirementId: owner.requirementId,
          })),
        }),
      );
      if (approved.length > 0) {
        const locale = await seedLocale(ctx.db, ctx.userId, ctx.companyId);
        await appendNote(
          ctx.db,
          ref.statusId,
          noteLine(now, approvedNote(locale, approvedOn, approved)),
        );
        await logWalk({
          companyId: ctx.companyId,
          userId: ctx.userId,
          action: "durchgang.policies_approved",
          entityType: "requirement",
          entityId: ref.requirementId,
          description: `${ref.code} management approved ${approved.length} walk documents`,
          newValue: { approvedOn, count: approved.length },
        });
        // No policy recheck here, unlike the walk's other writes: approving changes no text a
        // signature vouched for, and the recheck reverts every signed policy-backed requirement,
        // so it would undo signatures on documents this click never touched. Writing a policy
        // (writePolicy) still rechecks.
      }

      const { signed, declined } = await signWaiting(ctx, walk, input.sign, now);
      if (signed.length + declined.length > 0) {
        const codes = signed.map((r) => r.code);
        const decided = declined.map((r) => r.code);
        await logWalk({
          companyId: ctx.companyId,
          userId: ctx.userId,
          action: "durchgang.requirements_signed",
          entityType: "requirement",
          entityId: ref.requirementId,
          description: `${ref.code} management signed off ${[...codes, ...decided].join(", ")}`,
          newValue: { codes, declined: decided },
        });
      }
      return { approved: approved.length, signed: signed.length + declined.length };
    }),

  /** The policy an item writes, as its screen shows it and the server stores it. */
  policyDraft: durchgangProcedure
    .input(z.object({ code }))
    .query(async ({ ctx, input }) => {
      const draft = await policyDraftOf(ctx, input.code);
      return {
        document: draft.document,
        language: draft.language,
        company: draft.company,
        clauses: draft.clauses,
        own: draft.own,
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
    // The input is shared with the MCP tools, which save this screen for an assistant.
    .input(recordCriticalInput)
    .mutation(async ({ ctx, input }) => {
      const screens: readonly AnyScreen[] = walkItem(input.code).screens;
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
      await logWalk({
        companyId: ctx.companyId,
        userId: ctx.userId,
        action: "durchgang.critical",
        entityType: "requirement",
        entityId: ref.requirementId,
        description: `${ref.code} processes that must keep running checked`,
        newValue: { checked: rows.length, changed: result.changed },
      });
      if (result.changed > 0) recheck(ctx, "asset", input.code);
      return { changed: result.changed };
    }),

  /**
   * A policy written from the walk's template (the 2.4 Leitlinie, the 3.1 incident plan): its
   * sections, the clauses the person chose and their own addition, in the record language, with
   * the company's name and the item's saved answers. The choice is kept in the company's policy
   * config and the text in one `policy` row of the requirement. A text that changes goes back to
   * draft and loses its approval, because what management approved was the earlier one.
   */
  writePolicy: durchgangWrite
    // The input is shared with the MCP tools, which save this screen for an assistant.
    .input(writePolicyInput)
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
          askedFields(walkItem(input.code)),
          intake?.answers ?? {},
        ),
        ...draft.lists,
      };
      const own = input.own ?? draft.own;
      const title = policyTitle(draft.document, names);
      const content = policyText(draft.document, clauses, names, own);
      const { type } = draft;
      const config = { clauses, own, fallbacks: draft.fallbacks };

      const changed = await ctx.db.transaction(async (tx) => {
        // One writer per company at a time, so two tabs add the policy once.
        await tx
          .select({ id: company.id })
          .from(company)
          .where(eq(company.id, ctx.companyId))
          .for("update");
        if (input.clauses !== null || input.own !== null) {
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
          .set({ title, content, ...WITHDRAWN_APPROVAL, updatedAt: new Date() })
          .where(and(eq(policy.id, stored.id), eq(policy.companyId, ctx.companyId)));
        return true;
      });
      if (changed) recheck(ctx, "policy", input.code);
      return { changed };
    }),
});
