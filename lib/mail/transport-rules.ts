/**
 * The transport selection rule, with no environment and no I/O, so it can be
 * tested by the unit suite (which runs without DATABASE_URL or AUTH_SECRET on
 * the environment and so cannot import anything that reaches lib/env).
 *
 * Wiring lives in ./transport.
 */

export type MailTransportName = "smtp" | "resend";

export interface MailTransportConfig {
  readonly smtpHost?: string;
  readonly resendApiKey?: string;
}

/**
 * SMTP wins when both are configured. A deployment that has gone to the
 * trouble of pointing at its own relay means it, and silently preferring the
 * SaaS key left over in the environment would send mail from an address the
 * operator thought they had stopped using.
 */
export function selectTransport(config: MailTransportConfig): MailTransportName | null {
  if (config.smtpHost) return "smtp";
  if (config.resendApiKey) return "resend";
  return null;
}
