import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { CATALOG_BY_ID } from "@/lib/asset-inventory/catalog";
import { CATALOG_LABELS, catalogNames } from "@/lib/asset-inventory/catalog-labels";
import { logAudit } from "@/lib/audit";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { mayWalkDurchgang } from "@/lib/billing/access";
import { getDefaultMethodology } from "@/lib/compliance/risk-methodology-defaults";
import { seedLocale } from "@/lib/compliance/seed-locale";
import {
  declinedNote,
  methodNote,
  noteLine,
  resolveItem,
  SOURCE_IDS,
  sourcesNote,
  WAIT_REASONS,
  WALK,
  waitingNote,
} from "@/lib/durchgang";
import { getRegistrationPortals } from "@/lib/registration-portals";
import durchgangDe from "@/messages/durchgang/de.json";
import durchgangEn from "@/messages/durchgang/en.json";
import { asset, auditLog, company, companyRiskMethodology } from "@/schema";
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
      const key = (name: string) => name.trim().toLowerCase();
      const taken = new Set(existing.map((a) => key(a.name)));
      // The first spelling of a name wins, and an item already on the list is left alone.
      const fresh = wanted.filter(
        (a, i) =>
          !a.names.some((n) => taken.has(key(n))) &&
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
