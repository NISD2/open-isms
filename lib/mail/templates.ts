/**
 * Email builders: each returns { subject, html, text } for one message.
 *
 * The HTML is a React Email component in ./emails, rendered here with renderEmail; the subject
 * and the plain-text twin are written here, next to it. Usage:
 *   const email = await inviteEmail({ ... });
 *   await sendMail({ to: "user@co.com", ...email });
 */

import { describeSignupCampaign } from "@/lib/auth/signup-campaign";
import { isSellerInstance } from "@/lib/billing/seller";
import { CALENDAR_URL } from "@/lib/booking";
import type { WalkLocale } from "@/lib/durchgang/types";
import { mailSupportEmail } from "@/lib/env";
import type { Locale } from "@/lib/seo";
import type { SignupCampaign } from "@/schema";
import {
  type DigestItem,
  type DigestNextStep,
  formatPercent,
  payoffLine,
  withUtm,
} from "./digest";
import AccountSetupEmail, { ACCOUNT_SETUP_COPY } from "./emails/account-setup";
import AssistantConnectedEmail, {
  ASSISTANT_CONNECTED_COPY,
} from "./emails/assistant-connected";
import CategoryAssignedEmail, {
  CATEGORY_ASSIGNED_COPY,
} from "./emails/category-assigned";
import CategoryUnassignedEmail, {
  CATEGORY_UNASSIGNED_COPY,
} from "./emails/category-unassigned";
import CodeEmail from "./emails/code";
import ContactEmailChangedEmail, {
  CONTACT_EMAIL_CHANGED_COPY,
} from "./emails/contact-email-changed";
import CourseFollowupEmail, { COURSE_FOLLOWUP_COPY } from "./emails/course-followup";
import DailyDigestEmail, { DAILY_DIGEST_COPY } from "./emails/daily-digest";
import DocumentLetterEmail from "./emails/document-letter";
import InviteEmail, { INVITE_COPY, inviteText } from "./emails/invite";
import ManagementHandoffEmail, {
  MANAGEMENT_HANDOFF_COPY,
  type ManagementHandoffProps,
} from "./emails/management-handoff";
import MemberRemovedEmail, { MEMBER_REMOVED_COPY } from "./emails/member-removed";
import NewSaleEmail, { type NewSaleProps } from "./emails/new-sale";
import NewsletterEmail from "./emails/newsletter";
import OperatorAlertEmail from "./emails/operator-alert";
import { AdvisoryRequestEmail, NewSignupEmail } from "./emails/operator-notices";
import RegistrationAttemptEmail from "./emails/registration-attempt";
import ReviewDecisionEmail, { REVIEW_DECISION_COPY } from "./emails/review-decision";
import {
  SupplierAddedYouEmail,
  SupplierIncidentEmail,
  SupplierInviteEmail,
} from "./emails/supplier-mails";
import WeeklyDigestEmail, { WEEKLY_DIGEST_COPY } from "./emails/weekly-digest";
import WelcomeEmail, { WELCOME_COPY, welcomeText } from "./emails/welcome";
import {
  type EmailContent,
  letterReplyTo,
  letterSignOff,
  type PreferenceFooter,
  preferenceFooterText,
  safeHeader,
} from "./layout";
import { type EmailLocale, resolveEmailLocale, workflowMailLocaleOf } from "./locale";
import { renderEmail } from "./render";
import { companyNameForMail } from "./sender-name";
import { signupFollowUp } from "./signup-followup";
import type { MailAttachment } from "./transport";

export type { DigestItem, DigestNextStep } from "./digest";

/** The email language closest to a site locale. */
const emailLocaleOf = (locale: Locale | undefined): EmailLocale =>
  resolveEmailLocale(locale ?? null, null);

/**
 * The language of a workflow mail whose callers do not all name the reader's language yet: those
 * that do not keep the English this mail always had.
 */
const workflowLocaleOr = (locale: EmailLocale | undefined) =>
  workflowMailLocaleOf(locale ?? "en");

// ---------------------------------------------------------------------------
// Welcome
// ---------------------------------------------------------------------------

/**
 * Where a reply to mail written in a person's voice reaches one: on nisd2.eu the published contact
 * address (letterReplyTo), since the sender and SUPPORT_EMAIL take no mail; elsewhere the
 * instance's own SUPPORT_EMAIL.
 */
export const replyAddress = (): string => letterReplyTo() ?? mailSupportEmail();

/**
 * After the first sign-in: a short note from the team and one place to start. It asks for
 * questions, so on nisd2.eu they go to the published contact address, not the no-reply sender.
 */
export async function welcomeEmail(opts: {
  name: string;
  locale: EmailLocale;
}): Promise<EmailContent & { readonly replyTo?: string }> {
  const replyTo = letterReplyTo();
  const props = {
    locale: workflowMailLocaleOf(opts.locale),
    name: opts.name,
    contact: replyAddress(),
    // Only the seller has a calendar to offer.
    bookingUrl: isSellerInstance() ? CALENDAR_URL : null,
  };
  return {
    subject: WELCOME_COPY[props.locale].subject,
    html: await renderEmail(WelcomeEmail, props),
    text: welcomeText(props),
    ...(replyTo ? { replyTo } : {}),
  };
}

// ---------------------------------------------------------------------------
// Invite
// ---------------------------------------------------------------------------

export async function inviteEmail(opts: {
  companyName: string;
  inviterName: string;
  inviteUrl: string;
  role: string;
  /** The invitee's language, when the caller knows it. */
  locale?: EmailLocale;
}): Promise<EmailContent> {
  const { companyName, inviterName, inviteUrl, role } = opts;
  const locale = workflowLocaleOr(opts.locale);
  const copy = INVITE_COPY[locale];
  return {
    subject: copy.subject({
      inviterName: safeHeader(inviterName),
      companyName: safeHeader(companyName),
      role,
    }),
    html: await renderEmail(InviteEmail, {
      locale,
      companyName,
      inviterName,
      inviteUrl,
      role,
    }),
    text: [
      copy.heading(companyName),
      ``,
      inviteText(locale, { companyName, inviterName, role }),
      ``,
      `${copy.acceptText}: ${inviteUrl}`,
      ``,
      copy.expires,
    ].join("\n"),
  };
}

const HANDOFF_QUESTIONS: Record<WalkLocale, string> = {
  de: "Fragen? Antworten Sie einfach auf diese E-Mail.",
  en: "Questions? Just reply to this email.",
  cs: "Máte otázky? Stačí odpovědět na tento e-mail.",
};

/**
 * Management's invitation into the company's account, from the walk's lock. The three names were
 * typed by people, so each is made unlinkable (companyNameForMail) before it goes into a mail from
 * our domain. Replies reach a person where one reads them (replyAddress).
 */
