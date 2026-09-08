/**
 * Lifecycle emails: scheduled, one-shot-per-user emails that bring people
 * back into the product (activation nudges, future win-back or feature
 * announcements). NOT for event-driven transactional mail (invites, review
 * decisions) and NOT for the recurring deadline digests — those have their
 * own paths.
 *
 * The contract: each email type is a self-contained module that knows how to
 * find its due recipients and render their messages. The dispatcher
 * (dispatch.ts) owns everything generic — the transport gate, the race-proof
 * claim row in the `notification` table, sending, throttling, and audit
 * logging. Adding a new lifecycle email means writing one module and adding
 * it to registry.ts; nothing else changes.
 */
import type { DbOrTx } from "@/lib/db";

/**
 * notification.entityType value for lifecycle claim rows. The partial unique
 * index uq_notification_lifecycle_once is scoped to exactly this value.
 */
export const LIFECYCLE_ENTITY_TYPE = "lifecycle_email";

export interface PreparedLifecycleEmail {
  userId: string;
  companyId: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  /**
   * Where the email sends the user. Stored on the notification row so the
   * in-app bell entry for this email deep-links to the same place.
   */
  linkUrl: string;
  /**
   * Short context stored in notification.body (e.g. the requirement code the
   * email surfaced), so the claim row explains itself in the admin view.
   */
  note: string | null;
  /**
   * Every lifecycle email is a soft-touch email and MUST be unsubscribable.
   * The dispatcher passes this to sendMail for the RFC 8058 headers; the
   * template must also render it as a visible link.
   */
  unsubscribeUrl: string;
}

export interface LifecycleEmailType {
  /**
   * Stable dedup key, stored in notification.triggerField. A user receives
   * each key AT MOST ONCE, ever — enforced by the DB unique index, not by
   * query discipline. To deliberately re-run a campaign, version the key
   * ("activation_nudge_v2"); never delete claim rows in bulk.
   */
  key: string;
  /** One line for docs and the cron response. */
  description: string;
  /**
   * Find users currently due for this email and render their messages.
   * Must apply its own eligibility rules (verified email, opt-out flag,
   * dormancy window) and should cheaply pre-filter users who already hold a
   * claim row; the dispatcher's insert is the hard guarantee either way.
   */
  prepare(db: DbOrTx): Promise<PreparedLifecycleEmail[]>;
}
