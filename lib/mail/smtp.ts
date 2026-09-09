import "@/lib/server-guard";
import nodemailer, { type Transporter } from "nodemailer";
import { env } from "@/lib/env";
import type { OutgoingMail, TransportResult } from "./transport";
import { hasOwnFromAddress, implicitTlsForPort } from "./transport-rules";

/**
 * SMTP transport, for instances that send through their own relay instead of
 * a SaaS API. Selected by setting SMTP_HOST; see lib/mail/transport.ts.
 *
 * Lazy for the same reason the Resend client is: `next build` imports this
 * module while collecting page data, long before any runtime secret is on
 * the environment, and a connection opened at module scope would be opened
 * during the build.
 */
let _transporter: Transporter | null = null;

/** Blank is not a yes. Compose passes "" for every variable left unset. */
function isTrue(value: string | undefined): boolean {
  const normalised = value?.trim().toLowerCase();
  return normalised === "1" || normalised === "true";
}

function getTransporter(): Transporter {
  if (_transporter) return _transporter;

  const host = env.SMTP_HOST?.trim();
  if (!host) {
    throw new Error("SMTP transport selected without SMTP_HOST set");
  }

  _transporter = nodemailer.createTransport({
    host,
    port: env.SMTP_PORT,
    secure: implicitTlsForPort(env.SMTP_PORT, env.SMTP_SECURE),
    // An unauthenticated relay is a normal thing on a private network, and a
    // user with no password is how you spell it.
    auth: env.SMTP_USER?.trim()
      ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD ?? "" }
      : undefined,
    tls: isTrue(env.SMTP_ALLOW_SELF_SIGNED) ? { rejectUnauthorized: false } : undefined,
  });

  return _transporter;
}

/**
 * Deterministic Message-ID from a caller's idempotency key, so the retry of
 * an ambiguous send carries the id the first attempt did. See the note on
 * OutgoingMail.idempotencyKey for what this does and does not buy.
 */
function messageIdFor(mail: OutgoingMail): string | undefined {
  if (!mail.idempotencyKey) return undefined;
  const domain = mail.fromEmail.split("@").at(1) ?? "localhost";
  return `<${encodeURIComponent(mail.idempotencyKey)}@${domain}>`;
}

export async function sendViaSmtp(mail: OutgoingMail): Promise<TransportResult> {
  // Refused rather than sent, because the alternative is mail leaving this
  // relay with nisd2.eu in the From line. The failure is recorded and shows
  // up in the platform-admin email page naming the variable to set, which is
  // a better outcome than a message the recipient cannot reply to.
  if (!hasOwnFromAddress(mail.fromEmail)) {
    return {
      ok: false,
      error:
        "refusing to send: MAIL_FROM_EMAIL is unset or still this project's own address " +
        `(got "${mail.fromEmail}"). Set it to an address on a domain you control, or the ` +
        "message goes out claiming to be from someone else.",
    };
  }

  try {
    const info = await getTransporter().sendMail({
      from: { name: mail.fromName, address: mail.fromEmail },
      to: [...mail.to],
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      replyTo: mail.replyTo,
      headers: mail.headers,
      messageId: messageIdFor(mail),
    });

    // A relay that accepted the envelope for nobody delivered to nobody.
    // nodemailer reports that as a resolved promise with an empty accepted
    // list, which would otherwise read here as a successful send. Checked
    // for emptiness rather than truthiness on purpose: a transport that does
    // not report recipients at all has not told us it rejected them.
    if (info.accepted !== undefined && info.accepted.length === 0) {
      return {
        ok: false,
        error: `SMTP relay rejected every recipient: ${info.response ?? "no response"}`,
      };
    }

    return { ok: true, id: info.messageId };
  } catch (error) {
    return { ok: false, error };
  }
}