export async function managementHandoffEmail(opts: {
  readonly locale: WalkLocale;
  readonly name: string;
  readonly inviterName: string | null;
  readonly companyName: string | null;
  readonly inviteUrl: string;
  readonly days: number;
}): Promise<EmailContent & { readonly replyTo: string }> {
  const copy = MANAGEMENT_HANDOFF_COPY[opts.locale];
  const replyTo = letterReplyTo();
  const props = {
    locale: opts.locale,
    name: companyNameForMail(opts.name, ""),
    inviterName: companyNameForMail(opts.inviterName, copy.colleague),
    companyName: companyNameForMail(opts.companyName, copy.company),
    inviteUrl: opts.inviteUrl,
    days: opts.days,
    questions: replyTo ? HANDOFF_QUESTIONS[opts.locale] : null,
  } satisfies ManagementHandoffProps;
  return {
    subject: safeHeader(copy.subject(props)),
    html: await renderEmail(ManagementHandoffEmail, props),
    text: [
      copy.hello(props.name),
      copy.invite(props),
      copy.sameAccount(props),
      `${copy.button}: ${props.inviteUrl}`,
      copy.note(props.days),
      ...(props.questions ? [props.questions] : []),
    ].join("\n\n"),
    replyTo: replyAddress(),
  };
}

// ---------------------------------------------------------------------------
// Contact Email Changed
// ---------------------------------------------------------------------------

export async function contactEmailChangedEmail(opts: {
  companyName: string;
  oldEmail: string;
  newEmail: string;
  /** The company's language, when the caller knows it. */
  locale?: EmailLocale;
}): Promise<EmailContent> {
  const { companyName, oldEmail, newEmail } = opts;
  const locale = workflowLocaleOr(opts.locale);
  const copy = CONTACT_EMAIL_CHANGED_COPY[locale];
  return {
    subject: copy.subject(safeHeader(companyName)),
    html: await renderEmail(ContactEmailChangedEmail, {
      locale,
      companyName,
      oldEmail,
      newEmail,
    }),
    text: [
      copy.heading,
      ``,
      `${copy.changed.lead}${companyName}${copy.changed.end}`,
      ``,
      `${copy.previous}: ${oldEmail}`,
      `${copy.next}: ${newEmail}`,
      ``,
      copy.notYou,
    ].join("\n"),
  };
}

// ---------------------------------------------------------------------------
// AI assistant connected
// ---------------------------------------------------------------------------

/**
 * To the person, when a key is made for their assistants or an assistant is allowed as them. The
 * assistant's name is the one it gave itself, so it is made unlinkable like every other name
 * someone else typed (companyNameForMail).
 */
export async function assistantConnectedEmail(opts: {
  readonly companyName: string;
  readonly how:
    | { readonly kind: "key" }
    | {
        readonly kind: "signin";
        readonly assistant: string | null;
        readonly returnHost: string;
      };
  readonly settingsUrl: string;
  readonly locale?: EmailLocale;
}): Promise<EmailContent> {
  const locale = workflowLocaleOr(opts.locale);
  const copy = ASSISTANT_CONNECTED_COPY[locale];
  const companyName = companyNameForMail(opts.companyName, opts.companyName);
  const how =
    opts.how.kind === "key"
      ? opts.how
      : {
          kind: "signin" as const,
          assistant: companyNameForMail(opts.how.assistant, "An assistant"),
          returnHost: opts.how.returnHost,
        };
  return {
    subject: safeHeader(copy.subject(companyName)),
    html: await renderEmail(AssistantConnectedEmail, {
      locale,
      companyName,
      how,
      settingsUrl: opts.settingsUrl,
    }),
    text: [
      copy.heading,
      ``,
      how.kind === "key"
        ? copy.key(companyName)
        : copy.signin(how.assistant, companyName, how.returnHost),
      ``,
      copy.what,
      ``,
      `${copy.button}: ${opts.settingsUrl}`,
      ``,
      copy.notYou,
    ].join("\n"),
  };
}

// ---------------------------------------------------------------------------
// Category Assigned
// ---------------------------------------------------------------------------

export async function categoryAssignedEmail(opts: {
  assigneeName: string;
  categoryName: string;
  categoryCode: string;
  companyName: string;
  assignerName: string;
  categoryUrl: string;
  footer: PreferenceFooter;
}): Promise<EmailContent> {
  const copy = CATEGORY_ASSIGNED_COPY[workflowMailLocaleOf(opts.footer.locale)];
  const { lead, end } = copy.assigned(opts);
  return {
    subject: copy.subject({
      ...opts,
      assignerName: safeHeader(opts.assignerName),
      categoryName: safeHeader(opts.categoryName),
    }),
    html: await renderEmail(CategoryAssignedEmail, opts),
    text: [
      copy.heading,
      ``,
      `${lead}${opts.categoryName}${end}`,
      ``,
      `${copy.goTo}: ${opts.categoryUrl}`,
      "",
      preferenceFooterText(opts.footer),
    ].join("\n"),
  };
}

// ---------------------------------------------------------------------------
// Category Unassigned
// ---------------------------------------------------------------------------

export async function categoryUnassignedEmail(opts: {
  assigneeName: string;
  categoryName: string;
  categoryCode: string;
  companyName: string;
  footer: PreferenceFooter;
}): Promise<EmailContent> {
  const copy = CATEGORY_UNASSIGNED_COPY[workflowMailLocaleOf(opts.footer.locale)];
  const { lead, end } = copy.unassigned(opts);
  return {
    subject: copy.subject(safeHeader(opts.categoryName)),
    html: await renderEmail(CategoryUnassignedEmail, opts),
    text: [
      copy.heading,
      ``,
      `${lead}${opts.categoryName}${end}`,
      ``,
      copy.mistake,
      "",
      preferenceFooterText(opts.footer),
    ].join("\n"),
  };
}

// ---------------------------------------------------------------------------
// Review Decision (Approved / Rejected)
// ---------------------------------------------------------------------------

export async function reviewDecisionEmail(opts: {
  submitterName: string;
  requirementCode: string;
  requirementTitle: string;
  decision: "approved" | "rejected";
  feedback?: string | null;
  footer: PreferenceFooter;
}): Promise<EmailContent> {
  const { submitterName, requirementCode, requirementTitle, decision, feedback } = opts;
  const copy = REVIEW_DECISION_COPY[workflowMailLocaleOf(opts.footer.locale)];
  return {
    subject: copy.subject[decision](safeHeader(requirementCode)),
    html: await renderEmail(ReviewDecisionEmail, opts),
    text: [
      copy.heading[decision],
      ``,
      `${copy.lead(submitterName)}${requirementCode}${copy.middle(requirementTitle)}${copy.decision[decision]}.`,
      feedback ? `\n${copy.feedback}: ${feedback}` : "",
      "",
      preferenceFooterText(opts.footer),
    ].join("\n"),
  };
}

// ---------------------------------------------------------------------------
// Member Removed
// ---------------------------------------------------------------------------

