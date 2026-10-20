/**
 * Activation nudge: the first lifecycle email. Sent once, ever, to a user who signed up, went
 * quiet, and still has a step open on their company's NIS 2 walkthrough. It names the step the
 * walkthrough's home would open and links to that home, in one of two versions:
 *
 *   - open: the account may walk (paid). The email gives the real progress, and the step is the
 *     one its Continue button opens.
 *   - locked: every other account (free, or grandfathered with the journey). The walkthrough is
 *     locked for it, so the email names its first step and says the page shows how to unlock it.
 *     The home shows the same: every step, the price and the way to order. Where nothing can be
 *     ordered (a self-hosted instance), a locked account gets no nudge.
 *
 * Eligibility (all must hold):
 *   - email proved (emailVerifiedAt set), not a disposable domain
 *   - not opted out: neither the all-off flag (emailFollowupsDisabled) nor
 *     a preference-centre row covering this email
 *   - has a company (draft shells INCLUDED — a drive-by signup is exactly who
 *     this email is for; contrast the digests, which exclude drafts)
 *   - quiet for NUDGE_AFTER_DAYS or more: last sign-in (or, for accounts
 *     predating the lastLoginAt column, verification/signup) is older than
 *     the cutoff, AND no audit-logged activity by this user since the
 *     cutoff. "Or more" is deliberate: long-dormant accounts qualify the
 *     first time the cron runs, and the once-ever claim row keeps that from
 *     ever repeating.
 *   - the walkthrough has a step left to do
 */
import { and, asc, eq, gt, inArray, isNotNull, notExists, sql } from "drizzle-orm";
import { effectiveAccessLevel, mayWalkDurchgang } from "@/lib/billing/access";
import { mayOrderIn, orderingMode } from "@/lib/billing/ordering";
import type { DbOrTx } from "@/lib/db";
import {
  itemsFor,
  NIS2_WALK,
  resolveItem,
  SETUP_STEP,
  type WalkLocale,
  walkLocaleOf,
} from "@/lib/durchgang";
import { unsubscribeUrl as buildUnsubscribeUrl } from "@/lib/email/unsubscribe";
import { env } from "@/lib/env";
import { categoryScope, SCOPE_ALL, typeScope } from "@/lib/mail/consent-rules";
import { emailTypeCategory } from "@/lib/mail/email-types";
import ActivationNudgeEmail from "@/lib/mail/emails/activation-nudge";
import { displayableFirstName } from "@/lib/mail/first-name";
import { type EmailContent, safeHeader } from "@/lib/mail/layout";
import { resolveEmailLocale } from "@/lib/mail/locale";
import { renderEmail } from "@/lib/mail/render";
import { localizedAbsoluteUrl } from "@/lib/seo";
import {
  auditLog,
  billingAccount,
  company,
  emailPreference,
  notification,
  user,
} from "@/schema";
import { walkStates } from "@/server/trpc/helpers/durchgang";
import {
  LIFECYCLE_ENTITY_TYPE,
  type LifecycleEmailType,
  type PreparedLifecycleEmail,
} from "../types";
import { type WalkProgress, type WalkStep, walkProgress } from "../walk-progress";
import { NUDGE_COPY, WALK_COPY } from "./activation-nudge-copy";

// Campaign identifier, not a credential — the "KEY" in the name is the
// notification.triggerField dedup key. `gitleaks:allow` suppresses the
// generic-api-key false positive (same precedent as the share-password
// alphabet in platform-admin.ts). Kept at v1 when the email moved from the journey to the
// walkthrough: a new key would mail everyone who already had the journey version a second time.
export const ACTIVATION_NUDGE_KEY = "activation_nudge_v1"; // gitleaks:allow

/**
 * How long an account must be quiet before the nudge. Three days, not two:
 * the Monday 08:00 cron with a two-day window reached back to Saturday
 * morning and read every ordinary Friday sign-in as "went quiet", burning
 * the once-ever email on people who were merely offline over the weekend.
 * Three days clears a weekend; a week is churn territory. Single constant,
 * safe to tune.
 */
export const NUDGE_AFTER_DAYS = 3;

/** The message type the dispatcher sends this campaign as. */
const NUDGE_EMAIL_TYPE = "product.lifecycle_nudge";

/** The walkthrough's home, where both versions link: it shows each account its own way on. */
const WALK_HOME = "/durchgang/nis2";

/** Where the reader's walkthrough stands, as the email tells it. */
export type NudgeWalk =
  | { readonly kind: "open"; readonly done: number; readonly total: number }
  | { readonly kind: "locked"; readonly total: number };

