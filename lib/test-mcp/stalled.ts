import "@/lib/server-guard";
import { and, count, desc, eq, gte, inArray, isNotNull, sql } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { itemsFor, NIS2_WALK } from "@/lib/durchgang";
import { walkProgress } from "@/lib/lifecycle/walk-progress";
import { auditLog, billingAccount, company, companyMembership, user } from "@/schema";
import { walkStates } from "@/server/trpc/helpers/durchgang";
import { DAY_MS, isoZ, isWalkAction, utcDaysAgo } from "./common";

/**
 * Activated companies whose last action by a person was between `minIdleDays` and `maxIdleDays`
 * ago, the most recent stop first, with where they stopped: the last thing anyone there did, the
 * last walkthrough item they touched, and how far the walkthrough is. Companies with no action by
 * a person at all are not here (nobody ever came back to ask). The limit applies to activated
 * companies only, and the audit log is read no further back than `maxIdleDays`.
 */
export async function stalledCompanies(
  db: DbOrTx,
  o: { minIdleDays: number; maxIdleDays: number; limit: number },
) {
  const lastAt = sql`max(${auditLog.createdAt})`;
  const quiet = await db
    .select({ companyId: auditLog.companyId, lastAt: isoZ(lastAt) })
    .from(auditLog)
    .innerJoin(
      company,
      and(eq(company.id, auditLog.companyId), isNotNull(company.activatedAt)),
    )
    .where(
      and(
        isNotNull(auditLog.userId),
        gte(auditLog.createdAt, sql`${utcDaysAgo(o.maxIdleDays)}::timestamp`),
      ),
    )
    .groupBy(auditLog.companyId)
    .having(sql`${lastAt} < ${utcDaysAgo(o.minIdleDays)}::timestamp`)
    .orderBy(desc(lastAt))
    .limit(o.limit);
  const ids = quiet.flatMap((q) => (q.companyId ? [q.companyId] : []));
  if (ids.length === 0) return [];

  const [companies, lastActions, lastItems, members] = await Promise.all([
    db
      .select({
        id: company.id,
        name: company.name,
        sector: company.sector,
        entityType: company.entityType,
        criticalInstallation: company.criticalInstallation,
        activatedAt: company.activatedAt,
        accessLevel: billingAccount.accessLevel,
        ownerName: user.name,
        ownerEmail: user.email,
      })
      .from(company)
      .leftJoin(billingAccount, eq(billingAccount.id, company.billingAccountId))
      .leftJoin(user, eq(user.id, company.ownerId))
      .where(inArray(company.id, ids)),
    db
      .selectDistinctOn([auditLog.companyId], {
        companyId: auditLog.companyId,
        at: auditLog.createdAt,
        action: auditLog.action,
        description: auditLog.description,
        by: user.email,
      })
      .from(auditLog)
      .leftJoin(user, eq(user.id, auditLog.userId))
      .where(and(inArray(auditLog.companyId, ids), isNotNull(auditLog.userId)))
      .orderBy(auditLog.companyId, desc(auditLog.createdAt)),
    db
      .selectDistinctOn([auditLog.companyId], {
        companyId: auditLog.companyId,
        at: auditLog.createdAt,
        description: auditLog.description,
      })
      .from(auditLog)
      .where(
        and(inArray(auditLog.companyId, ids), isNotNull(auditLog.userId), isWalkAction),
      )
      .orderBy(auditLog.companyId, desc(auditLog.createdAt)),
    db
      .select({ companyId: companyMembership.companyId, people: count() })
      .from(companyMembership)
      .where(inArray(companyMembership.companyId, ids))
      .groupBy(companyMembership.companyId),
  ]);

  return Promise.all(
    quiet.flatMap((q) => {
      const c = companies.find((x) => x.id === q.companyId);
      if (!c) return [];
      return [
        (async () => {
          const states = await walkStates(db, c.id, NIS2_WALK);
          const progress = walkProgress({
            walk: itemsFor(NIS2_WALK, c),
            states: new Map(states.map((s) => [s.code, s.state])),
            setUp: true,
          });
          const last = lastActions.find((x) => x.companyId === c.id);
          return {
            companyId: c.id,
            name: c.name,
            sector: c.sector,
            plan: c.accessLevel,
            activatedAt: c.activatedAt,
            owner: { name: c.ownerName, email: c.ownerEmail },
            people: members.find((m) => m.companyId === c.id)?.people ?? 0,
            lastActivityAt: q.lastAt,
            daysIdle: Math.floor((Date.now() - new Date(q.lastAt).getTime()) / DAY_MS),
            lastAction: last && {
              at: last.at,
              what: last.description,
              action: last.action,
              by: last.by,
            },
            lastWalkthroughStep:
              lastItems.find((x) => x.companyId === c.id)?.description ?? null,
            walkthrough: { settled: progress.done, steps: progress.total },
          };
        })(),
      ];
    }),
  );
}