export async function memberRemovedEmail(opts: {
  companyName: string;
  memberName: string;
  /** The removed member's language, when the caller knows it. */
  locale?: EmailLocale;
}): Promise<EmailContent> {
  const { companyName, memberName } = opts;
  const locale = workflowLocaleOr(opts.locale);
  const copy = MEMBER_REMOVED_COPY[locale];
  const { lead, end } = copy.removed(memberName);
  return {
    subject: copy.subject(safeHeader(companyName)),
    html: await renderEmail(MemberRemovedEmail, { locale, companyName, memberName }),
    text: [
      copy.heading(companyName),
      ``,
      `${lead}${companyName}${end}`,
      ``,
      copy.mistake,
    ].join("\n"),
  };
}

// ---------------------------------------------------------------------------
// Business documents: invoice, credit note, cancellation, refund, erasure
// ---------------------------------------------------------------------------

/** One fact on a document card. `detail` is a quieter line under the value. */
export interface DocumentFact {
  readonly label: string;
  readonly value: string;
  readonly detail?: string;
  /** What the reader acts on, an amount or a date: set in bold. */
  readonly emphasis?: boolean;
}

/**
 * A letter about one business document. The wording lives with the document (lib/billing,
 * lib/gdpr), so the email and the document say the same thing; this lays it out the way the
 * document reads: a card with its name, its number and the facts someone acts on, and the letter
 * around it.
 */
export interface DocumentEmail {
  readonly locale: EmailLocale;
  readonly subject: string;
  readonly heading: string;
  readonly greeting: string;
  readonly intro: readonly string[];
  readonly document: {
    readonly kind: string;
    readonly reference: string;
    readonly facts: readonly DocumentFact[];
  };
  readonly outro: readonly string[];
  /**
   * Further documents the letter carries, each with its own lines and card, after the main card:
   * the credit note inside the erasure confirmation.
   */
  readonly enclosed?: readonly DocumentSection[];
  /** A URL inside the intro or outro, made clickable: Qonto's page when the PDF is missing. */
  readonly link?: string | null;
  /** Safe HTML and its text twin, shown below the signature: the formal erasure record. */
  readonly appendix?: { readonly html: string; readonly text: string };
}

/** One document's part of a letter: the lines before its card, the card, the lines after. */
export type DocumentSection = Pick<DocumentEmail, "intro" | "document" | "outro">;

/** A document that travels inside another letter, with its file when there is one. */
export interface Enclosure {
  readonly section: DocumentSection;
  readonly attachment: MailAttachment | null;
}

const QUESTIONS: Record<EmailLocale, string> = {
  de: "Fragen dazu? Antworten Sie einfach auf diese E-Mail.",
  en: "Questions? Just reply to this email.",
  nl: "Vragen? Beantwoord deze e-mail gewoon.",
  cs: "Máte k tomu otázky? Stačí odpovědět na tento e-mail.",
};

const documentCardText = ({
  kind,
  reference,
  facts,
}: DocumentEmail["document"]): string =>
  [
    `${kind} ${reference}`,
    ...facts.map((f) => `${f.label}: ${f.value}${f.detail ? ` (${f.detail})` : ""}`),
  ].join("\n");

/**
 * Lay out a business document letter. The sending address takes no mail, so the letter invites a
 * reply only where one reaches a person (letterReplyTo), and `replyTo` travels with the content
 * into sendMail.
 */
export async function documentEmail(
  mail: DocumentEmail,
): Promise<EmailContent & { readonly replyTo?: string }> {
  const replyTo = letterReplyTo();
  const signOff = letterSignOff(mail.locale);
  const html = await renderEmail(DocumentLetterEmail, {
    mail,
    questions: replyTo ? QUESTIONS[mail.locale] : null,
    signOff,
  });
  const text = [
    mail.greeting,
    ...mail.intro,
    documentCardText(mail.document),
    ...(mail.enclosed ?? []).flatMap((part) => [
      ...part.intro,
      documentCardText(part.document),
      ...part.outro,
    ]),
    ...mail.outro,
    ...(replyTo ? [QUESTIONS[mail.locale]] : []),
    signOff.join("\n"),
    ...(mail.appendix ? ["---", mail.appendix.text] : []),
  ].join("\n\n");
  return {
    subject: safeHeader(mail.subject),
    html,
    text,
    ...(replyTo ? { replyTo } : {}),
  };
}

/**
 * The way into an account a platform admin opened on a sales call. Sent next to the invoice; the
 * link sets a first password, or the person continues with Google under the same address.
 */
export async function accountSetupEmail(opts: {
  readonly setupUrl: string;
  readonly locale: WalkLocale;
}): Promise<EmailContent> {
  const copy = ACCOUNT_SETUP_COPY[opts.locale];
  return {
    subject: copy.subject,
    html: await renderEmail(AccountSetupEmail, opts),
    text: [copy.heading, "", copy.body, "", opts.setupUrl, "", copy.note].join("\n"),
  };
}

/** To the operators: an order or invoice that needs a person in Qonto. Plain facts, one per line. */
export async function billingAlertEmail(opts: {
  readonly subject: string;
  readonly lines: readonly string[];
}): Promise<EmailContent> {
  return {
    subject: `[RECHNUNG] ${safeHeader(opts.subject)}`,
    html: await renderEmail(OperatorAlertEmail, { lines: opts.lines }),
    text: opts.lines.join("\n"),
  };
}

/** To the operators: a GDPR erasure that needs a person to finish it. Plain facts, one per line. */
export async function gdprAlertEmail(opts: {
  readonly subject: string;
  readonly lines: readonly string[];
}): Promise<EmailContent> {
  return {
    subject: `[DSGVO] ${safeHeader(opts.subject)}`,
    html: await renderEmail(OperatorAlertEmail, { lines: opts.lines }),
    text: opts.lines.join("\n"),
  };
}

/** To the operators: an invoice was issued. The facts come from lib/billing/sale-notice. */
export async function newSaleEmail(
  opts: NewSaleProps & { readonly subject: string },
): Promise<EmailContent> {
  const { subject, title, rows, adminUrl } = opts;
  return {
    subject: safeHeader(subject),
    html: await renderEmail(NewSaleEmail, { title, rows, adminUrl }),
    text: [
      title,
      "",
      ...rows.map(([label, value]) => `${label}: ${value}`),
      "",
      adminUrl,
    ].join("\n"),
  };
}

// ---------------------------------------------------------------------------
// Daily Digest
// ---------------------------------------------------------------------------

/**
 * Lead with the thing worth opening the mail for. "Daily Compliance Digest" told the reader only
 * that a machine sent it on a schedule, which is the definition of a mail you archive unread.
 * Its own function so the outbox can list a queued digest without rendering it.
 */
