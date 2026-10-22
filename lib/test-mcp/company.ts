import "@/lib/server-guard";
import { desc, eq } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { itemsFor, NIS2_WALK } from "@/lib/durchgang";
import { walkProgress } from "@/lib/lifecycle/walk-progress";
import { billingAccount, company, companyMembership, user } from "@/schema";
import { walkStates } from "@/server/trpc/helpers/durchgang";
import { membersWorkIn, trainingOf } from "./people";

/** One company as the operator reads it: profile, plan, who works there and how far they got. */
export async function companyOverview(db: DbOrTx, companyId: string) {
  const [row] = await db
    .select({
      id: company.id,
      name: company.name,
      sector: company.sector,
      entityType: company.entityType,
      criticalInstallation: company.criticalInstallation,
      country: company.country,
      employeeCount: company.employeeCount,
      plan: company.plan,
      accessLevel: billingAccount.accessLevel,
      createdAt: company.createdAt,
      activatedAt: company.activatedAt,
      assistantsAllowed: company.assistantsAllowed,
      assistantsReadRecords: company.assistantsReadRecords,
      actsAsSupplier: company.actsAsSupplier,
      actsAsNis2Entity: company.actsAsNis2Entity,
    })
    .from(company)
    .leftJoin(billingAccount, eq(billingAccount.id, company.billingAccountId))
    .where(eq(company.id, companyId))
    .limit(1);
  if (!row) return null;

  const members = await db
    .select({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: companyMembership.role,
      jobTitle: companyMembership.jobTitle,
      joinedAt: companyMembership.createdAt,
      lastLoginAt: user.lastLoginAt,
      loginCount: user.loginCount,
    })
    .from(companyMembership)
    .innerJoin(user, eq(user.id, companyMembership.userId))
    .where(eq(companyMembership.companyId, companyId))
    .orderBy(desc(companyMembership.createdAt));
  const ids = members.map((m) => m.userId);

  const [training, work, states] = await Promise.all([
    trainingOf(db, ids),
    membersWorkIn(db, companyId, ids),
    walkStates(db, companyId, NIS2_WALK),
  ]);
  const progress = walkProgress({
    walk: itemsFor(NIS2_WALK, row),
    states: new Map(states.map((s) => [s.code, s.state])),
    setUp: row.activatedAt !== null,
  });
  const byKind = Object.fromEntries(
    Object.entries(Object.groupBy(states, (s) => s.state.kind)).map(([kind, same]) => [
      kind,
      same?.length ?? 0,
    ]),
  );

  return {
    company: row,
    walkthrough: {
      steps: progress.total,
      settled: progress.done,
      itemsByState: byKind,
      items: states.map((s) => ({ code: s.code, state: s.state.kind })),
    },
    members: members.map((m) => ({
      ...m,
      courses: training.get(m.userId) ?? [],
      workInThisCompany: work.get(m.userId),
    })),
  };
}
