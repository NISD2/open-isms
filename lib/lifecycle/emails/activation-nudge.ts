/**
 * Activation nudge: the first lifecycle email. Sent once, ever, to a user
 * who signed up, went quiet, and still has open steps on their NIS 2
 * implementation path. The email names their real progress and the concrete
 * next step, and links straight back to the journey.
 *
 * Eligibility (all must hold):
 *   - email proved (emailVerifiedAt set), not a disposable domain
 *   - not opted out of soft-touch emails (emailFollowupsDisabled)
 *   - has a company (draft shells INCLUDED — a drive-by signup with a seeded
 *     path is exactly who this email is for; contrast the digests, which
 *     exclude drafts)
 *   - quiet for NUDGE_AFTER_DAYS or more: last sign-in (or, for accounts
 *     predating the lastLoginAt column, verification/signup) is older than
 *     the cutoff, AND no audit-logged activity by this user since the
 *     cutoff. "Or more" is deliberate: long-dormant accounts qualify the
 *     first time the cron runs, and the once-ever claim row keeps that from
 *     ever repeating.
 *   - the NIS 2 path has at least one open step
 */
import { and, asc, eq, gt, inArray, isNotNull, notExists, sql } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { unsubscribeUrl as buildUnsubscribeUrl } from "@/lib/email/unsubscribe";
import type { EmailContent } from "@/lib/mail/layout";
import { BRAND, emailLayout, escapeHtml, safeHeader } from "@/lib/mail/layout";
import { getRequirementsMessages, getRequirementTitle } from "@/lib/messages";
import { getAppUrl } from "@/lib/utils";
import {
  auditLog,
  company,
  companyAssessment,
  companyRequirementStatus,
  complianceFramework,
  notification,
  requirement,
  requirementCategory,
  user,
} from "@/schema";
import { NIS2_FRAMEWORK_CODE } from "@/server/trpc/helpers/nis2-scope";
import { type JourneySummary, summarizeJourneys } from "../journey-progress";
import { type LifecycleLocale, resolveEmailLocale } from "../locale";
import {
  LIFECYCLE_ENTITY_TYPE,
  type LifecycleEmailType,
  type PreparedLifecycleEmail,
} from "../types";

export const ACTIVATION_NUDGE_KEY = "activation_nudge_v1";

/**
 * How long an account must be quiet before the nudge. Three days, not two:
 * the Monday 08:00 cron with a two-day window reached back to Saturday
 * morning and read every ordinary Friday sign-in as "went quiet", burning
 * the once-ever email on people who were merely offline over the weekend.
 * Three days clears a weekend; a week is churn territory. Single constant,
 * safe to tune.
 */
export const NUDGE_AFTER_DAYS = 3;

// ---------------------------------------------------------------------------
// Copy (de primary, en, nl — the locales the auth flow already narrows to)
// ---------------------------------------------------------------------------

interface NudgeCopy {
  subjectPrefix: string;
  /** Salutation line including the trailing comma; NL needs a different word with vs without a name. */
  greeting: (firstName: string | null) => string;
  introProgress: (done: number, total: number) => string;
  introFresh: string;
  mechanism: string;
  cta: string;
  /**
   * The link flips user.emailFollowupsDisabled, which stops ALL soft-touch
   * follow-up email (digests, course follow-ups, lifecycle nudges) — so the
   * label stays category-wide, never "these" emails only.
   */
  unsubscribe: string;
}

const COPY: Record<LifecycleLocale, NudgeCopy> = {
  de: {
    subjectPrefix: "Ihr nächster Schritt",
    greeting: (firstName) => (firstName ? `Guten Tag, ${firstName},` : "Guten Tag,"),
    introProgress: (done, total) =>
      `Sie haben ${done} von ${total} Anforderungen auf Ihrem Umsetzungspfad abgeschlossen. Als Nächstes steht an:`,
    introFresh: "Ihr Umsetzungspfad auf nisd2.eu steht bereit. Der erste Schritt:",
    mechanism:
      "Jeder Schritt wird beim Abschluss direkt dokumentiert. So entsteht der Nachweis während der Arbeit, nicht erst kurz vor einer Prüfung.",
    cta: "Im Pfad weitermachen",
    unsubscribe: "Erinnerungen per E-Mail abbestellen",
  },
  en: {
    subjectPrefix: "Your next step",
    greeting: (firstName) => (firstName ? `Hello ${firstName},` : "Hello,"),
    introProgress: (done, total) =>
      `You have completed ${done} of ${total} requirements on your implementation path. Up next:`,
    introFresh: "Your implementation path on nisd2.eu is ready. The first step:",
    mechanism:
      "Each step is documented the moment you complete it, so the evidence builds while you work instead of shortly before an audit.",
    cta: "Continue the path",
    unsubscribe: "Unsubscribe from reminder emails",
  },
  nl: {
    subjectPrefix: "Uw volgende stap",
    greeting: (firstName) => (firstName ? `Beste ${firstName},` : "Goedendag,"),
    introProgress: (done, total) =>
      `U heeft ${done} van de ${total} vereisten op uw implementatiepad afgerond. De volgende stap:`,
    introFresh: "Uw implementatiepad op nisd2.eu staat klaar. De eerste stap:",
    mechanism:
      "Elke stap wordt bij afronding direct gedocumenteerd. Zo bouwt het bewijs zich op tijdens het werk, niet pas vlak voor een audit.",
    cta: "Verder met het pad",
    unsubscribe: "Afmelden voor e-mailherinneringen",
  },
};

