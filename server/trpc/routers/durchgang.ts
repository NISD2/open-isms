import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { CATALOG_BY_ID } from "@/lib/asset-inventory/catalog";
import { logAudit } from "@/lib/audit";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { mayWalkDurchgang } from "@/lib/billing/access";
import { RISK_LEVELS } from "@/lib/compliance/bsi-200-3";
import { getDefaultMethodology } from "@/lib/compliance/risk-methodology-defaults";
import { seedLocale } from "@/lib/compliance/seed-locale";
import {
  acceptanceNote,
  methodNote,
  noteLine,
  resolveItem,
  SOURCE_IDS,
  sourcesNote,
  WAIT_REASONS,
  WALK,
  waitingNote,
} from "@/lib/durchgang";
import assetLabelsDe from "@/messages/assetInventory/de.json";
import assetLabelsEn from "@/messages/assetInventory/en.json";
import durchgangDe from "@/messages/durchgang/de.json";
import durchgangEn from "@/messages/durchgang/en.json";
import { asset, companyRiskMethodology } from "@/schema";
import { appendNote, durchgangItem, walkStates } from "../helpers/durchgang";
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

const code = z.string().max(10);
const NAMESPACES = { de: durchgangDe.durchgang, en: durchgangEn.durchgang } as const;
const ASSET_LABELS = {
  de: assetLabelsDe.assetInventory.catalog,
  en: assetLabelsEn.assetInventory.catalog,
} as const;

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
  /** Where each item stands. Read by the home screen and after every write. */
  walk: durchgangProcedure.query(async ({ ctx }) => {
    const states = await walkStates(ctx.db, ctx.companyId);
    return WALK.map((item) => ({
      code: item.code,
      state: states.get(item.code) ?? { kind: "open" as const },
    }));
  }),

  /** The company's risk method, or null. Unlike `risk.getMethodology`, reading writes nothing. */
  methodology: durchgangProcedure.query(async ({ ctx }) => {
    return (
      (await ctx.db.query.companyRiskMethodology.findFirst({
        where: eq(companyRiskMethodology.companyId, ctx.companyId),
      })) ?? null
    );
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
      const ref = await durchgangItem(ctx.db, ctx.companyId, input.code);
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
      const ref = await durchgangItem(ctx.db, ctx.companyId, input.code);
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
      const ref = await durchgangItem(ctx.db, ctx.companyId, input.code);
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
    const ref = await durchgangItem(ctx.db, ctx.companyId, "2.1");
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

  /** The 2.1 acceptance limit, as the proposal the Geschäftsführung signs. */
  decideAcceptance: durchgangProcedure
    .input(z.object({ level: z.enum(RISK_LEVELS) }))
    .mutation(async ({ ctx, input }) => {
      const ref = await durchgangItem(ctx.db, ctx.companyId, "2.1");
      const locale = await seedLocale(ctx.db, ctx.userId, ctx.companyId);
      await appendNote(
        ctx.db,
        ref.statusId,
        noteLine(new Date(), acceptanceNote(locale, input.level)),
      );
      await logAudit({
        companyId: ctx.companyId,
        userId: ctx.userId,
        action: "durchgang.decided",
        entityType: "requirement",
        entityId: ref.requirementId,
        description: "2.1 risk acceptance proposed",
        newValue: { decision: "risk_acceptance", level: input.level },
      });
    }),

  /** The end of an item: filled in, waiting for the signature. The status column stays. */
  finish: durchgangProcedure
    .input(z.object({ code }))
    .mutation(async ({ ctx, input }) => {
      const ref = await durchgangItem(ctx.db, ctx.companyId, input.code);
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
   * 2.2: the ticked catalogue items and the person's own entries become asset rows. Names that
   * already exist are skipped, so a second pass adds only what is new, and nothing is ever deleted
   * here.
   */
  addAssets: activatedCompanyProcedure
    .use(({ ctx, next }) => {
      gate(ctx.session);
      return next({ ctx });
    })
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
      const locale = await seedLocale(ctx.db, ctx.userId, ctx.companyId);
      const labels: Readonly<Record<string, { label: string }>> = ASSET_LABELS[locale];
      const wanted = [
        ...input.catalogIds.flatMap((id) => {
          const item = CATALOG_BY_ID.get(id);
          const label = labels[id]?.label;
          return item && label ? [{ name: label, type: item.category }] : [];
        }),
        ...input.custom.map((c) => ({ name: c.name, type: "other" })),
      ];
      const existing = await ctx.db.query.asset.findMany({
        where: eq(asset.companyId, ctx.companyId),
        columns: { name: true },
      });
      const key = (name: string) => name.trim().toLowerCase();
      const taken = new Set(existing.map((a) => key(a.name)));
      // The first spelling of a name wins, and a name already on the list is left alone.
      const fresh = wanted.filter(
        (a, i) =>
          !taken.has(key(a.name)) &&
          wanted.findIndex((b) => key(b.name) === key(a.name)) === i,
      );
      if (fresh.length > 0) {
        await ctx.db
          .insert(asset)
          .values(
            fresh.map((a) => ({ companyId: ctx.companyId, name: a.name, type: a.type })),
          );
      }
      return { added: fresh.length };
    }),
});
