import "@/lib/server-guard";

import type { Locale } from "@/lib/seo";
import { ownershipCodeEmail } from "./ownership-templates";
import { sendMail } from "./send";
import { emailVerificationCodeEmail, passwordResetCodeEmail } from "./templates";
import { configuredTransport } from "./transport";

/**
 * The two emails that decide whether anyone can get into an instance at all,
 * the sign-up verification code and the password-reset code, and the code an
 * owner needs to hand their company over.
 *
 * They are separated from every other message because of what happens when
 * there is no mail transport, meaning neither SMTP_HOST nor RESEND_API_KEY.
 * `sendMail` reports success in that state, so the sign-up screen says the
 * code was sent and the code goes nowhere. On the hosted instance that state never occurs. On a self-hosted
 * one it is the default, and it makes a fresh install look broken while being
 * correctly installed: the operator cannot create the first account, and
 * nothing anywhere says why.
 *
 * So when there is no transport, the code goes to the container log instead,
 * prefixed so it can be found without knowing what to look for:
 *
 *   docker compose logs app | grep 'sign-in code'
 *
 * That is a deliberate trade and it is worth naming. Anyone who can read the
 * container log can take over an account. On a single-organisation self-host
 * that person already has the Docker socket, which is root on the host and a
 * shell in the database, so the log is not the weak link. It never happens on
 * an instance with a mail provider configured, and the log line says loudly
 * that configuring one is the fix.
 */

type AuthCodeKind = "verification" | "password-reset" | "ownership-transfer";

const CODE_MAIL = {
  verification: {
    content: emailVerificationCodeEmail,
    emailType: "auth.verification_code",
    what: "sign-in code",
  },
  "password-reset": {
    content: passwordResetCodeEmail,
    emailType: "auth.password_reset_code",
    what: "password reset code",
  },
  "ownership-transfer": {
    content: ownershipCodeEmail,
    emailType: "auth.ownership_transfer_code",
    what: "ownership handover code",
  },
} as const satisfies Record<AuthCodeKind, unknown>;

interface SendAuthCodeOptions {
  to: string;
  code: string;
  locale?: Locale;
  kind: AuthCodeKind;
}

/**
 * True when no message can physically leave the instance.
 *
 * Asks the transport layer rather than testing an env var, because there are
 * two transports now. Reading RESEND_API_KEY alone meant an instance sending
 * happily through SMTP still took the fallback below and wrote every one-time
 * code to the container log, while telling the operator no transport was
 * configured. Verified against a Mailpit stack: the mail arrived and the code
 * was in the log at the same time.
 */
function hasNoMailTransport(): boolean {
  return configuredTransport() === null;
}

export async function sendAuthCode({ to, code, locale, kind }: SendAuthCodeOptions) {
  const mail = CODE_MAIL[kind];
  const content = await mail.content({ code, locale });

  const result = await sendMail({ emailType: mail.emailType, to, ...content });

  if (hasNoMailTransport()) {
    const what = mail.what;
    console.warn(
      `[mail] No mail transport is configured, so nothing was sent. ` +
        `The ${what} for ${to} is ${code}. ` +
        `Set SMTP_HOST (your own relay) or RESEND_API_KEY, plus MAIL_FROM_EMAIL, ` +
        `to deliver these by email instead: ` +
        `https://www.nisd2.eu/docs/self-hosting/email`,
    );
  }

  return result;
}