/**
 * First token of the display name, but only when it reads as a name.
 * Registration defaults `name` to the email local part ("j.mueller",
 * "info42"), which would make an awkward greeting — those fall back to the
 * bare greeting. Lower-cased real names ("simon") get their initial raised.
 */
const NAME_PATTERN = /^\p{L}[\p{L}' -]*$/u;

export function displayableFirstName(name: string | null): string | null {
  const first = name?.trim().split(/\s+/)[0] ?? "";
  if (!first || first.length > 40 || !NAME_PATTERN.test(first)) return null;
  return first.charAt(0).toUpperCase() + first.slice(1);
}

export interface ActivationNudgeInput {
  name: string | null;
  locale: LifecycleLocale;
  done: number;
  total: number;
  nextStepTitle: string;
  journeyUrl: string;
  unsubscribeUrl: string;
}

export function renderActivationNudge(input: ActivationNudgeInput): EmailContent {
  const copy = COPY[input.locale];
  const greeting = copy.greeting(displayableFirstName(input.name));
  const intro =
    input.done > 0 ? copy.introProgress(input.done, input.total) : copy.introFresh;
  const subject = safeHeader(`${copy.subjectPrefix}: ${input.nextStepTitle}`);

  const html = emailLayout(`
        <p style="color: ${BRAND.foreground}; line-height: 1.6; margin: 0 0 16px;">${escapeHtml(greeting)}</p>
        <p style="color: ${BRAND.foreground}; line-height: 1.6; margin: 0 0 16px;">${escapeHtml(intro)}</p>
        <div style="background: ${BRAND.muted}; border-left: 3px solid ${BRAND.primary}; padding: 12px 16px; margin: 0 0 20px;">
          <a href="${input.journeyUrl}" style="color: ${BRAND.primary}; text-decoration: none; font-weight: 600;">${escapeHtml(input.nextStepTitle)}</a>
        </div>
        <p style="color: ${BRAND.foreground}; line-height: 1.6; margin: 0 0 24px;">${escapeHtml(copy.mechanism)}</p>
        <p style="margin: 0 0 8px;">
          <a href="${input.journeyUrl}" style="display: inline-block; background: ${BRAND.primary}; color: ${BRAND.primaryForeground}; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600;">${escapeHtml(copy.cta)}</a>
        </p>
        <p style="color: ${BRAND.mutedForeground}; font-size: 12px; margin: 32px 0 0; line-height: 1.5; border-top: 1px solid ${BRAND.border}; padding-top: 16px;">
          <a href="${input.unsubscribeUrl}" style="color: ${BRAND.mutedForeground};">${escapeHtml(copy.unsubscribe)}</a>
        </p>
  `);

  const text = [
    greeting,
    "",
    intro,
    "",
    `${input.nextStepTitle}: ${input.journeyUrl}`,
    "",
    copy.mechanism,
    "",
    `${copy.cta}: ${input.journeyUrl}`,
    "",
    `${copy.unsubscribe}: ${input.unsubscribeUrl}`,
  ].join("\n");

  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// Recipient selection
// ---------------------------------------------------------------------------

/**
 * The candidates query, exported UN-AWAITED so e2e/l0 can pin its compiled
 * SQL without a database (e2e/l0/lifecycle-eligibility.test.ts). Same lesson
 * as nis2-scope.test.ts: cron-only queries are executed by no browser flow
 * and no suite, so the compiled SQL is the only thing a test can hold still.
 */
export function buildCandidateQuery(db: DbOrTx, cutoff: Date) {
  // When they were last here, best knowledge first: accounts from before
  // the lastLoginAt column fall back to when they proved their mailbox,
  // then to signup time.
  const dormantSince = sql`COALESCE(${user.lastLoginAt}, ${user.emailVerifiedAt}, ${user.createdAt})`;

  // Cheap soft filter for "never claimed"; the partial unique index on
  // notification is the hard guarantee at insert time.
  const priorClaim = db
    .select({ one: sql`1` })
    .from(notification)
    .where(
      and(
        eq(notification.recipientId, user.id),
        eq(notification.entityType, LIFECYCLE_ENTITY_TYPE),
        eq(notification.triggerField, ACTIVATION_NUDGE_KEY),
      ),
    );

  return (
    db
      .select({
        userId: user.id,
        email: user.email,
        name: user.name,
        companyId: company.id,
        locale: user.locale,
        country: company.country,
      })
      .from(user)
      .innerJoin(company, eq(user.companyId, company.id))
      .where(
        and(
          isNotNull(user.emailVerifiedAt),
          eq(user.isDisposableEmail, false),
          eq(user.emailFollowupsDisabled, false),
          // Bound as an ISO string, not a Date: a raw sql`` parameter has no
          // column encoder, so node-postgres would serialize a Date as LOCAL
          // wall time while the compared columns hold UTC — a ~2h skew on
          // any TZ-set self-host. The ISO string always carries UTC.
          sql`${dormantSince} <= ${cutoff.toISOString()}`,
          notExists(priorClaim),
        ),
      )
      // Oldest-dormant first, so the dispatcher's per-run cap defers
      // deterministically (FIFO) instead of by whatever order the planner
      // returns rows in.
      .orderBy(asc(dormantSince))
  );
}

export const activationNudge: LifecycleEmailType = {
  key: ACTIVATION_NUDGE_KEY,
  description:
    "One-time re-engagement email for quiet accounts with open NIS 2 path steps",

  async prepare(db: DbOrTx): Promise<PreparedLifecycleEmail[]> {
    const cutoff = new Date(Date.now() - NUDGE_AFTER_DAYS * 24 * 60 * 60 * 1000);
    const candidates = await buildCandidateQuery(db, cutoff);
    if (candidates.length === 0) return [];

    // Drop anyone with audit-logged activity since the cutoff. lastLoginAt is
    // NULL for every account predating the column, so without this check the
    // first run would nudge users who were busy in the product yesterday.
    // Every tRPC mutation is audit-logged with the acting userId; querying by
    // createdAt keeps this on the indexed column. Deliberately NOT filtered
    // to the candidate ids: distinct active users inside the window is
    // bounded by real usage, while an IN list over the whole dormant backlog
    // would bind one parameter per candidate (audit_log has no user_id index
    // to reward it, and node-postgres hard-fails at 65535 binds).
    const recentlyActive = await db
      .selectDistinct({ userId: auditLog.userId })
      .from(auditLog)
      .where(and(gt(auditLog.createdAt, cutoff), isNotNull(auditLog.userId)));
    const activeIds = new Set(recentlyActive.map((r) => r.userId));
    const quiet = candidates.filter((c) => !activeIds.has(c.userId));
    if (quiet.length === 0) return [];

    // One bulk read of every candidate company's NIS 2 path, summarized in
    // memory (~49 rows per company).
    const companyIds = Array.from(new Set(quiet.map((c) => c.companyId)));
    const statusRows = await db
      .select({
        companyId: companyAssessment.companyId,
        status: companyRequirementStatus.status,
        code: requirement.code,
        sortOrder: requirement.sortOrder,
        // Category order joins in so summarizeJourneys can rank by the same
        // journeyPosition the path view uses — requirement.sortOrder alone is
        // only unique WITHIN a category.
        categorySortOrder: requirementCategory.sortOrder,
      })
      .from(companyRequirementStatus)
      .innerJoin(
        companyAssessment,
        eq(companyRequirementStatus.assessmentId, companyAssessment.id),
      )
      .innerJoin(
        complianceFramework,
        and(
          eq(complianceFramework.id, companyAssessment.frameworkId),
          eq(complianceFramework.code, NIS2_FRAMEWORK_CODE),
        ),
      )
      .innerJoin(requirement, eq(companyRequirementStatus.requirementId, requirement.id))
      .innerJoin(requirementCategory, eq(requirement.categoryId, requirementCategory.id))
      .where(inArray(companyAssessment.companyId, companyIds));
    const journeys = summarizeJourneys(statusRows);

    const appUrl = getAppUrl();
    const prepared: PreparedLifecycleEmail[] = [];
    for (const candidate of quiet) {
      const journey: JourneySummary | undefined = journeys.get(candidate.companyId);
      // No path or nothing open: nothing to nudge toward. The claim stays
      // unspent, so the user becomes eligible again if steps reopen later.
      if (!journey || journey.total === 0 || !journey.nextCode) continue;

      const locale = resolveEmailLocale(candidate.locale, candidate.country);
      // Locale-prefixed link (de is the unprefixed canonical): routing is
      // "as-needed" and the recipient has been away long enough for the
      // NEXT_LOCALE session cookie to be gone, so a bare /journey would
      // renegotiate from Accept-Language and can land an en/nl reader on
      // the German page.
      const journeyUrl =
        locale === "de" ? `${appUrl}/journey` : `${appUrl}/${locale}/journey`;
      const requirementsMessages = await getRequirementsMessages(locale);
      const nextStepTitle = getRequirementTitle(requirementsMessages, journey.nextCode);
      const unsubscribeUrl = buildUnsubscribeUrl(candidate.userId);
      const email = renderActivationNudge({
        name: candidate.name,
        locale,
        done: journey.done,
        total: journey.total,
        nextStepTitle,
        journeyUrl,
        unsubscribeUrl,
      });

      prepared.push({
        userId: candidate.userId,
        companyId: candidate.companyId,
        to: candidate.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
        linkUrl: journeyUrl,
        note: journey.nextCode,
        unsubscribeUrl,
      });
    }
    return prepared;
  },
};
