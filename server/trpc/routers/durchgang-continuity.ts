import { TRPCError } from "@trpc/server";
import { and, eq, inArray, ne } from "drizzle-orm";
import { seedLocale } from "@/lib/compliance/seed-locale";
import {
  criticalNote,
  needsNote,
  noneWord,
  noteLine,
  resolveItem,
  restoreNote,
} from "@/lib/durchgang";
import { asset, companyPolicyConfig, processAsset } from "@/schema";
import { appendNote, durchgangItem } from "../helpers/durchgang";
import { continuityFactsOf, processLinksOf } from "../helpers/durchgang-gaps";
import {
  recordCriticalInput,
  recordNeedsInput,
  recordRestoreInput,
} from "../helpers/durchgang-inputs";
import { policyTypeOf, storedConfigOf } from "../helpers/durchgang-policy";
import { actorOf, logWalk, recheck } from "../helpers/durchgang-procedures";
import { askedOnScreen, NAMESPACES, walkItem } from "../helpers/durchgang-words";
import { durchgangProcedure, durchgangWrite } from "./durchgang-access";

/**
 * The walk's continuity writes, 4.2 and 4.4 (§ 30 Abs. 2 Nr. 3 BSIG; BSI-Standard 200-4 at its
 * entry level): which processes must keep running and how long each may be down, what each needs,
 * how long each needed system takes back, and the comparison of the two. Spread into the
 * Durchgang router, so the screens and the MCP tools call `durchgang.<name>` as for every screen.
 */
