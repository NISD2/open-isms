/**
 * Which Resend emails reach a person's timeline in Close.
 *
 * Resend's list says who sent a mail, to whom and under what subject, not which of our
 * message types it was. So the rule is a closed one on the sender and the subject, and
 * anything not named here stays out of the CRM, new mail types included:
 *
 * - the newsletter mailbox (RESEND_FROM_EMAIL_NEWS): every issue. The subject is an
 *   editorial line, written by us for all recipients.
 * - the transactional address: only the exact subjects below, the welcome, signup
 *   follow-up and activation nudge lines. Sign-in codes, invitations (their subjects
 *   name other people), operator alerts, digests and invoices are not on the list.
 *
 * Free of the database and the environment, so it is tested on its own.
 */
import type { ResendMail } from "./resend-history";

export type MailSources = {
  /** The newsletter mailbox; unset when this instance sends no newsletter. */
  readonly newsletterFrom: string | undefined;
  /** The address every other mail is sent from. */
  readonly transactionalFrom: string;
};

/** Exact subjects, never patterns: a pattern is how a name or a code gets into the CRM. */
const TRANSACTIONAL_SUBJECTS: ReadonlySet<string> = new Set([
  // Welcome (lib/mail/emails/welcome.tsx) and the older "account is ready" line.
  "Welcome to NISD2",
  "Vítejte v NISD2",
  "Your NISD2 account is ready",
  // Signup follow-up (lib/mail/signup-followup.ts).
  "Ihre Anmeldung bei nisd2.eu",
  "Your signup at nisd2.eu",
  "Vaše registrace na nisd2.eu",
  // Activation nudge (lib/lifecycle/emails/activation-nudge-copy.ts).
  "Ihr erster Schritt",
  "Ihr nächster Schritt",
  "Your first step",
  "Your next step",
  "Váš první krok",
  "Váš další krok",
]);

/** The bare, lowercased address in "Name <address>". */
export const addressOf = (from: string): string => {
  const open = from.lastIndexOf("<");
  const close = from.indexOf(">", open);
  return (open >= 0 && close > open ? from.slice(open + 1, close) : from)
    .trim()
    .toLowerCase();
};

const isListed = (mail: ResendMail, sources: MailSources): boolean => {
  // Test sends of an issue go to the operator, not to the list.
  if (mail.subject.startsWith("[Test]")) return false;
  const sender = addressOf(mail.from);
  if (sources.newsletterFrom && sender === addressOf(sources.newsletterFrom)) {
    return true;
  }
  return (
    sender === addressOf(sources.transactionalFrom) &&
    TRANSACTIONAL_SUBJECTS.has(mail.subject)
  );
};

/** A complaint is the person marking a mail they received as spam. */
const REACHED: ReadonlySet<string> = new Set([
  "delivered",
  "opened",
  "clicked",
  "complained",
]);
/** How long a mail may still be on its way before it counts as never delivered. */
const IN_FLIGHT_MS = 60 * 60_000;

export type MailVerdict =
  | { readonly kind: "log" }
  | {
      readonly kind: "skip";
      readonly outcome: "skipped_not_listed" | "skipped_not_delivered";
    }
  /** Listed but not yet delivered: look again on the next run. */
  | { readonly kind: "wait" };

export const classifyMail = (
  mail: ResendMail,
  sources: MailSources,
  now: Date = new Date(),
): MailVerdict => {
  if (!isListed(mail, sources)) return { kind: "skip", outcome: "skipped_not_listed" };
  if (mail.lastEvent && REACHED.has(mail.lastEvent)) return { kind: "log" };
  const onItsWay =
    !mail.lastEvent || ["sent", "scheduled", "delivery_delayed"].includes(mail.lastEvent);
  return onItsWay && now.getTime() - mail.sentAt.getTime() < IN_FLIGHT_MS
    ? { kind: "wait" }
    : { kind: "skip", outcome: "skipped_not_delivered" };
};
