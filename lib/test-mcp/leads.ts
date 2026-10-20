import "@/lib/server-guard";
import {
  and,
  count,
  countDistinct,
  desc,
  eq,
  gte,
  inArray,
  isNotNull,
  ne,
  or,
  sql,
} from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import {
  auditLog,
  billingAccount,
  company,
  companyMembership,
  trainingLessonProgress,
  user,
} from "@/schema";
import { DAY_MS, isWalkAction } from "./common";
import { trainingOf } from "./people";

export interface LeadFacts {
  readonly finishedCourses: number;
  readonly startedCourses: number;
  readonly companyActivated: boolean;
  readonly walkActions: number;
  readonly logins: number;
  readonly colleaguesInTraining: number;
  readonly colleagues: number;
}

/** Why a person is on the list, each reason worth one point; the list is the explanation. */
export function leadReasons(f: LeadFacts): string[] {
  return [
    f.finishedCourses > 0 ? `finished ${f.finishedCourses} course(s)` : null,
    f.finishedCourses === 0 && f.startedCourses > 0 ? "started a course" : null,
    f.companyActivated ? "company is set up" : null,
    f.walkActions > 0 ? `${f.walkActions} walkthrough actions in the last 30 days` : null,
    f.logins >= 3 ? `${f.logins} sign-ins` : null,
    f.colleaguesInTraining > 0
      ? `${f.colleaguesInTraining} of ${f.colleagues} colleagues are in training`
      : null,
  ].flatMap((r) => (r ? [r] : []));
}

/** The most recent sign-ins that are scored; `truncated` says when there were more. */
export const LEAD_CANDIDATES = 400;

/**
 * Verified people who signed in within `days` days at a company that has not paid, ranked by how
 * many of the reasons above hold. Registered people only, which is the pool that may be contacted.
 * Only the most recent LEAD_CANDIDATES sign-ins are scored: `truncated` is true when more people
 * than that had signed in, so a long window may leave out older people with more reasons.
 */
export async function warmLeads(db: DbOrTx, o: { days: number; limit: number }) {
  const found = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      lastLoginAt: user.lastLoginAt,
      loginCount: user.loginCount,
      companyId: company.id,
      companyName: company.name,
      activated: sql<boolean>`${company.activatedAt} is not null`,
    })
    .from(user)
    .leftJoin(company, eq(company.id, user.companyId))
    .leftJoin(billingAccount, eq(billingAccount.id, company.billingAccountId))
    .where(
      and(
        isNotNull(user.emailVerifiedAt),
        gte(user.lastLoginAt, new Date(Date.now() - o.days * DAY_MS)),
        or(
          sql`${billingAccount.accessLevel} is null`,
          ne(billingAccount.accessLevel, "full"),
        ),
      ),
    )
    .orderBy(desc(user.lastLoginAt))
    .limit(LEAD_CANDIDATES + 1);
  const truncated = found.length > LEAD_CANDIDATES;
  const candidates = found.slice(0, LEAD_CANDIDATES);
  const ids = candidates.map((c) => c.id);
  const companyIds = [
    ...new Set(candidates.flatMap((c) => (c.companyId ? [c.companyId] : []))),
  ];
  if (ids.length === 0) return { truncated, people: [] };

  const [courses, walk, training, size] = await Promise.all([
    trainingOf(db, ids),
    db
      .select({ userId: auditLog.userId, actions: count() })
      .from(auditLog)
      .where(
        and(
          inArray(auditLog.userId, ids),
          isWalkAction,
          gte(auditLog.createdAt, new Date(Date.now() - 30 * DAY_MS)),
        ),
      )
      .groupBy(auditLog.userId),
    companyIds.length === 0
      ? []
      : db
          .select({
            companyId: companyMembership.companyId,
            people: countDistinct(trainingLessonProgress.userId),
          })
          .from(companyMembership)
          .innerJoin(
            trainingLessonProgress,
            eq(trainingLessonProgress.userId, companyMembership.userId),
          )
          .where(inArray(companyMembership.companyId, companyIds))
          .groupBy(companyMembership.companyId),
    companyIds.length === 0
      ? []
      : db
          .select({ companyId: companyMembership.companyId, people: count() })
          .from(companyMembership)
          .where(inArray(companyMembership.companyId, companyIds))
          .groupBy(companyMembership.companyId),
  ]);

  const people = candidates
    .map((c) => {
      const mine = courses.get(c.id) ?? [];
      const inTraining = training.find((t) => t.companyId === c.companyId)?.people ?? 0;
      const facts: LeadFacts = {
        finishedCourses: mine.filter((m) => m.finished).length,
        startedCourses: mine.length,
        companyActivated: c.activated,
        walkActions: walk.find((w) => w.userId === c.id)?.actions ?? 0,
        logins: c.loginCount,
        // Colleagues are the others at the company, so this person is left out of both counts.
        colleaguesInTraining: Math.max(0, inTraining - (mine.length > 0 ? 1 : 0)),
        colleagues: Math.max(
          0,
          (size.find((s) => s.companyId === c.companyId)?.people ?? 1) - 1,
        ),
      };
      const reasons = leadReasons(facts);
      return {
        userId: c.id,
        name: c.name,
        email: c.email,
        company: c.companyName,
        lastLoginAt: c.lastLoginAt,
        reasons,
        points: reasons.length,
      };
    })
    .filter((l) => l.points > 0)
    .sort(
      (a, b) =>
        b.points - a.points ||
        (b.lastLoginAt?.getTime() ?? 0) - (a.lastLoginAt?.getTime() ?? 0),
    )
    .slice(0, o.limit);
  return { truncated, people };
}
