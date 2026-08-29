import "@/lib/server-guard";

import { sendMail } from "./send";
import { emailVerificationCodeEmail, passwordResetCodeEmail } from "./templates";
import type { Locale } from "@/lib/seo";

/**
 * The two emails that decide whether anyone can get into an instance at all:
 * the sign-up verification code and the password-reset code.
 *
 * They are separated from every other message because of what happens when
 * there is no mail provider. `sendMail` reports success with no API key
 * configured, so the sign-up screen says the code was sent and the code goes
 * nowhere. On the hosted instance that state never occurs. On a self-hosted
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

type AuthCodeKind = "verification" | "password-reset";

interface SendAuthCodeOptions {
  to: string;
  code: string;
  locale?: Locale;
  kind: AuthCodeKind;
}

/** True when no message can physically leave the instance. */
function hasNoMailTransport(): boolean {
  return !process.env.RESEND_API_KEY;
}

export async function sendAuthCode({ to, code, locale, kind }: SendAuthCodeOptions) {
  const content =
    kind === "verification"
      ? emailVerificationCodeEmail({ code, locale })
      : passwordResetCodeEmail({ code, locale });

  const result = await sendMail({ to, ...content });

  if (hasNoMailTransport()) {
    const what = kind === "verification" ? "sign-in code" : "password reset code";
    console.warn(
      `[mail] No RESEND_API_KEY is set, so nothing was sent. ` +
        `The ${what} for ${to} is ${code}. ` +
        `Configure RESEND_API_KEY and RESEND_FROM_EMAIL to deliver these by email instead: ` +
        `https://www.nisd2.eu/docs/self-hosting/email`,
    );
  }

  return result;
}
