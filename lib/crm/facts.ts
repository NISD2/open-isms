/**
 * Turns the rows the close-sync reads into one CloseFacts per person.
 *
 * Pure, so every rule is tested without a database, and every rule is the
 * platform's own, imported rather than restated: grandfathering and access from
 * billing, consent from the mail gate's "all" scope, course completion from the
 * certificate's rule, the NIS 2 path from the lifecycle emails' summary.
 */
import type { InferSelectModel } from "drizzle-orm";
import { isFreeMailAddress } from "@/lib/auth/free-mail";
import { effectiveAccessLevel, isGrandfatheredPerson } from "@/lib/billing/access";
import type { AccessLevel } from "@/lib/billing/accounts";
import {
  type JourneyStatusRow,
  summarizeJourneys,
} from "@/lib/lifecycle/journey-progress";
import { courseCompletion, type LessonProgressRow } from "@/lib/training/completion";
import type { company, user } from "@/schema";
import type { CloseFacts } from "./fields";

export type CloseUserRow = Pick<
  InferSelectModel<typeof user>,
  | "email"
  | "createdAt"
  | "emailVerifiedAt"
  | "lastLoginAt"
  | "loginCount"
  | "grandfatheredAt"
  | "emailFollowupsDisabled"
  | "companyId"
> & {
  readonly userId: string;
  /** The company in user.company_id that the person is a member of; null otherwise. */
  readonly company: Pick<
    InferSelectModel<typeof company>,
    "name" | "sector" | "employeeCount" | "country" | "actsAsSupplier"
  > | null;
  /** The stored level of that company's billing account. */
  readonly accessLevel: AccessLevel | null;
};

export type CourseProgressRow = LessonProgressRow & { readonly userId: string };

const groupByUser = <T extends { readonly userId: string }>(rows: readonly T[]) =>
  rows.reduce((byUser, row) => {
    const list = byUser.get(row.userId);
    if (list) list.push(row);
    else byUser.set(row.userId, [row]);
    return byUser;
  }, new Map<string, T[]>());

/**
 * Everything that is the same for every person in one run, prepared once; the
 * returned function computes one person's facts.
 */
export const closeFactsFor = (input: {
  readonly optedOutUserIds: ReadonlySet<string>;
  readonly ceoLessonIds: readonly string[];
  readonly ceoProgress: readonly CourseProgressRow[];
  readonly pathRows: readonly JourneyStatusRow[];
  /** Whether pricing has launched (the "billing" feature flag). */
  readonly launched: boolean;
}) => {
  const ceoProgressByUser = groupByUser(input.ceoProgress);
  const journeys = summarizeJourneys(input.pathRows);

  return (person: CloseUserRow): CloseFacts => {
    const ceo = courseCompletion(
      input.ceoLessonIds,
      ceoProgressByUser.get(person.userId) ?? [],
    );
    // Open in the session's sense: a membership and a billing account, else no company.
    const open =
      person.companyId && person.company && person.accessLevel
        ? {
            id: person.companyId,
            company: person.company,
            accessLevel: person.accessLevel,
          }
        : null;
    const journey = open ? journeys.get(open.id) : undefined;
    return {
      signedUpAt: person.createdAt,
      lastLoginAt: person.lastLoginAt,
      loginCount: person.loginCount,
      grandfathered: isGrandfatheredPerson(person, input.launched),
      mayEmail:
        !person.emailFollowupsDisabled && !input.optedOutUserIds.has(person.userId),
      freeMail: isFreeMailAddress(person.email),
      ceoCourse: {
        done: ceo.completedCount,
        total: ceo.totalCount,
        completedAt: ceo.completionDate,
      },
      company: open?.company ?? null,
      // The rule the session applies (lib/auth/config.ts), so Close shows what the person gets.
      access: open
        ? effectiveAccessLevel(
            open.accessLevel,
            input.launched,
            person.grandfatheredAt !== null,
          )
        : null,
      path: journey ? { done: journey.done, total: journey.total } : null,
    };
  };
};
