/**
 * Which platform mail reaches a person's timeline in Close, and the words of its note.
 * One closed list: a message type that is not named here is never recorded, so a new
 * mail type stays out of the CRM until someone decides sales should see it. Sign-in and
 * reset codes, digests, work notices and the operators' alerts are deliberately absent.
 *
 * Free of imports beyond a type, so the sync (./sync) can use it without the database.
 */
import type { EmailTypeId } from "@/lib/mail/email-types";

/** The words of the note, so sales reads what the person got without opening a mail. */
export const CLOSE_MAIL_NOTES = {
  "auth.welcome": "Welcome email",
  "product.course_followup": "Course follow-up email",
  "product.lifecycle_nudge": "Activation nudge email",
  "account.setup": "Account setup link email",
  "billing.invoice": "Invoice email",
  "billing.canceled": "Cancellation confirmation email",
} as const satisfies Partial<Record<EmailTypeId, string>>;

type LoggedEmailType = keyof typeof CLOSE_MAIL_NOTES;

export const isLoggedEmailType = (emailType: string): emailType is LoggedEmailType =>
  Object.hasOwn(CLOSE_MAIL_NOTES, emailType);

/** The note for a recorded type; null for one no longer on the list. */
export const closeMailNote = (emailType: string): string | null =>
  isLoggedEmailType(emailType)
    ? `Platform email sent: ${CLOSE_MAIL_NOTES[emailType]}`
    : null;