export interface ActivationNudgeInput {
  name: string | null;
  locale: WalkLocale;
  walk: NudgeWalk;
  nextStepTitle: string;
  walkUrl: string;
  unsubscribeUrl: string;
}

export async function renderActivationNudge(
  input: ActivationNudgeInput,
): Promise<EmailContent> {
  const copy = NUDGE_COPY[input.locale];
  const { nis2 } = WALK_COPY[input.locale].walks;
  const { walk } = input;
  const started = walk.kind === "open" && walk.done > 0;
  const greeting = copy.greeting(displayableFirstName(input.name));
  const intro =
    walk.kind === "locked"
      ? copy.locked(walk.total)
      : started
        ? copy.progress(walk.done, walk.total)
        : copy.fresh(walk.total);
  const notes = walk.kind === "locked" ? [copy.promise, copy.unlock] : [copy.promise];
  // The open version's button says what the button it lands on says.
  const cta =
    walk.kind === "locked" ? copy.see : started ? nis2.continue : nis2.intro.start;
  const subject = safeHeader(
    `${started ? copy.subjectNext : copy.subjectFirst}: ${input.nextStepTitle}`,
  );
  const question = started ? copy.askStarted : copy.askNew;

  const html = await renderEmail(ActivationNudgeEmail, {
    locale: input.locale,
    greeting,
    intro,
    nextStepTitle: input.nextStepTitle,
    walkUrl: input.walkUrl,
    notes,
    cta,
    question,
    signOff: copy.signOff,
    unsubscribeLabel: copy.unsubscribe,
    unsubscribeUrl: input.unsubscribeUrl,
  });

  const text = [
    greeting,
    "",
    intro,
    "",
    `${input.nextStepTitle}: ${input.walkUrl}`,
    "",
    ...notes.flatMap((note) => [note, ""]),
    `${cta}: ${input.walkUrl}`,
    "",
    question,
    "",
    copy.signOff,
    "",
    `${copy.unsubscribe}: ${input.unsubscribeUrl}`,
  ].join("\n");

  return { subject, html, text };
}

/** A step's title as the walkthrough's home shows it; null if its copy does not parse. */
function stepTitle(step: WalkStep, locale: WalkLocale): string | null {
  if (step.kind === "setup") return WALK_COPY[locale].ui.home.setupHeadline;
  const words = resolveItem(WALK_COPY[locale], step.item);
  return words.ok ? words.value.headline : null;
}

// ---------------------------------------------------------------------------
// One recipient
// ---------------------------------------------------------------------------

/** What the email needs to know about a person and the company they have open. */
const RECIPIENT = {
  userId: user.id,
  email: user.email,
  name: user.name,
  locale: user.locale,
  grandfatheredAt: user.grandfatheredAt,
  companyId: company.id,
  country: company.country,
  entityType: company.entityType,
  criticalInstallation: company.criticalInstallation,
  activatedAt: company.activatedAt,
  accessLevel: billingAccount.accessLevel,
};

type Recipient = Awaited<ReturnType<typeof buildCandidateQuery>>[number];

/**
 * Where the recipient's walkthrough stands, the way its home shows it to them: progress if their
 * account may walk, otherwise every step open. Platform admins are not let in here: the email
 * goes to customers, and an operator's account reads as the level it has.
 */
async function walkOfRecipient(
  db: DbOrTx,
  r: Recipient,
): Promise<{ readonly mayWalk: boolean; readonly progress: WalkProgress }> {
  const mayWalk = mayWalkDurchgang(
    effectiveAccessLevel(r.accessLevel, r.grandfatheredAt !== null),
    false,
  );
  const states = mayWalk
    ? new Map(
        (await walkStates(db, r.companyId, NIS2_WALK)).map((s) => [s.code, s.state]),
      )
    : null;
  return {
    mayWalk,
    progress: walkProgress({
      walk: itemsFor(NIS2_WALK, r),
      states,
      setUp: r.activatedAt !== null,
    }),
  };
}

type NudgeEmail = EmailContent & {
  readonly walkUrl: string;
  /** The step the email names, kept on the claim row for the admin view. */
  readonly nextCode: string;
  readonly unsubscribeUrl: string;
};