export const continuityProcedures = {
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
      askedOnScreen(input.code, "critical", "marks no processes");
      const ref = await durchgangItem(ctx.db, actorOf(ctx), input.code);
      const type = policyTypeOf(input.code);
      const rows = [...new Map(input.rows.map((r) => [r.assetId, r])).values()];
      const ids = rows.map((r) => r.assetId);

      const result = await ctx.db.transaction(async (tx) => {
        const owned = await tx
          .select({
            id: asset.id,
            name: asset.name,
            isCritical: asset.isCritical,
            maxOutage: asset.maxOutage,
          })
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
        // The tolerance belongs to a process that must keep running: left out, it keeps what is
        // stored; null clears it; a process that need not keep running has none.
        const outageAfter = (row: (typeof rows)[number]) =>
          !row.critical
            ? null
            : row.outage === undefined
              ? (before.get(row.assetId)?.maxOutage ?? null)
              : row.outage;
        const changed = rows.filter((row) => {
          const was = before.get(row.assetId);
          return (
            row.critical !== Boolean(was?.isCritical) ||
            outageAfter(row) !== (was?.maxOutage ?? null)
          );
        });
        for (const row of changed) {
          await tx
            .update(asset)
            .set({
              isCritical: row.critical,
              maxOutage: outageAfter(row),
              updatedAt: new Date(),
            })
            .where(and(eq(asset.id, row.assetId), eq(asset.companyId, ctx.companyId)));
        }
        // A process that need not keep running needs nothing: its links go with the mark, so no
        // hidden row comes back, or is diffed against, when it is ticked again.
        const off = rows.filter((row) => !row.critical).map((row) => row.assetId);
        if (off.length > 0) {
          await tx.delete(processAsset).where(inArray(processAsset.processId, off));
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

  /** 4.2's links as stored: which system or room each process needs, for the company's own list. */
  processNeeds: durchgangProcedure.query(({ ctx }) =>
    processLinksOf(ctx.db, ctx.companyId),
  ),

  /**
   * 4.2: the systems and rooms each process that must keep running needs (`process_asset`), as
   * the person picked them. A process's links are replaced by the row sent for it, so a system
   * left out is unlinked. Both ends must be the company's: the process a `process` row marked
   * as having to keep running (the critical screen first), each need anything else on its list.
   */
  recordNeeds: durchgangWrite
    // The input is shared with the MCP tools, which save this screen for an assistant.
    .input(recordNeedsInput)
    .mutation(async ({ ctx, input }) => {
      askedOnScreen(input.code, "needs", "names no systems");
      const ref = await durchgangItem(ctx.db, actorOf(ctx), input.code);
      const locale = await seedLocale(ctx.db, ctx.userId, ctx.companyId);
      // One row per process, one link per need: a process sent twice is merged, since a row
      // replaces the process's links and the last one alone would drop the rest; a system named
      // twice is one link.
      const rows = [
        ...input.rows
          .reduce(
            (byProcess, r) =>
              byProcess.set(r.processId, [
                ...(byProcess.get(r.processId) ?? []),
                ...r.assetIds,
              ]),
            new Map<string, readonly string[]>(),
          )
          .entries(),
      ].map(([processId, assetIds]) => ({ processId, assetIds: [...new Set(assetIds)] }));
      const ids = [...new Set(rows.flatMap((r) => [r.processId, ...r.assetIds]))];

      const result = await ctx.db.transaction(async (tx) => {
        const owned = await tx
          .select({
            id: asset.id,
            name: asset.name,
            type: asset.type,
            isCritical: asset.isCritical,
          })
          .from(asset)
          .where(and(eq(asset.companyId, ctx.companyId), inArray(asset.id, ids)))
          .for("update");
        const typeOf = new Map(owned.map((a) => [a.id, a.type]));
        const keptOf = new Map(owned.map((a) => [a.id, a.isCritical === true]));
        const nameOf = new Map(owned.map((a) => [a.id, a.name]));
        const wellFormed =
          owned.length === ids.length &&
          rows.every(
            (row) =>
              typeOf.get(row.processId) === "process" &&
              keptOf.get(row.processId) === true &&
              row.assetIds.every((id) => typeOf.get(id) !== "process"),
          );
        if (!wellFormed) throw new TRPCError({ code: "NOT_FOUND" });

        const stored = await tx
          .select({ processId: processAsset.processId, assetId: processAsset.assetId })
          .from(processAsset)
          .where(
            inArray(
              processAsset.processId,
              rows.map((r) => r.processId),
            ),
          );
        const diffs = rows.map((row) => {
          const had = stored
            .filter((l) => l.processId === row.processId)
            .map((l) => l.assetId);
          return {
            row,
            gone: had.filter((id) => !row.assetIds.includes(id)),
            added: row.assetIds.filter((id) => !had.includes(id)),
          };
        });
        for (const { row, gone, added } of diffs) {
          if (gone.length > 0) {
            await tx
              .delete(processAsset)
              .where(
                and(
                  eq(processAsset.processId, row.processId),
                  inArray(processAsset.assetId, gone),
                ),
              );
          }
          if (added.length > 0) {
            await tx
              .insert(processAsset)
              .values(added.map((assetId) => ({ processId: row.processId, assetId })));
          }
        }
        return {
          changed: diffs.reduce((n, d) => n + d.gone.length + d.added.length, 0),
          lines: rows.map((row) => {
            const names = row.assetIds.flatMap((id) => {
              const name = nameOf.get(id);
              return name ? [name] : [];
            });
            const process = nameOf.get(row.processId) ?? "";
            return `${process}: ${names.length > 0 ? names.join(", ") : noneWord(locale)}`;
          }),
        };
      });

      await appendNote(
        ctx.db,
        ref.statusId,
        noteLine(new Date(), needsNote(locale, result.lines)),
      );
      await logWalk({
        companyId: ctx.companyId,
        userId: ctx.userId,
        action: "durchgang.needs",
        entityType: "requirement",
        entityId: ref.requirementId,
        description: `${ref.code} what the critical processes need recorded`,
        newValue: { processes: rows.length, changed: result.changed },
      });
      if (result.changed > 0) recheck(ctx, "asset", input.code);
      return { changed: result.changed };
    }),

  /**
   * 4.4: per system a critical process needs, how long it takes to bring back, or that nobody
   * knows (`asset.restore_time`, `asset.restore_time_unknown`), written only on the company's
   * own things that are not processes and only where it changed.
   */
  recordRestore: durchgangWrite
    // The input is shared with the MCP tools, which save this screen for an assistant.
    .input(recordRestoreInput)
    .mutation(async ({ ctx, input }) => {
      askedOnScreen(input.code, "restore", "asks no restore times");
      const locale = await seedLocale(ctx.db, ctx.userId, ctx.companyId);
      // The screen's own words for the spans, so the trail says what the screen said.
      const words = resolveItem(NAMESPACES[locale], walkItem(input.code));
      const screen = words.ok
        ? words.value.screens.find((s) => s.kind === "restore")
        : undefined;
      if (screen?.kind !== "restore") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `${input.code}: the restore screen's words did not resolve.`,
        });
      }
      const ref = await durchgangItem(ctx.db, actorOf(ctx), input.code);
      const rows = [...new Map(input.rows.map((r) => [r.assetId, r])).values()];
      const ids = rows.map((r) => r.assetId);

      const result = await ctx.db.transaction(async (tx) => {
        const owned = await tx
          .select({
            id: asset.id,
            name: asset.name,
            restoreTime: asset.restoreTime,
            restoreTimeUnknown: asset.restoreTimeUnknown,
          })
          .from(asset)
          .where(
            and(
              eq(asset.companyId, ctx.companyId),
              ne(asset.type, "process"),
              inArray(asset.id, ids),
            ),
          )
          .for("update");
        if (owned.length !== ids.length) throw new TRPCError({ code: "NOT_FOUND" });
        const before = new Map(owned.map((a) => [a.id, a]));
        const changed = rows.filter((row) => {
          const was = before.get(row.assetId);
          return (
            was !== undefined &&
            (row.restore !== was.restoreTime || row.unknown !== was.restoreTimeUnknown)
          );
        });
        for (const row of changed) {
          await tx
            .update(asset)
            .set({
              restoreTime: row.restore,
              restoreTimeUnknown: row.unknown,
              updatedAt: new Date(),
            })
            .where(and(eq(asset.id, row.assetId), eq(asset.companyId, ctx.companyId)));
        }
        return {
          changed: changed.length,
          lines: rows.map((row) => {
            const name = before.get(row.assetId)?.name ?? "";
            const answer = row.unknown
              ? screen.copy.unknown
              : row.restore
                ? screen.copy.options[row.restore]
                : noneWord(locale);
            return `${name}: ${answer}`;
          }),
        };
      });

      await appendNote(
        ctx.db,
        ref.statusId,
        noteLine(new Date(), restoreNote(locale, result.lines)),
      );
      await logWalk({
        companyId: ctx.companyId,
        userId: ctx.userId,
        action: "durchgang.restore",
        entityType: "requirement",
        entityId: ref.requirementId,
        description: `${ref.code} restore times recorded`,
        newValue: { systems: rows.length, changed: result.changed },
      });
      if (result.changed > 0) recheck(ctx, "asset", input.code);
      return { changed: result.changed };
    }),

  /**
   * 4.4: the rows the comparison reads (`compare`): the critical processes with their tolerance,
   * everything else on the list with its restore time, and which process needs what.
   */
  recovery: durchgangProcedure.query(async ({ ctx }) => {
    const [assets, links] = await Promise.all([
      ctx.db
        .select({
          id: asset.id,
          name: asset.name,
          type: asset.type,
          isCritical: asset.isCritical,
          maxOutage: asset.maxOutage,
          restoreTime: asset.restoreTime,
          restoreTimeUnknown: asset.restoreTimeUnknown,
        })
        .from(asset)
        .where(eq(asset.companyId, ctx.companyId))
        .orderBy(asset.name),
      processLinksOf(ctx.db, ctx.companyId),
    ]);
    return continuityFactsOf(assets, links);
  }),
};