export function dailyDigestSubject(
  d: {
    readonly companyName: string;
    readonly overdueItems: readonly DigestItem[];
    readonly urgentItems: readonly DigestItem[];
    readonly upcomingItems: readonly DigestItem[];
  },
  locale: EmailLocale,
): string {
  const { subject } = DAILY_DIGEST_COPY[workflowMailLocaleOf(locale)];
  return safeHeader(
    d.overdueItems.length > 0
      ? subject.overdue(d.overdueItems.length, d.companyName)
      : d.urgentItems.length > 0
        ? subject.urgent(d.urgentItems.length, d.companyName)
        : subject.upcoming(d.upcomingItems.length, d.companyName),
  );
}

/** The weekly report leads with the score; its own function for the same reason. */
export function weeklyDigestSubject(
  d: {
    readonly companyName: string;
    readonly compliancePercentage: string;
  },
  locale: EmailLocale,
): string {
  const workflowLocale = workflowMailLocaleOf(locale);
  return safeHeader(
    WEEKLY_DIGEST_COPY[workflowLocale].subject(
      d.companyName,
      formatPercent(d.compliancePercentage, workflowLocale),
    ),
  );
}

export async function dailyDigestEmail(opts: {
  recipientName: string;
  companyName: string;
  overdueItems: DigestItem[];
  urgentItems: DigestItem[];
  upcomingItems: DigestItem[];
  nextStep: DigestNextStep | null;
  compliancePercentage: string;
  dashboardUrl: string;
  footer: PreferenceFooter;
}): Promise<EmailContent> {
  const {
    recipientName,
    companyName,
    overdueItems,
    urgentItems,
    upcomingItems,
    nextStep,
    compliancePercentage,
    dashboardUrl,
    footer,
  } = opts;
  const locale = workflowMailLocaleOf(footer.locale);
  const copy = DAILY_DIGEST_COPY[locale];
  const intro = copy.intro(recipientName);
  const section = (title: string, items: readonly DigestItem[]): string[] =>
    items.length > 0
      ? [`${title} (${items.length}):`, ...items.map(copy.itemText), ``]
      : [];

  return {
    subject: dailyDigestSubject(opts, footer.locale),
    html: await renderEmail(DailyDigestEmail, opts),
    text: [
      `${copy.heading}: ${companyName}`,
      ``,
      `${intro.lead}${companyName}${intro.end}`,
      `${copy.overallText}: ${formatPercent(compliancePercentage, locale)}`,
      ``,
      ...section(copy.overdue, overdueItems),
      ...section(copy.urgent, urgentItems),
      ...section(copy.upcoming, upcomingItems),
      ...(nextStep
        ? [
            payoffLine(nextStep, locale),
            `${copy.continue}: ${nextStep.requirementCode} ${nextStep.requirementTitle}`,
            withUtm(nextStep.url, "daily_digest"),
            ``,
          ]
        : []),
      `${copy.viewDashboardText}: ${withUtm(dashboardUrl, "daily_digest")}`,
      ``,
      preferenceFooterText(footer),
    ].join("\n"),
  };
}

// ---------------------------------------------------------------------------
// Weekly Management Digest
// ---------------------------------------------------------------------------

export async function weeklyManagementDigestEmail(opts: {
  recipientName: string;
  companyName: string;
  compliancePercentage: string;
  overdueCount: number;
  urgentCount: number;
  escalationCount: number;
  totalRequirements: number;
  completedRequirements: number;
  nextStep: DigestNextStep | null;
  dashboardUrl: string;
  footer: PreferenceFooter;
}): Promise<EmailContent> {
  const {
    recipientName,
    companyName,
    compliancePercentage,
    overdueCount,
    urgentCount,
    escalationCount,
    totalRequirements,
    completedRequirements,
    nextStep,
    dashboardUrl,
    footer,
  } = opts;

  const locale = workflowMailLocaleOf(footer.locale);
  const copy = WEEKLY_DIGEST_COPY[locale];
  const intro = copy.intro(recipientName);
  const percent = formatPercent(compliancePercentage, locale);
  const pct = Math.min(100, Math.max(0, Number.parseFloat(compliancePercentage) || 0));
  const filledBlocks = Math.round(pct / 5);
  const emptyBlocks = 20 - filledBlocks;
  const progressBarText = `[${"#".repeat(filledBlocks)}${"-".repeat(emptyBlocks)}] ${percent}`;

  return {
    subject: weeklyDigestSubject(opts, footer.locale),
    html: await renderEmail(WeeklyDigestEmail, opts),
    text: [
      `${copy.heading}: ${companyName}`,
      ``,
      `${intro.lead}${companyName}${intro.end}`,
      ``,
      `${copy.score}: ${percent}`,
      progressBarText,
      copy.completed(completedRequirements, totalRequirements),
      ``,
      `${copy.overdue}: ${overdueCount}`,
      `${copy.urgent}: ${urgentCount}`,
      `${copy.escalations}: ${escalationCount}`,
      ``,
      ...(nextStep
        ? [
            `${copy.nextUp}: ${nextStep.requirementCode} ${nextStep.requirementTitle} (${nextStep.categoryName}), ${copy.owner(nextStep.assigneeName)}.`,
            withUtm(nextStep.url, "weekly_management_digest"),
            ``,
            copy.recurring,
            ``,
          ]
        : []),
      `${copy.viewDashboardText}: ${withUtm(dashboardUrl, "weekly_management_digest")}`,
      ``,
      `---`,
      ...copy.record,
      ``,
      preferenceFooterText(footer),
    ].join("\n"),
  };
}

// ---------------------------------------------------------------------------
// Supplier Portal: incident broadcast
// ---------------------------------------------------------------------------

/**
 * The supplier mails below go to an address the sending company typed in, so
 * they carry nothing that company wrote except its name, cleaned by
 * companyNameForMail. The incident's title and text, and an invite's personal
 * message, are read on nisd2.eu behind the link: a mail signed by our domain
 * must not be a free channel for someone else's links and instructions.
 */
export async function supplierIncidentBroadcastEmail(opts: {
  supplierName: string | null;
  severity: string;
  publishedAt: Date;
  incidentUrl: string;
  unsubscribeUrl: string;
}): Promise<EmailContent> {
  const { severity, publishedAt, incidentUrl, unsubscribeUrl } = opts;
  const name = companyNameForMail(opts.supplierName, "A supplier");
  const severityLabel = severity.charAt(0).toUpperCase() + severity.slice(1);

  return {
    subject: `${name} reported a security incident`,
    html: await renderEmail(SupplierIncidentEmail, {
      name,
      severity,
      publishedAt: publishedAt.toLocaleString(),
      incidentUrl,
      unsubscribeUrl,
    }),
    text: [
      `${severityLabel}: ${name} reported a security incident`,
      ``,
      `Security notification (${publishedAt.toISOString()})`,
      ``,
      `${name} published an incident notice for you on nisd2.eu.`,
      `The details are on the notice page: we never copy a supplier's own text into email.`,
      ``,
      `Read the incident notice: ${incidentUrl}`,
      ``,
      `--`,
      `You received this because ${name} added your address as a recipient of their security updates on nisd2.eu.`,
      `Use as evidence for your NIS2 §30 supplier monitoring.`,
      `Unsubscribe: ${unsubscribeUrl}`,
    ].join("\n"),
  };
}

