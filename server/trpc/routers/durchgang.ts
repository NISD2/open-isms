import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { CATALOG_BY_ID } from "@/lib/asset-inventory/catalog";
import {
  CATALOG_LABELS,
  catalogNames,
  isBackupSystem,
  isCatalogName,
  nameKey,
} from "@/lib/asset-inventory/catalog-labels";
import { logAudit } from "@/lib/audit";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { mayWalkDurchgang } from "@/lib/billing/access";
import { FREQUENCIES, IMPACTS, type RiskLevel } from "@/lib/compliance/bsi-200-3";
import { invalidateModuleSignOffs } from "@/lib/compliance/module-recheck";
import { getDefaultPolicyConfig } from "@/lib/compliance/policy-config-defaults";
import { POLICY_CONFIG_SCHEMAS } from "@/lib/compliance/policy-config-schemas";
import { getDefaultMethodology } from "@/lib/compliance/risk-methodology-defaults";
import { seedLocale } from "@/lib/compliance/seed-locale";
import type { DbOrTx } from "@/lib/db";
import {
  type AnyScreen,
  acceptedCryptoText,
  agreementsNote,
  approvedNote,
  askedFields,
  BACKUP_FREQUENCIES,
  backupsNote,
  contactSuggestions,
  criticalNote,
  criticalProcessesText,
  cryptoNote,
  declinedNote,
  levelOf,
  loginsNote,
  MANAGEMENT_ROLE,
  MFA_METHODS,
  marker,
  methodNote,
  noteLine,
  POLICY_LISTS,
  type PolicyList,
  type ProviderLink,
  personText,
  policyNames,
  policyText,
  policyTitle,
  ratingKey,
  ratingText,
  recordDay,
  recoveryOrder,
  recoveryOrderText,
  reportingChannelText,
  resolveItem,
  SUPPLIER_LEVEL,
  standingOf,
  toScale,
  treatmentFor,
  WAIT_REASONS,
  WALK,
  WALK_POLICIES,
  waitingNote,
} from "@/lib/durchgang";
import { renderDocumentMarkdown } from "@/lib/mail/markdown";
import { getRegistrationPortals } from "@/lib/registration-portals";
import durchgangDe from "@/messages/durchgang/de.json";
import durchgangEn from "@/messages/durchgang/en.json";
import {
  asset,
  assetProvider,
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
  user,
} from "@/schema";
import { riskInsertSchema } from "@/schema/validators";
import {
  appendNote,
  type DurchgangActor,
  durchgangItem,
  walkItemRef,
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
 * A walk-written policy's stored choices: the clauses, the company's own words, and for the
 * continuity plan one line per process on how it goes on without IT, by asset id. The config
 * column is JSON, so its shape is checked, not assumed; a part that does not parse reads as empty
 * and leaves the rest.
 */
const STORED_CONFIG = z
  .object({
    clauses: z.array(z.string()).catch([]),
    own: z.string().catch(""),
    fallbacks: z.record(z.string(), z.string()).catch({}),
  })
  .catch({ clauses: [], own: "", fallbacks: {} });

/** The longest addition a company writes into a walk policy in its own words. */
const OWN_MAX = 2000;

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

/** The editor's policy type the crypto list is kept under (the requirement page edits it too). */
const CRYPTO_LIST = "crypto";

/** The company's crypto list as the editor stored it, or null while it has none or a broken one. */
const cryptoListOf = async (db: DbOrTx, companyId: string) => {
  const [row] = await db
    .select({ config: companyPolicyConfig.config })
    .from(companyPolicyConfig)
    .where(
      and(
        eq(companyPolicyConfig.companyId, companyId),
        eq(companyPolicyConfig.policyType, CRYPTO_LIST),
      ),
    );
  const parsed = POLICY_CONFIG_SCHEMAS[CRYPTO_LIST].safeParse(row?.config);
  return parsed.success ? parsed.data : null;
};

/** Where the walk asks who leads in an emergency, which the continuity plan names too. */
const EMERGENCY_LEAD = { code: "3.1", field: "incidentLead" } as const;

/** Who leads in an emergency, as 3.1 saved it, or nothing when 3.1 has no answer yet. */
const emergencyLeadOf = async (db: TRPCContext["db"], companyId: string) => {
  // Only "3.1 has no row yet" means no lead; any other failure must not print a blank plan.
  const ref = await walkItemRef(db, companyId, EMERGENCY_LEAD.code).catch((error) => {
    if (error instanceof TRPCError && error.code === "NOT_FOUND") return null;
    throw error;
  });
  if (!ref) return null;
  const row = await db.query.companyCategoryIntake.findFirst({
    where: and(
      eq(companyCategoryIntake.assessmentId, ref.assessmentId),
      eq(companyCategoryIntake.categoryId, ref.categoryId),
    ),
    columns: { answers: true },
  });
  return row?.answers?.[EMERGENCY_LEAD.field] ?? null;
};

/**
 * What a plan's list names stand for, read off the company's own records: the processes marked
 * `is_critical` with their line, the systems in the order their 2.3 ratings give, where incidents
 * are reported from the company's country, who leads in an emergency from 3.1, and the methods
 * the company's crypto list accepts.
 */
const policyListsOf = async (
  db: TRPCContext["db"],
  companyId: string,
  used: readonly PolicyList[],
  fallbacks: Readonly<Record<string, string>>,
  locale: "de" | "en",
): Promise<Partial<Record<PolicyList, string>>> => {
  const needs = (...names: readonly PolicyList[]) => names.some((n) => used.includes(n));
  const [assets, links, org, lead, crypto] = await Promise.all([
    needs("criticalProcesses", "recoveryOrder")
      ? db
          .select({
            id: asset.id,
            name: asset.name,
            type: asset.type,
            isCritical: asset.isCritical,
          })
          .from(asset)
          .where(eq(asset.companyId, companyId))
          .orderBy(asset.name)
      : [],
    needs("recoveryOrder")
      ? db
          .select({
            id: risk.id,
            likelihood: risk.likelihood,
            impact: risk.impact,
            assetId: riskAsset.assetId,
          })
          .from(riskAsset)
          .innerJoin(risk, eq(risk.id, riskAsset.riskId))
          .where(eq(risk.companyId, companyId))
      : [],
    needs("reportingChannel")
      ? db.query.company.findFirst({
          where: eq(company.id, companyId),
          columns: { country: true },
        })
      : undefined,
    needs("emergencyLead") ? emergencyLeadOf(db, companyId) : null,
    needs("acceptedCrypto") ? cryptoListOf(db, companyId) : null,
  ]);
  const portal =
    getRegistrationPortals().portals.find((p) => p.countryCode === org?.country) ?? null;
  const text: Record<PolicyList, () => string> = {
    reportingChannel: () => reportingChannelText(locale, portal),
    emergencyLead: () => personText(lead),
    criticalProcesses: () =>
      criticalProcessesText(
        assets
          .filter((a) => a.type === "process" && a.isCritical)
          .map((a) => ({ name: a.name, how: fallbacks[a.id] ?? "" })),
      ),
    recoveryOrder: () =>
      recoveryOrderText(
        recoveryOrder(
          assets,
          links.map((l) => ({ ...l, linked: [l.assetId] })),
        ),
      ),
    acceptedCrypto: () => acceptedCryptoText(locale, crypto),
  };
  return Object.fromEntries(used.map((name) => [name, text[name]()]));
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
  const text = JSON.stringify(document);
  const used = POLICY_LISTS.filter((name) => text.includes(marker(name)));
  return {
    type,
    document,
    company: org.name,
    clauses: stored.clauses,
    own: stored.own,
    fallbacks: stored.fallbacks,
    lists:
      used.length > 0
        ? await policyListsOf(ctx.db, ctx.companyId, used, stored.fallbacks, locale)
        : {},
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
      content: policy.content,
      status: policy.status,
      effectiveFrom: policy.effectiveFrom,
      approver: user.name,
    })
    .from(policy)
    .innerJoin(requirement, eq(requirement.id, policy.requirementId))
    .leftJoin(user, eq(user.id, policy.approvedBy))
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
        authorityUrl: p.authorityUrl,
        csirt: p.csirt,
        portalName: p.portalName,
        portalUrl: p.portalUrl,
        status: p.status,
      })),
    };
  }),

  /** Common answers for the vulnerability report address, read off the company's contact email. */
  contactSuggestions: durchgangProcedure.query(async ({ ctx }) => {
    const org = await ctx.db.query.company.findFirst({
      where: eq(company.id, ctx.companyId),
      columns: { contactEmail: true },
    });
    return contactSuggestions(org?.contactEmail ?? null);
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
   * 2.2, which one exactly and from whom. Each row gives the asset the name the company knows it
   * by and its providers, each found on the company's supplier list by name or added to it; the
   * asset's links then match exactly the names sent, so a name left out unlinks that provider and
   * leaves it listed. The first rename moves the old name into an empty description, so the list
   * still says what kind of thing it is.
   */
  specifyAssets: durchgangWrite
    .input(
      z.object({
        rows: z
          .array(
            z.object({
              id: z.string().uuid(),
              name: z.string().trim().min(1).max(255),
              providers: z.array(z.string().trim().min(1).max(255)).max(20),
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
          .select({ id: asset.id, name: asset.name, description: asset.description })
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
        const renames = input.rows.flatMap((row) => {
          const was = before.get(row.id);
          if (!was || row.name === was.name) return [];
          const description = was.description?.trim() ? was.description : was.name;
          return [{ id: row.id, name: row.name, description }];
        });
        for (const change of renames) {
          await tx
            .update(asset)
            .set({
              name: change.name,
              description: change.description,
              updatedAt: new Date(),
            })
            .where(and(eq(asset.id, change.id), eq(asset.companyId, ctx.companyId)));
        }
        const touched = new Set([
          ...renames.map((r) => r.id),
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
   * description and a numbered name the person then replaces.
   */
  addAnotherAsset: durchgangWrite
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const source = await ctx.db.query.asset.findFirst({
        where: and(eq(asset.id, input.id), eq(asset.companyId, ctx.companyId)),
        columns: { name: true, type: true, description: true },
      });
      if (!source) throw new TRPCError({ code: "NOT_FOUND" });
      // 2.2 keeps the catalogue name in the description; a description of one's own is no kind.
      const kind = (
        isCatalogName(source.description) ? source.description.trim() : source.name
      ).slice(0, 240);
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
          description: kind,
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
    .input(
      z.object({
        rows: z
          .array(
            z.object({
              kind: z.enum(["asset", "supplier"]),
              id: z.string().uuid(),
              frequency: z.enum(FREQUENCIES),
              impact: z.enum(IMPACTS),
              note: riskInsertSchema.shape.treatmentDescription
                .unwrap()
                .unwrap()
                .trim()
                .max(1000)
                .optional(),
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
   * 11.1: whether signing in to each listed program and remote access takes a second factor, or
   * that nobody knows yet (null). Only `has_mfa` is written, only on the company's own assets, and
   * only where it changed. The column defaults to false, so the item's trail is the record that a
   * row was actually answered "no".
   */
  recordLogins: durchgangWrite
    .input(
      z.object({
        code,
        rows: z
          .array(
            z.object({
              assetId: z.string().uuid(),
              mfa: z.boolean().nullable(),
              method: z.enum(MFA_METHODS).nullable().default(null),
            }),
          )
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

  /**
   * 4.4: per backup system on the company's list, how often it backs up and the day of its last
   * restore that worked, in the asset's own columns, which the requirement page shows too. Only
   * the company's own backup systems are written, and only where an answer changed; an emptied
   * day clears it. An omitted frequency keeps the stored one, which the asset page may have
   * written as free text that none of the walk's options name.
   */
  recordBackups: durchgangWrite
    .input(
      z.object({
        code,
        rows: z
          .array(
            z.object({
              assetId: z.string().uuid(),
              frequency: z.enum(BACKUP_FREQUENCIES).nullable().optional(),
              lastRestore: z.iso.date().nullable(),
            }),
          )
          .min(1)
          .max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const words = resolveItem(
        NAMESPACES[await seedLocale(ctx.db, ctx.userId, ctx.companyId)],
        itemOf(input.code),
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
      await logAudit({
        companyId: ctx.companyId,
        userId: ctx.userId,
        action: "durchgang.backups",
        entityType: "requirement",
        entityId: ref.requirementId,
        description: `${ref.code} backups recorded`,
        newValue: { systems: rows.length, changed: changed.length },
      });
      if (changed.length > 0) recheck(ctx, "asset");
      return { changed: changed.length };
    }),

  /** 9.1: the company's crypto list, or the BSI TR-02102 list while it has not taken one over. */
  cryptoList: durchgangProcedure.query(async ({ ctx }) => {
    const stored = await cryptoListOf(ctx.db, ctx.companyId);
    if (stored) return { stored: true as const, list: stored };
    const locale = await seedLocale(ctx.db, ctx.userId, ctx.companyId);
    return { stored: false as const, list: getDefaultPolicyConfig(CRYPTO_LIST, locale) };
  }),

  /**
   * 9.1: takes the BSI TR-02102 list over as the company's crypto list, as an explicit write. A
   * list the company keeps already, edited on the requirement page, is never overwritten.
   */
  adoptCrypto: durchgangWrite
    .input(z.object({ code }))
    .mutation(async ({ ctx, input }) => {
      const screens: readonly AnyScreen[] = itemOf(input.code).screens;
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
      await logAudit({
        companyId: ctx.companyId,
        userId: ctx.userId,
        action: "durchgang.crypto_adopted",
        entityType: "requirement",
        entityId: ref.requirementId,
        description: `${ref.code} BSI TR-02102 crypto list adopted`,
      });
      return { adopted: true };
    }),

  /**
   * The policies the walk wrote for the company, with their state, for the approval screen. The
   * stored text comes as HTML, so management reads exactly what it approves without needing the
   * category each document belongs to. It is rendered as a document: no raw HTML, safe links,
   * nothing loaded from outside, and every link's address in view.
   */
  walkPolicies: durchgangProcedure.query(async ({ ctx }) => {
    const rows = await walkPolicyRows(ctx.db, ctx.companyId);
    return Promise.all(
      rows.map(async ({ content, ...row }) => ({
        ...row,
        html: await renderDocumentMarkdown(content ?? ""),
      })),
    );
  }),

  /**
   * 7.3: management approves the drafts it ticked, signed in with its own account. The approval
   * is that person's, now: who, when and in which role go on each policy, and the day in Berlin
   * becomes its start and its version. Each document is resolved through its own item, so
   * approving it takes what writing it takes, and only drafts change: an approved document keeps
   * its day. The review's trail names every document approved.
   */
  approvePolicies: durchgangWrite
    .input(
      z.object({
        code,
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
      if (ctx.session.jobTitle !== MANAGEMENT_ROLE) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only management approves these documents.",
        });
      }
      const now = new Date();
      const approvedOn = recordDay(now);
      const chosen = WALK_POLICIES.filter((p) => input.types.includes(p.policy));
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
      const approved = await ctx.db.transaction(async (tx) => {
        const titles: string[] = [];
        for (const { type, owner } of targets) {
          const rows = await tx
            .update(policy)
            .set({
              status: "approved",
              version: approvedOn,
              effectiveFrom: approvedOn,
              approvedBy: ctx.userId,
              approvedAt: now,
              approverRole: MANAGEMENT_ROLE,
              updatedAt: now,
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
          noteLine(now, approvedNote(locale, approvedOn, approved)),
        );
        await logAudit({
          companyId: ctx.companyId,
          userId: ctx.userId,
          action: "durchgang.policies_approved",
          entityType: "requirement",
          entityId: ref.requirementId,
          description: `${ref.code} management approved ${approved.length} walk documents`,
          newValue: { approvedOn, count: approved.length },
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
   * sections, the clauses the person chose and their own addition, in the record language, with
   * the company's name and the item's saved answers. The choice is kept in the company's policy
   * config and the text in one `policy` row of the requirement. A text that changes goes back to
   * draft and loses its approval, because what management approved was the earlier one.
   */
  writePolicy: durchgangWrite
    .input(
      z.object({
        code,
        /** Null keeps the stored choice: the text is still written, with no clause or the old ones. */
        clauses: z.array(z.string().min(1).max(60)).max(50).nullable(),
        /** The company's own words; null keeps the stored ones. */
        own: z.string().trim().max(OWN_MAX).nullable(),
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
          .set({
            title,
            content,
            status: "draft",
            effectiveFrom: null,
            approvedBy: null,
            approvedAt: null,
            approverRole: null,
            updatedAt: new Date(),
          })
          .where(and(eq(policy.id, stored.id), eq(policy.companyId, ctx.companyId)));
        return true;
      });
      if (changed) recheck(ctx, "policy");
      return { changed };
    }),
});
