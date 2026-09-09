import "@/lib/server-guard";
import { env } from "@/lib/env";
import { type MailTransportName, selectTransport } from "./transport-rules";

export { type MailTransportName, selectTransport } from "./transport-rules";

/**
 * One outgoing message, in the shape both transports understand.
 *
 * The From address is carried as name and address rather than as a composed
 * `Name <addr>` string, because the two transports want it differently and
 * the one that has to re-split a composed string is the one that gets it
 * wrong on a display name containing a comma.
 */
export interface OutgoingMail {
  readonly fromName: string;
  readonly fromEmail: string;
  readonly to: readonly string[];
  readonly subject: string;
  readonly html: string;
  readonly text?: string;
  readonly replyTo?: string;
  readonly headers?: Readonly<Record<string, string>>;
  /**
   * Stable key for a message that must be delivered at most once. Resend
   * dedups on it server-side. SMTP has no such facility, so the SMTP
   * transport spends it on a deterministic Message-ID instead: receiving
   * servers that suppress duplicate ids will drop the second copy, and the
   * ones that do not will deliver twice. Callers that cannot tolerate a
   * double send must not rely on the transport for it.
   */
  readonly idempotencyKey?: string;
}

export type TransportResult =
  | { readonly ok: true; readonly id: string | undefined }
  | { readonly ok: false; readonly error: unknown };

/**
 * Which transport a send would use right now, or null when the instance has
 * no way to send mail at all.
 */
export function configuredTransport(): MailTransportName | null {
  return selectTransport({ smtpHost: env.SMTP_HOST, resendApiKey: env.RESEND_API_KEY });
}

export async function sendViaTransport(mail: OutgoingMail): Promise<TransportResult> {
  const transport = configuredTransport();
  if (transport === "smtp") {
    const { sendViaSmtp } = await import("./smtp");
    return sendViaSmtp(mail);
  }
  if (transport === "resend") {
    const { sendViaResend } = await import("./resend");
    return sendViaResend(mail);
  }
  return { ok: false, error: "no mail transport configured" };
}
