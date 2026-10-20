import { TRPCError } from "@trpc/server";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { nameKey } from "@/lib/asset-inventory/catalog-labels";
import { seedLocale } from "@/lib/compliance/seed-locale";
import {
  type AnyScreen,
  GDPR_WALK,
  noteLine,
  PROCESSOR_ROLES,
  SUBPROCESSOR_AUTHORISATIONS,
  TRANSFER_MECHANISMS,
} from "@/lib/durchgang";
import { ACTIVITY_CATALOG } from "@/lib/processing-activities/catalog";
import { activityCopyOf } from "@/lib/processing-activities/copy";
import { processingActivity, supplier } from "@/schema";
import { activityFactsSchema } from "@/schema/processing-activity-validators";
import { appendNote, durchgangItem } from "../helpers/durchgang";
import { itemCode as code } from "../helpers/durchgang-inputs";
import {
  actorOf,
  durchgangWrite,
  logWalk,
  recheck,
} from "../helpers/durchgang-procedures";
import { NAMESPACES, recordLocaleOf, walkItem } from "../helpers/durchgang-words";
import { router, type TRPCContext } from "../init";

/**
 * The GDPR walk's own writes: the record of processing activities (G-ROP.1) and what each supplier
 * is for the company's personal data (G-DPA.1, G-DPA.2). Like the NIS 2 walk's, each write checks
 * that the item's own screens ask it, takes what writing the item takes, touches only the
 * company's own rows, and leaves a line in the item's trail.
 */

/** The item's screens, refused when none of them is of `kind`. */
const screensOf = (
  c: string,
  kind: AnyScreen["kind"],
  what: string,
): readonly AnyScreen[] => {
  const screens: readonly AnyScreen[] = walkItem(c).screens;
  if (!screens.some((s) => s.kind === kind)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: `${c} records no ${what}.` });
  }
  return screens;
};

/** The language the company's records are written in, for the GDPR walk (German or English). */
const recordLocale = async (ctx: {
  db: TRPCContext["db"];
  userId: string;
  companyId: string;
}) => recordLocaleOf(GDPR_WALK, await seedLocale(ctx.db, ctx.userId, ctx.companyId));

/** The facts a describe screen may write, as the schema's keys (one pick decides them). */
type ActivityFacts = z.infer<typeof activityFactsSchema>;
const FACT_KEYS = Object.keys(activityFactsSchema.shape) as ReadonlyArray<
  keyof ActivityFacts
>;

const supplierId = z.string().uuid();
const ROWS_MAX = 500;

/** One fact per supplier, by the fact the screen asks; the answers are the walk's own lists. */
const processorsInput = z.discriminatedUnion("fact", [
  z.object({
    code,
    fact: z.literal("role"),
    rows: z.array(z.object({ supplierId, role: z.enum(PROCESSOR_ROLES) })).max(ROWS_MAX),
  }),
  z.object({
    code,
    fact: z.literal("contract"),
    rows: z.array(z.object({ supplierId, concluded: z.boolean() })).max(ROWS_MAX),
  }),
  z.object({
    code,
    fact: z.literal("transfer"),
    rows: z
      .array(
        z.object({
          supplierId,
          outside: z.boolean(),
          mechanism: z.enum(TRANSFER_MECHANISMS).nullable(),
        }),
      )
      .max(ROWS_MAX),
  }),
  z.object({
    code,
    fact: z.literal("subprocessing"),
    rows: z
      .array(z.object({ supplierId, authorisation: z.enum(SUBPROCESSOR_AUTHORISATIONS) }))
      .max(ROWS_MAX),
  }),
]);

/**
 * The supplier columns each answer writes: only the customer's own GDPR columns, never a
 * supplier's clause answers (`supplierOwnedClauseColumns`).
 */
