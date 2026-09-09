/**
 * The transport selection rule, with no environment and no I/O, so it can be
 * tested by the unit suite (which runs without DATABASE_URL or AUTH_SECRET on
 * the environment and so cannot import anything that reaches lib/env).
 *
 * Wiring lives in ./transport.
 */

export type MailTransportName = "smtp" | "resend";

/**
 * Compose does not have a way to pass "unset". `SMTP_HOST: ${SMTP_HOST:-}`
 * puts an empty string on the container's environment, so every optional
 * variable arrives as "" rather than undefined and any check that asks
 * `=== undefined` reads a blank as a deliberate answer. Everything below
 * asks this instead.
 */
function isSet(value: string | undefined): value is string {
  return value !== undefined && value.trim() !== "";
}

/**
 * The first of two settings that actually carries a value.
 *
 * Used for the From address and the From display name, which follow the same
 * rule: MAIL_FROM_* is the name to use on a new instance, and the older
 * RESEND_FROM_* stays authoritative until the new one is filled in, so no
 * existing deployment has to change anything. Blank is not a value, because
 * compose writes an empty string for every variable the operator left out.
 */
export function preferConfigured(
  preferred: string | undefined,
  fallback: string,
): string {
  return isSet(preferred) ? preferred : fallback;
}

/**
 * The From address this project ships as a default, which belongs to the
 * hosted instance and to nobody who self-hosts.
 *
 * It was harmless while Resend was the only transport: Resend refuses to send
 * from a domain the account has not verified, so an operator who never set a
 * From address got a loud rejection. Their own SMTP relay has no such check,
 * so the same omission would put mail on the wire claiming to come from
 * nisd2.eu — a domain they do not own, with replies going somewhere they
 * cannot read, and our deliverability spent on their instance.
 */
export const PLATFORM_DEFAULT_FROM_EMAIL = "noreply@nisd2.eu";

/**
 * Whether an SMTP instance has been told who its mail comes from.
 *
 * Sending nothing and saying why beats sending mail with a From line the
 * operator did not choose, so the SMTP transport refuses on false.
 */
export function hasOwnFromAddress(fromEmail: string): boolean {
  return fromEmail.trim().toLowerCase() !== PLATFORM_DEFAULT_FROM_EMAIL;
}

/**
 * Whether to open the connection with TLS from the first byte. 465 is the
 * implicit-TLS port; 587 and 25 open in the clear and upgrade with STARTTLS.
 * SMTP_SECURE overrides that pairing, and a blank value is not an override.
 */
export function implicitTlsForPort(
  port: number,
  secureOverride: string | undefined,
): boolean {
  if (!isSet(secureOverride)) return port === 465;
  const normalised = secureOverride.trim().toLowerCase();
  return normalised === "1" || normalised === "true";
}

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
  if (isSet(config.smtpHost)) return "smtp";
  if (isSet(config.resendApiKey)) return "resend";
  return null;
}