// ---------------------------------------------------------------------------
// Supplier Portal: added by supplier (you've been added as a customer)
// ---------------------------------------------------------------------------

/**
 * Direction-B invite email: sent when a NIS2 entity invites a supplier to
 * fill out their security profile via magic-link.
 */
export async function entityInvitesSupplierEmail(opts: {
  entityName: string | null;
  inviteUrl: string;
  /** Whether the invite carries a personal message; its text is read on the invite page. */
  hasMessage: boolean;
}): Promise<EmailContent> {
  const { inviteUrl, hasMessage } = opts;
  const name = companyNameForMail(opts.entityName, "A NIS2 entity");

  return {
    subject: `${name} requests your NIS2 supplier profile on NISD2`,
    html: await renderEmail(SupplierInviteEmail, { name, inviteUrl, hasMessage }),
    text: [
      `${name} would like to see your security profile`,
      ``,
      `${name} is a NIS2-regulated entity required to assess their suppliers' cybersecurity practices.`,
      ``,
      `Instead of a 200-question PDF, they are using nisd2.eu: a single unified supplier questionnaire`,
      `anchored to ENISA's NIS2 Technical Implementation Guidance and CIR 2024/2690. Fill it once,`,
      `share it with every customer who asks. Free.`,
      ``,
      hasMessage
        ? `${name} added a personal message, which you can read on the invitation page after signing in.\n`
        : "",
      `Accept and create your profile: ${inviteUrl}`,
      ``,
      `This link expires in 30 days. You do not need to be NIS2-regulated yourself to use the supplier portal.`,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

// ---------------------------------------------------------------------------
// Platform Admin: new user signup notification
// ---------------------------------------------------------------------------

/** The language the prepared follow-up is written in, named for the operator who sends it. */
const FOLLOW_UP_LANGUAGE: Record<WalkLocale, string> = {
  de: "German",
  en: "English",
  cs: "Czech",
};

export async function newUserSignupEmail(opts: {
  userEmail: string;
  userName: string;
  provider: string;
  /** The signup's own language, which the prepared follow-up is written in. */
  locale: EmailLocale;
  /** The campaign tags of the page the signup started from. */
  campaign: SignupCampaign | null;
}): Promise<EmailContent> {
  const { userEmail, userName, provider } = opts;
  const followUp = signupFollowUp({ name: userName, locale: opts.locale });
  const mailtoUrl = `mailto:${encodeURIComponent(userEmail)}?subject=${encodeURIComponent(followUp.subject)}&body=${encodeURIComponent(followUp.body)}`;
  const followUpLanguage = FOLLOW_UP_LANGUAGE[followUp.locale];
  const source = describeSignupCampaign(opts.campaign);

  return {
    subject: `New signup: ${safeHeader(userEmail)}`,
    html: await renderEmail(NewSignupEmail, {
      userEmail,
      userName,
      provider,
      at: new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" }),
      mailtoUrl,
      followUpLanguage,
      source,
    }),
    text: [
      `New signup: ${userEmail} (${userName}) via ${provider}`,
      ...(source ? [`Source: ${source}`] : []),
      "",
      `Follow up (prepared in ${followUpLanguage}): ${mailtoUrl}`,
    ].join("\n"),
  };
}

/**
 * Somebody asked to be put in touch with a firm that charges money.
 *
 * Written to be unmistakable next to `newUserSignupEmail` in a full inbox.
 * That one says "New signup"; this one shouts ANFRAGE and leads with the
 * subject of the request, because the two need completely different reactions.
 * A signup is a statistic. This is the only revenue event the company has, and
 * in referral work whoever answers first usually gets the job.
 *
 * Fired the moment the row is created, on the two or three fields we have at
 * that point. Whatever the person adds on the second screen lands in the admin
 * list rather than in a second mail, because two mails per request trains you
 * to skim both.
 */
export async function advisoryRequestEmail(opts: {
  topic: string;
  email: string;
  sourcePath: string | null;
  requirementCode: string | null;
  adminUrl: string;
}): Promise<EmailContent> {
  const { topic, email, sourcePath, requirementCode, adminUrl } = opts;
  const origin = requirementCode ?? sourcePath ?? "direkt";
  const domain = email.split("@")[1] ?? email;

  return {
    subject: `[ANFRAGE] ${safeHeader(topic)} (${safeHeader(domain)})`,
    html: await renderEmail(AdvisoryRequestEmail, {
      topic,
      email,
      origin,
      at: new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" }),
      adminUrl,
    }),
    text: `[ANFRAGE] ${topic} von ${email}\n\nHerkunft: ${origin}\nHeute antworten. Wer zuerst reagiert, bekommt die Arbeit.\n\n${adminUrl}`,
  };
}

export async function supplierAddedYouEmail(opts: {
  supplierName: string | null;
  profileUrl: string | null;
  unsubscribeUrl: string;
}): Promise<EmailContent> {
  const { profileUrl, unsubscribeUrl } = opts;
  const name = companyNameForMail(opts.supplierName, "A supplier");

  return {
    subject: `${name} will send you their security updates`,
    html: await renderEmail(SupplierAddedYouEmail, { name, profileUrl, unsubscribeUrl }),
    text: [
      `${name} added you to their NIS2 supplier security updates`,
      ``,
      `${name} added your email address to their NIS2 supplier portal on nisd2.eu.`,
      `You will receive security incident notifications and certification updates from them.`,
      ``,
      `Use as evidence for your NIS2 §30 supplier monitoring obligation.`,
      ``,
      profileUrl ? `View profile: ${profileUrl}` : "",
      ``,
      `Unsubscribe: ${unsubscribeUrl}`,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

// ---------------------------------------------------------------------------
// Course follow-up: sent by the daily course-reminder cron to users who
// started a course, haven't been back in 7+ days, and haven't been pinged
// in the last 30 days. Bundles all stalled courses for the user into one
// email. Personal voice from Simon, Mom-Test question on what got in the way.
// ---------------------------------------------------------------------------

export async function courseFollowupEmail(opts: {
  recipientName: string | null;
  courses: Array<{ title: string; resumeUrl: string }>;
  unsubscribeUrl: string;
  locale: EmailLocale;
}): Promise<EmailContent> {
  const { recipientName, courses, unsubscribeUrl } = opts;
  const locale = workflowMailLocaleOf(opts.locale);
  const copy = COURSE_FOLLOWUP_COPY[locale];
  const single = courses.length === 1;
  const greeting = copy.greeting(recipientName?.trim().split(" ")[0]);
  const subject = copy.subject(single, courses[0]?.title ?? "");

  const html = await renderEmail(CourseFollowupEmail, {
    locale,
    greeting,
    courses,
    unsubscribeUrl,
  });

  const text = [
    `${greeting},`,
    ``,
    copy.intro(single),
    ``,
    ...courses.map((c) => `- ${c.title}: ${c.resumeUrl}`),
    ``,
    copy.question(single),
    ``,
    copy.resume(single),
    ``,
    copy.thanks,
    `Simon`,
    ``,
    `${copy.unsubscribe}: ${unsubscribeUrl}`,
  ].join("\n");

  return { subject: safeHeader(subject), html, text };
}

// ---------------------------------------------------------------------------
// Email Verification Code (signup OTP)
// ---------------------------------------------------------------------------

const VERIFICATION_COPY: Record<
  Locale,
  {
    subjectPrefix: string;
    heading: string;
    intro: string;
    expiryNote: string;
    ignoreNote: string;
  }
> = {
  de: {
    subjectPrefix: "NISD2 Bestätigungscode",
    heading: "E-Mail bestätigen",
    intro:
      "Bitte gib diesen Code in der Anmeldung ein, um deine E-Mail-Adresse zu bestätigen.",
    expiryNote: "Der Code ist 10 Minuten gültig.",
    ignoreNote: "Falls du dich nicht registriert hast, ignoriere diese E-Mail.",
  },
  en: {
    subjectPrefix: "NISD2 verification code",
    heading: "Verify your email",
    intro: "Enter this code in the sign-in screen to verify your email address.",
    expiryNote: "The code is valid for 10 minutes.",
    ignoreNote: "If you did not request this, just ignore this email.",
  },
  nl: {
    subjectPrefix: "NISD2 verificatiecode",
    heading: "E-mail verifiëren",
    intro: "Voer deze code in op het aanmeldscherm om je e-mailadres te verifiëren.",
    expiryNote: "De code is 10 minuten geldig.",
    ignoreNote: "Heb je dit niet aangevraagd? Negeer deze e-mail.",
  },
  fr: {
    subjectPrefix: "Code de vérification NISD2",
    heading: "Vérifiez votre e-mail",
    intro:
      "Saisissez ce code sur l'écran de connexion pour vérifier votre adresse e-mail.",
    expiryNote: "Le code est valable 10 minutes.",
    ignoreNote: "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.",
  },
  it: {
    subjectPrefix: "Codice di verifica NISD2",
    heading: "Verifica la tua e-mail",
    intro:
      "Inserisci questo codice nella schermata di accesso per verificare il tuo indirizzo e-mail.",
    expiryNote: "Il codice è valido per 10 minuti.",
    ignoreNote: "Se non hai richiesto questa operazione, ignora questa e-mail.",
  },
  es: {
    subjectPrefix: "Código de verificación de NISD2",
    heading: "Verifica tu correo electrónico",
    intro:
      "Introduce este código en la pantalla de inicio de sesión para verificar tu dirección de correo electrónico.",
    expiryNote: "El código es válido durante 10 minutos.",
    ignoreNote: "Si no has solicitado esto, ignora este correo electrónico.",
  },
  pl: {
    subjectPrefix: "Kod weryfikacyjny NISD2",
    heading: "Zweryfikuj swój adres e-mail",
    intro: "Wprowadź ten kod na ekranie logowania, aby zweryfikować swój adres e-mail.",
    expiryNote: "Kod jest ważny przez 10 minut.",
    ignoreNote: "Jeśli to nie Ty wysłałeś tę prośbę, zignoruj tę wiadomość.",
  },
  cs: {
    subjectPrefix: "Ověřovací kód NISD2",
    heading: "Ověřte svůj e-mail",
    intro: "Zadejte tento kód na přihlašovací obrazovce a ověřte svou e-mailovou adresu.",
    expiryNote: "Kód je platný 10 minut.",
    ignoreNote: "Pokud jste o to nežádali, tento e-mail ignorujte.",
  },
  pt: {
    subjectPrefix: "Código de verificação NISD2",
    heading: "Verifique o seu e-mail",
    intro:
      "Introduza este código no ecrã de início de sessão para verificar o seu endereço de e-mail.",
    expiryNote: "O código é válido durante 10 minutos.",
    ignoreNote: "Se não solicitou isto, ignore este e-mail.",
  },
  ro: {
    subjectPrefix: "Cod de verificare NISD2",
    heading: "Verificați-vă adresa de e-mail",
    intro:
      "Introduceți acest cod în ecranul de autentificare pentru a vă verifica adresa de e-mail.",
    expiryNote: "Codul este valabil timp de 10 minute.",
    ignoreNote: "Dacă nu ați solicitat acest lucru, ignorați acest e-mail.",
  },
};

export async function emailVerificationCodeEmail(opts: {
  code: string;
  locale?: Locale;
}): Promise<EmailContent> {
  const copy = VERIFICATION_COPY[opts.locale ?? "de"];

  return {
    subject: safeHeader(`${copy.subjectPrefix}: ${opts.code}`),
    html: await renderEmail(CodeEmail, {
      locale: emailLocaleOf(opts.locale),
      heading: copy.heading,
      intro: copy.intro,
      code: opts.code,
      expiryNote: copy.expiryNote,
      ignoreNote: copy.ignoreNote,
    }),
    text: [
      copy.heading,
      ``,
      copy.intro,
      ``,
      opts.code,
      ``,
      `${copy.expiryNote} ${copy.ignoreNote}`,
    ].join("\n"),
  };
}

const PASSWORD_RESET_COPY: Record<
  Locale,
  {
    subjectPrefix: string;
    heading: string;
    intro: string;
    expiryNote: string;
    ignoreNote: string;
  }
> = {
  de: {
    subjectPrefix: "NISD2 Passwort zurücksetzen",
    heading: "Passwort zurücksetzen",
    intro:
      "Gib diesen Code zusammen mit deinem neuen Passwort ein, um dein Passwort zurückzusetzen.",
    expiryNote: "Der Code ist 10 Minuten gültig.",
    ignoreNote:
      "Falls du das nicht angefordert hast, ignoriere diese E-Mail. Dein Passwort bleibt unverändert.",
  },
  en: {
    subjectPrefix: "NISD2 password reset code",
    heading: "Reset your password",
    intro: "Enter this code together with your new password to complete the reset.",
    expiryNote: "The code is valid for 10 minutes.",
    ignoreNote:
      "If you did not request this, ignore this email. Your password is unchanged.",
  },
  nl: {
    subjectPrefix: "NISD2 wachtwoord resetcode",
    heading: "Wachtwoord opnieuw instellen",
    intro:
      "Voer deze code samen met je nieuwe wachtwoord in om het opnieuw instellen te voltooien.",
    expiryNote: "De code is 10 minuten geldig.",
    ignoreNote:
      "Heb je dit niet aangevraagd? Negeer deze e-mail. Je wachtwoord blijft ongewijzigd.",
  },
  fr: {
    subjectPrefix: "Code de réinitialisation du mot de passe NISD2",
    heading: "Réinitialisez votre mot de passe",
    intro:
      "Saisissez ce code avec votre nouveau mot de passe pour terminer la réinitialisation.",
    expiryNote: "Le code est valable 10 minutes.",
    ignoreNote:
      "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail. Votre mot de passe reste inchangé.",
  },
  it: {
    subjectPrefix: "Codice di reimpostazione della password NISD2",
    heading: "Reimposta la tua password",
    intro:
      "Inserisci questo codice insieme alla tua nuova password per completare la reimpostazione.",
    expiryNote: "Il codice è valido per 10 minuti.",
    ignoreNote:
      "Se non hai richiesto questa operazione, ignora questa e-mail. La tua password rimane invariata.",
  },
  es: {
    subjectPrefix: "Código de restablecimiento de contraseña de NISD2",
    heading: "Restablece tu contraseña",
    intro:
      "Introduce este código junto con tu nueva contraseña para completar el restablecimiento.",
    expiryNote: "El código es válido durante 10 minutos.",
    ignoreNote:
      "Si no has solicitado esto, ignora este correo electrónico. Tu contraseña no se ha modificado.",
  },
  pl: {
    subjectPrefix: "Kod resetowania hasła NISD2",
    heading: "Zresetuj swoje hasło",
    intro: "Wprowadź ten kod razem z nowym hasłem, aby zakończyć resetowanie.",
    expiryNote: "Kod jest ważny przez 10 minut.",
    ignoreNote:
      "Jeśli to nie Ty wysłałeś tę prośbę, zignoruj tę wiadomość. Twoje hasło pozostaje bez zmian.",
  },
  cs: {
    subjectPrefix: "Kód pro obnovení hesla NISD2",
    heading: "Obnovte své heslo",
    intro: "Zadejte tento kód spolu s novým heslem a dokončete obnovení.",
    expiryNote: "Kód je platný 10 minut.",
    ignoreNote:
      "Pokud jste o to nežádali, tento e-mail ignorujte. Vaše heslo zůstává beze změny.",
  },
  pt: {
    subjectPrefix: "Código de redefinição de palavra-passe NISD2",
    heading: "Redefina a sua palavra-passe",
    intro:
      "Introduza este código juntamente com a sua nova palavra-passe para concluir a redefinição.",
    expiryNote: "O código é válido durante 10 minutos.",
    ignoreNote:
      "Se não solicitou isto, ignore este e-mail. A sua palavra-passe permanece inalterada.",
  },
  ro: {
    subjectPrefix: "Cod de resetare a parolei NISD2",
    heading: "Resetați-vă parola",
    intro: "Introduceți acest cod împreună cu noua parolă pentru a finaliza resetarea.",
    expiryNote: "Codul este valabil timp de 10 minute.",
    ignoreNote:
      "Dacă nu ați solicitat acest lucru, ignorați acest e-mail. Parola dumneavoastră rămâne neschimbată.",
  },
};

// ---------------------------------------------------------------------------
// Registration attempt on an existing account
//
// /api/auth/register answers every address the same way, so a sign-up on an
// address that already has an account cannot say so on screen. The owner is
// told here instead, in the mailbox that proves they are the owner.
// ---------------------------------------------------------------------------

const REGISTRATION_ATTEMPT_COPY: Record<
  Locale,
  {
    subject: string;
    heading: string;
    intro: string;
    action: string;
    signIn: string;
    reset: string;
    ignoreNote: string;
  }
> = {
  de: {
    subject: "Registrierung mit deiner Adresse bei NISD2",
    heading: "Jemand wollte sich mit deiner Adresse registrieren",
    intro:
      "Gerade wurde bei NISD2 ein neues Konto für diese Adresse angefragt. Zu dieser Adresse gibt es bereits ein Konto, deshalb wurde nichts geändert.",
    action:
      "Warst du das? Melde dich mit deinem bestehenden Konto an. Falls du dein Passwort nicht mehr weißt, setze es zurück.",
    signIn: "Anmelden",
    reset: "Passwort zurücksetzen",
    ignoreNote:
      "Falls du das nicht warst, ignoriere diese E-Mail. Dein Konto bleibt unverändert.",
  },
  en: {
    subject: "Sign-up attempt with your NISD2 address",
    heading: "Someone tried to register with your address",
    intro:
      "A new NISD2 account was just requested for this email address. An account with this address already exists, so nothing was changed.",
    action:
      "Was this you? Sign in to your existing account. If you no longer know your password, reset it.",
    signIn: "Sign in",
    reset: "Reset password",
    ignoreNote: "If this was not you, ignore this email. Your account is unchanged.",
  },
  nl: {
    subject: "Registratiepoging met je adres bij NISD2",
    heading: "Iemand probeerde zich met je adres te registreren",
    intro:
      "Er is zojuist een nieuw NISD2-account aangevraagd voor dit e-mailadres. Er bestaat al een account met dit adres, dus er is niets gewijzigd.",
    action:
      "Was jij dit? Meld je aan met je bestaande account. Weet je je wachtwoord niet meer, stel het dan opnieuw in.",
    signIn: "Aanmelden",
    reset: "Wachtwoord opnieuw instellen",
    ignoreNote: "Was jij dit niet? Negeer deze e-mail. Je account blijft ongewijzigd.",
  },
  fr: {
    subject: "Tentative d'inscription avec votre adresse sur NISD2",
    heading: "Quelqu'un a tenté de s'inscrire avec votre adresse",
    intro:
      "Un nouveau compte NISD2 vient d'être demandé pour cette adresse e-mail. Un compte existe déjà pour cette adresse, rien n'a donc été modifié.",
    action:
      "C'était vous ? Connectez-vous à votre compte existant. Si vous ne connaissez plus votre mot de passe, réinitialisez-le.",
    signIn: "Se connecter",
    reset: "Réinitialiser le mot de passe",
    ignoreNote:
      "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail. Votre compte reste inchangé.",
  },
  it: {
    subject: "Tentativo di registrazione con il tuo indirizzo su NISD2",
    heading: "Qualcuno ha provato a registrarsi con il tuo indirizzo",
    intro:
      "È appena stato richiesto un nuovo account NISD2 per questo indirizzo e-mail. Esiste già un account con questo indirizzo, quindi non è stato modificato nulla.",
    action:
      "Sei stato tu? Accedi con il tuo account esistente. Se non ricordi più la password, reimpostala.",
    signIn: "Accedi",
    reset: "Reimposta la password",
    ignoreNote:
      "Se non sei stato tu, ignora questa e-mail. Il tuo account rimane invariato.",
  },
  es: {
    subject: "Intento de registro con tu dirección en NISD2",
    heading: "Alguien ha intentado registrarse con tu dirección",
    intro:
      "Se acaba de solicitar una nueva cuenta de NISD2 para esta dirección de correo electrónico. Ya existe una cuenta con esta dirección, así que no se ha modificado nada.",
    action:
      "¿Has sido tú? Inicia sesión con tu cuenta existente. Si ya no recuerdas tu contraseña, restablécela.",
    signIn: "Iniciar sesión",
    reset: "Restablecer la contraseña",
    ignoreNote:
      "Si no has sido tú, ignora este correo electrónico. Tu cuenta no se ha modificado.",
  },
  pl: {
    subject: "Próba rejestracji z Twoim adresem w NISD2",
    heading: "Ktoś próbował zarejestrować się z Twoim adresem",
    intro:
      "Właśnie złożono prośbę o nowe konto NISD2 dla tego adresu e-mail. Konto z tym adresem już istnieje, więc nic nie zostało zmienione.",
    action:
      "To Ty? Zaloguj się na swoje istniejące konto. Jeśli nie pamiętasz hasła, zresetuj je.",
    signIn: "Zaloguj się",
    reset: "Zresetuj hasło",
    ignoreNote:
      "Jeśli to nie Ty, zignoruj tę wiadomość. Twoje konto pozostaje bez zmian.",
  },
  cs: {
    subject: "Pokus o registraci s vaší adresou v NISD2",
    heading: "Někdo se pokusil zaregistrovat s vaší adresou",
    intro:
      "Právě byl vyžádán nový účet NISD2 pro tuto e-mailovou adresu. Účet s touto adresou již existuje, proto se nic nezměnilo.",
    action:
      "Byli jste to vy? Přihlaste se ke svému stávajícímu účtu. Pokud si heslo nepamatujete, obnovte ho.",
    signIn: "Přihlásit se",
    reset: "Obnovit heslo",
    ignoreNote:
      "Pokud jste to nebyli vy, tento e-mail ignorujte. Váš účet zůstává beze změny.",
  },
  pt: {
    subject: "Tentativa de registo com o seu endereço na NISD2",
    heading: "Alguém tentou registar-se com o seu endereço",
    intro:
      "Acabou de ser pedida uma nova conta NISD2 para este endereço de e-mail. Já existe uma conta com este endereço, por isso nada foi alterado.",
    action:
      "Se foi quem fez o pedido, inicie sessão na sua conta existente. Se já não se lembra da palavra-passe, redefina-a.",
    signIn: "Iniciar sessão",
    reset: "Redefinir a palavra-passe",
    ignoreNote:
      "Se não fez este pedido, ignore este e-mail. A sua conta permanece inalterada.",
  },
  ro: {
    subject: "Încercare de înregistrare cu adresa dumneavoastră la NISD2",
    heading: "Cineva a încercat să se înregistreze cu adresa dumneavoastră",
    intro:
      "Tocmai a fost solicitat un cont NISD2 nou pentru această adresă de e-mail. Există deja un cont cu această adresă, așa că nu s-a modificat nimic.",
    action:
      "Dumneavoastră ați fost? Autentificați-vă în contul existent. Dacă nu vă mai amintiți parola, resetați-o.",
    signIn: "Autentificare",
    reset: "Resetare parolă",
    ignoreNote:
      "Dacă nu ați fost dumneavoastră, ignorați acest e-mail. Contul dumneavoastră rămâne neschimbat.",
  },
};

export async function registrationAttemptEmail(opts: {
  signInUrl: string;
  resetUrl: string;
  locale?: Locale;
}): Promise<EmailContent> {
  const copy = REGISTRATION_ATTEMPT_COPY[opts.locale ?? "de"];

  return {
    subject: safeHeader(copy.subject),
    html: await renderEmail(RegistrationAttemptEmail, {
      locale: emailLocaleOf(opts.locale),
      heading: copy.heading,
      intro: copy.intro,
      action: copy.action,
      signIn: copy.signIn,
      reset: copy.reset,
      ignoreNote: copy.ignoreNote,
      signInUrl: opts.signInUrl,
      resetUrl: opts.resetUrl,
    }),
    text: [
      copy.heading,
      ``,
      copy.intro,
      ``,
      copy.action,
      ``,
      `${copy.signIn}: ${opts.signInUrl}`,
      `${copy.reset}: ${opts.resetUrl}`,
      ``,
      copy.ignoreNote,
    ].join("\n"),
  };
}

// ---------------------------------------------------------------------------
// Newsletter / lifecycle email
//
// Opportunistic bottom-of-funnel email sent to verified, opted-in users.
// Body is authored inline as markdown in the platform-admin composer and
// pre-rendered to HTML (renderNewsletterMarkdown) before being passed here.
// Footer carries the per-user one-click unsubscribe (HMAC-signed via
// lib/email/unsubscribe.ts) and a forward-to-a-friend mailto link.
// ---------------------------------------------------------------------------

export async function newsletterEmail(opts: {
  subject: string;
  preheader?: string | null;
  /** Body markdown already rendered to HTML by renderNewsletterMarkdown(). */
  bodyHtml: string;
  /** Raw markdown body, used to build the plain-text alternative. */
  bodyText: string;
  unsubscribeUrl: string;
  forwardUrl: string;
  /** Optional soft CTA button (one per issue). Absolute URL + label. */
  cta?: { url: string; label: string } | null;
  /** Public permalink for the "view in browser" link. */
  viewInBrowserUrl?: string | null;
}): Promise<EmailContent> {
  const { subject, bodyText, unsubscribeUrl, cta, viewInBrowserUrl } = opts;
  return {
    subject: safeHeader(subject),
    html: await renderEmail(NewsletterEmail, opts),
    text: [
      bodyText,
      ``,
      ...(cta ? [`${cta.label}: ${cta.url}`, ``] : []),
      `--`,
      `Questions or feedback? Just reply to this email, it comes straight to me.`,
      ``,
      `Found this useful? Forward it to a colleague.`,
      ``,
      `You are receiving this because you have an account at nisd2.eu.`,
      `Unsubscribe: ${unsubscribeUrl}`,
      ...(viewInBrowserUrl ? [`View in browser: ${viewInBrowserUrl}`] : []),
    ].join("\n"),
  };
}

export async function passwordResetCodeEmail(opts: {
  code: string;
  locale?: Locale;
}): Promise<EmailContent> {
  const copy = PASSWORD_RESET_COPY[opts.locale ?? "de"];

  return {
    subject: safeHeader(`${copy.subjectPrefix}: ${opts.code}`),
    html: await renderEmail(CodeEmail, {
      locale: emailLocaleOf(opts.locale),
      heading: copy.heading,
      intro: copy.intro,
      code: opts.code,
      expiryNote: copy.expiryNote,
      ignoreNote: copy.ignoreNote,
    }),
    text: [
      copy.heading,
      ``,
      copy.intro,
      ``,
      opts.code,
      ``,
      `${copy.expiryNote} ${copy.ignoreNote}`,
    ].join("\n"),
  };
}