const updatesOf = (input: z.infer<typeof processorsInput>, now: Date) => {
  switch (input.fact) {
    case "role":
      return input.rows.map((r) => ({
        id: r.supplierId,
        set: {
          processesPersonalData: r.role !== "none",
          relationshipType: r.role === "none" ? null : r.role,
          processorCheckedAt: now,
        },
      }));
    case "contract":
      return input.rows.map((r) => ({
        id: r.supplierId,
        set: { dpaConcluded: r.concluded },
      }));
    case "transfer":
      return input.rows.map((r) => ({
        id: r.supplierId,
        set: {
          internationalTransfer: r.outside,
          transferMechanism: r.outside ? r.mechanism : null,
        },
      }));
    case "subprocessing":
      return input.rows.map((r) => ({
        id: r.supplierId,
        set: { subprocessorAuthorisation: r.authorisation },
      }));
    default:
      return input satisfies never;
  }
};

export const durchgangGdprRouter = router({
  /**
   * G-ROP.1: the ticked catalogue activities and the company's own become rows of its record of
   * processing activities, named in the record language. An activity already on the record, by
   * catalogue item or by name, is skipped, so a second pass adds only what is new; nothing is
   * deleted here, the register page takes an activity off.
   */
  addActivities: durchgangWrite
    .input(
      z.object({
        code,
        catalogIds: z.array(z.string().max(80)).max(ACTIVITY_CATALOG.length),
        custom: z.array(z.string().trim().min(1).max(255)).max(50).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      screensOf(input.code, "activities", "processing activities");
      const ref = await durchgangItem(ctx.db, actorOf(ctx), input.code);
      const locale = await recordLocale(ctx);
      const { copy } = activityCopyOf(NAMESPACES[locale]);
      const wanted = [
        ...input.catalogIds.flatMap((id) => {
          const label = copy.get(id)?.label;
          return label ? [{ name: label, catalogId: id }] : [];
        }),
        ...input.custom.map((name) => ({ name, catalogId: null })),
      ];
      const existing = await ctx.db
        .select({
          name: processingActivity.name,
          catalogId: processingActivity.catalogId,
        })
        .from(processingActivity)
        .where(eq(processingActivity.companyId, ctx.companyId));
      const takenIds = new Set(
        existing.flatMap((a) => (a.catalogId ? [a.catalogId] : [])),
      );
      const takenNames = new Set(existing.map((a) => nameKey(a.name)));
      const keyOf = (a: (typeof wanted)[number]) => a.catalogId ?? nameKey(a.name);
      // The first spelling of an activity wins, and one already on the record is left alone.
      const fresh = wanted.filter(
        (a, i) =>
          !(a.catalogId !== null && takenIds.has(a.catalogId)) &&
          !takenNames.has(nameKey(a.name)) &&
          wanted.findIndex((b) => keyOf(b) === keyOf(a)) === i,
      );
      if (fresh.length === 0) return { added: 0 };
      await ctx.db
        .insert(processingActivity)
        .values(fresh.map((a) => ({ ...a, companyId: ctx.companyId })))
        .onConflictDoNothing();
      await appendNote(
        ctx.db,
        ref.statusId,
        noteLine(
          new Date(),
          `${NAMESPACES[locale].ui.activities.noted}: ${fresh.map((a) => a.name).join(", ")}.`,
        ),
      );
      await logWalk({
        companyId: ctx.companyId,
        userId: ctx.userId,
        action: "durchgang.activities",
        entityType: "requirement",
        entityId: ref.requirementId,
        description: `${ref.code} processing activities added`,
        newValue: { added: fresh.length },
      });
      recheck(ctx, "processing_activity");
      return { added: fresh.length };
    }),

  /**
   * G-ROP.1: what Art. 30(1) records of each activity. Only the company's own rows, only the facts
   * sent, and only where one changed; an omitted fact keeps what is stored.
   */
  describeActivities: durchgangWrite
    .input(
      z.object({
        code,
        rows: z.array(activityFactsSchema.extend({ id: z.string().uuid() })).max(200),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      screensOf(input.code, "describe", "activity facts");
      const ref = await durchgangItem(ctx.db, actorOf(ctx), input.code);
      const rows = [...new Map(input.rows.map((r) => [r.id, r])).values()];
      if (rows.length === 0) return { changed: 0 };
      const owned = await ctx.db
        .select()
        .from(processingActivity)
        .where(
          and(
            eq(processingActivity.companyId, ctx.companyId),
            inArray(
              processingActivity.id,
              rows.map((r) => r.id),
            ),
          ),
        );
      if (owned.length !== rows.length) throw new TRPCError({ code: "NOT_FOUND" });
      const before = new Map(owned.map((a) => [a.id, a]));
      const changes = rows.flatMap((row) => {
        const was = before.get(row.id);
        const changed = Object.fromEntries(
          FACT_KEYS.flatMap((key) =>
            row[key] !== undefined && row[key] !== was?.[key] ? [[key, row[key]]] : [],
          ),
        );
        return Object.keys(changed).length > 0 ? [{ id: row.id, changed }] : [];
      });
      for (const { id, changed } of changes) {
        await ctx.db
          .update(processingActivity)
          .set({ ...changed, updatedAt: new Date() })
          .where(
            and(
              eq(processingActivity.id, id),
              eq(processingActivity.companyId, ctx.companyId),
            ),
          );
      }
      await logWalk({
        companyId: ctx.companyId,
        userId: ctx.userId,
        action: "durchgang.described",
        entityType: "requirement",
        entityId: ref.requirementId,
        description: `${ref.code} processing activities described`,
        newValue: { described: rows.length, changed: changes.length },
      });
      if (changes.length > 0) recheck(ctx, "processing_activity", input.code);
      return { changed: changes.length };
    }),

  /**
   * G-DPA.1 and G-DPA.2: one GDPR fact per supplier. Only the customer's own columns of the
   * company's own rows are written, and only the GDPR items resting on the list are sent back to
   * management.
   */
  recordProcessors: durchgangWrite
    .input(processorsInput)
    .mutation(async ({ ctx, input }) => {
      const screens = screensOf(input.code, "processors", "supplier facts");
      if (!screens.some((s) => s.kind === "processors" && s.fact === input.fact)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `${input.code} does not ask ${input.fact}.`,
        });
      }
      const ref = await durchgangItem(ctx.db, actorOf(ctx), input.code);
      const now = new Date();
      // The last answer sent for a supplier wins.
      const updates = [...new Map(updatesOf(input, now).map((u) => [u.id, u])).values()];
      if (updates.length === 0) return { changed: 0 };
      const ids = updates.map((u) => u.id);
      const owned = await ctx.db
        .select({ id: supplier.id, name: supplier.name })
        .from(supplier)
        .where(
          and(eq(supplier.customerCompanyId, ctx.companyId), inArray(supplier.id, ids)),
        );
      if (owned.length !== ids.length) throw new TRPCError({ code: "NOT_FOUND" });
      for (const { id, set } of updates) {
        await ctx.db
          .update(supplier)
          .set({ ...set, updatedAt: now })
          .where(and(eq(supplier.id, id), eq(supplier.customerCompanyId, ctx.companyId)));
      }
      const locale = await recordLocale(ctx);
      await appendNote(
        ctx.db,
        ref.statusId,
        noteLine(
          now,
          `${NAMESPACES[locale].ui.processors.noted[input.fact]}: ${owned.map((s) => s.name).join(", ")}.`,
        ),
      );
      await logWalk({
        companyId: ctx.companyId,
        userId: ctx.userId,
        action: "durchgang.processors",
        entityType: "requirement",
        entityId: ref.requirementId,
        description: `${ref.code} supplier ${input.fact} recorded`,
        newValue: { fact: input.fact, suppliers: updates.length },
      });
      recheck(ctx, "supplier", input.code);
      return { changed: updates.length };
    }),
});
