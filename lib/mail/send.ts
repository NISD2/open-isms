import "@/lib/server-guard";
import * as React from "react";
import { render } from "@react-email/render";
import { resend, FROM_EMAIL } from "./resend";
import { env } from "@/lib/env";
import { WelcomeEmail } from "./templates/WelcomeEmail";
import { getAppUrl } from "@/lib/utils";

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  /**
   * Override the From address (email only; the "NIS2 Compliance" display name
   * is kept). Defaults to RESEND_FROM_EMAIL. Used by the newsletter to send
   * from a distinct mailbox while transactional email stays on the default.
   */
  fromEmail?: string;
  /**
   * If set, adds RFC 8058 one-click List-Unsubscribe headers. The URL is sent
   * via both `List-Unsubscribe` and `List-Unsubscribe-Post`, letting Gmail /
   * Apple Mail render a native "Unsubscribe" link in the message header.
   */
  unsubscribeUrl?: string;
  /**
   * Resend Idempotency-Key. The retry loop below re-POSTs on ambiguous
   * network failures, so a request that Resend accepted but whose response
   * was lost would otherwise be delivered AGAIN on the retry. Callers with
   * exactly-once semantics (lifecycle claims) pass a stable per-message key
   * so Resend dedups the retries server-side.
   */
  idempotencyKey?: string;
}

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type MailSuppressionReason = "dev-blocked" | "disabled" | "no-api-key";

/**
 * Why sendMail would suppress a send right now, or null when a real send
 * would go out. sendMail derives its short-circuits from this; callers that
 * persist per-send state (lib/lifecycle claims a one-shot dedup row BEFORE
 * sending) must consult it first, because sendMail reports suppressed sends
 * as `{ success: true }` and would otherwise burn the one shot on an email
 * that never left the box.
 */
export function mailSuppressionReason(): MailSuppressionReason | null {
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.ENABLE_EMAIL_IN_DEV !== "true"
  ) {
    return "dev-blocked";
  }
  // "0"/"false" mean OFF: a self-hoster flipping DISABLE_EMAIL=1 to =0 to
  // re-enable email must not end up with mail silently suppressed forever
  // (the docs only ever show =1, so =0 reads as the obvious inverse).
  const disableEmail = process.env.DISABLE_EMAIL ?? env.DISABLE_EMAIL;
  if (disableEmail && disableEmail !== "0" && disableEmail.toLowerCase() !== "false") {
    return "disabled";
  }
  if (!env.RESEND_API_KEY) return "no-api-key";
  return null;
}

/**
 * The sentinel ids sendMail (and the dev-stub Resend client) return instead
 * of a Resend message id when a send was suppressed. `success: true` with one
 * of these ids means "not an error" — it never means "delivered".
 */
const SUPPRESSED_SEND_IDS: ReadonlySet<string> = new Set([
  "dev-blocked",
  "disabled",
  "no-api-key",
  "dev-stub",
]);

export function isSuppressedSendId(id: string | undefined): boolean {
  return id !== undefined && SUPPRESSED_SEND_IDS.has(id);
}

/**
 * Send a transactional email via Resend.
 * Retries up to MAX_RETRIES times with linear backoff on failure.
 *
 * Local-dev hard block: when NODE_ENV !== "production", emails are
 * suppressed by default. This is defense-in-depth — RESEND_API_KEY is
 * typically present in .env for production-parity testing, so without
 * this guard a stray sendMail() call would ship to real recipients.
 * To exercise the email path in dev: set ENABLE_EMAIL_IN_DEV=true.
 */
export async function sendMail(opts: SendMailOptions) {
  const suppression = mailSuppressionReason();
  if (suppression === "dev-blocked") {
    const to = Array.isArray(opts.to) ? opts.to.join(", ") : opts.to;
    console.log(
      `[mail] dev-blocked (NODE_ENV=${process.env.NODE_ENV ?? "unknown"}) — would send to=${to} subject="${opts.subject}"`,
    );
    return { success: true, id: "dev-blocked" } as const;
  }

  if (suppression === "disabled") {
    return { success: true, id: "disabled" } as const;
  }

  if (suppression === "no-api-key") {
    console.warn("[mail] RESEND_API_KEY not set, skipping email");
    return { success: true, id: "no-api-key" } as const;
  }

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const headers = opts.unsubscribeUrl
        ? {
            "List-Unsubscribe": `<${opts.unsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          }
        : undefined;

      const { data, error } = await resend.emails.send(
        {
          from: `NIS2 Compliance <${opts.fromEmail ?? FROM_EMAIL}>`,
          to: Array.isArray(opts.to) ? opts.to : [opts.to],
          subject: opts.subject,
          html: opts.html,
          text: opts.text,
          replyTo: opts.replyTo,
          headers,
        },
        opts.idempotencyKey ? { idempotencyKey: opts.idempotencyKey } : undefined,
      );

      if (error) {
        console.error(`[mail] Attempt ${attempt + 1}/${MAX_RETRIES + 1} failed:`, error);
        if (attempt < MAX_RETRIES) {
          await wait(RETRY_DELAY_MS * (attempt + 1));
          continue;
        }
        return { success: false, error } as const;
      }

      return { success: true, id: data?.id } as const;
    } catch (err) {
      console.error(`[mail] Attempt ${attempt + 1}/${MAX_RETRIES + 1} threw:`, err);
      if (attempt < MAX_RETRIES) {
        await wait(RETRY_DELAY_MS * (attempt + 1));
        continue;
      }
      return { success: false, error: err } as const;
    }
  }

  return { success: false, error: "Exhausted retries" } as const;
}

// ---------------------------------------------------------------------------
// Welcome email
// ---------------------------------------------------------------------------

export async function sendWelcomeEmail(opts: { name: string; email: string }) {
  const dashboardUrl = `${getAppUrl()}/dashboard`;
  const html = await render(
    React.createElement(WelcomeEmail, { name: opts.name, dashboardUrl }),
  );
  return sendMail({
    to: opts.email,
    subject: "Welcome to NISD2",
    html,
  });
}