/** The recipient's email, or null when nothing is left to name. */
async function emailFor(
  db: DbOrTx,
  r: Recipient,
  opts: { readonly fromStart?: boolean } = {},
): Promise<NudgeEmail | null> {
  const { mayWalk, progress } = await walkOfRecipient(db, r);
  // A locked walkthrough is worth an email only where it can be unlocked: a deployment that sells
  // nothing (a self-hosted instance) shows a locked home with no way to order.
  if (!mayWalk && !mayOrderIn(orderingMode(env), false)) return null;
  const shown =
    opts.fromStart && !progress.next
      ? walkProgress({
          walk: itemsFor(NIS2_WALK, r),
          states: null,
          setUp: r.activatedAt !== null,
        })
      : progress;
  if (!shown.next) return null;
  const locale = walkLocaleOf(resolveEmailLocale(r.locale, r.country));
  const nextStepTitle = stepTitle(shown.next, locale);
  if (!nextStepTitle) return null;
  // The link carries the language (German is the unprefixed default): the
  // recipient has been away long enough for the NEXT_LOCALE cookie to be gone,
  // so a bare path would renegotiate from Accept-Language.
  const walkUrl = localizedAbsoluteUrl(WALK_HOME, locale);
  const unsubscribeUrl = buildUnsubscribeUrl(r.userId);
  const walk: NudgeWalk = mayWalk
    ? { kind: "open", done: shown.done, total: shown.total }
    : { kind: "locked", total: shown.total };
  const email = await renderActivationNudge({
    name: r.name,
    locale,
    walk,
    nextStepTitle,
    walkUrl,
    unsubscribeUrl,
  });
  const nextCode = shown.next.kind === "item" ? shown.next.item.code : SETUP_STEP;
  return { ...email, walkUrl, nextCode, unsubscribeUrl };
}

// ---------------------------------------------------------------------------
// Test send (platform admin "send me this email")
// ---------------------------------------------------------------------------

/**
 * Render this campaign for ONE user, ignoring eligibility — the platform admin's "send me a
 * test" path. The user's own version, from their own walkthrough; if every step of it is
 * finished, the version from its start, so there is always something to look at. Claims nothing
 * and checks no dormancy; the caller decides where the result goes. Null when the user has no
 * company to walk for.
 */
export async function prepareActivationNudgeSample(
  db: DbOrTx,
  userId: string,
): Promise<{
  to: string;
  subject: string;
  html: string;
  text: string;
  unsubscribeUrl: string;
} | null> {
  const [target] = await db
    .select(RECIPIENT)
    .from(user)
    .innerJoin(company, eq(user.companyId, company.id))
    .innerJoin(billingAccount, eq(company.billingAccountId, billingAccount.id))
    .where(eq(user.id, userId))
    .limit(1);
  if (!target) return null;
  const email = await emailFor(db, target, { fromStart: true });
  if (!email) return null;
  return {
    to: target.email,
    subject: email.subject,
    html: email.html,
    text: email.text,
    unsubscribeUrl: email.unsubscribeUrl,
  };
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

  // Opt-outs from the preference centre that cover this email. The all-off
  // flag is checked on the user row below; these are the finer rows the
  // consent gate also honours. Filtering here keeps the admin queue honest:
  // nobody is listed whom the dispatcher would then skip as opted out.
  const optedOut = db
    .select({ one: sql`1` })
    .from(emailPreference)
    .where(
      and(
        eq(emailPreference.userId, user.id),
        inArray(emailPreference.scope, [
          SCOPE_ALL,
          categoryScope(emailTypeCategory(NUDGE_EMAIL_TYPE)),
          typeScope(NUDGE_EMAIL_TYPE),
        ]),
      ),
    );

  return (
    db
      .select(RECIPIENT)
      .from(user)
      .innerJoin(company, eq(user.companyId, company.id))
      // Whether the walkthrough is open is the account's: every company has a billing account.
      .innerJoin(billingAccount, eq(company.billingAccountId, billingAccount.id))
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
          notExists(optedOut),
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
    "One-time email for quiet accounts with a step left on their NIS 2 walkthrough",

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

    // One by one: a locked walkthrough needs no query, an open one reads its states.
    const prepared: PreparedLifecycleEmail[] = [];
    for (const candidate of quiet) {
      // Nothing left to name: the claim stays unspent, so the user becomes
      // eligible again if a step reopens later.
      const email = await emailFor(db, candidate);
      if (!email) continue;
      prepared.push({
        userId: candidate.userId,
        companyId: candidate.companyId,
        to: candidate.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
        linkUrl: email.walkUrl,
        note: email.nextCode,
        unsubscribeUrl: email.unsubscribeUrl,
      });
    }
    return prepared;
  },
};
