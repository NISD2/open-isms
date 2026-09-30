/**
 * Email addresses as they may appear in container logs.
 *
 * Log lines leave the database, so GDPR erasure cannot reach them: they sit in
 * `docker compose logs` and in whatever collects those for as long as the
 * collector keeps them. A log line gets the domain, which says whose customer
 * it was, and a short hash, which lets an operator who knows the address match
 * it to a line without the line naming anyone.
 */
import { createHash } from "node:crypto";

export function maskAddress(address: string): string {
  const normalized = address.trim().toLowerCase();
  const domain = normalized.slice(normalized.lastIndexOf("@") + 1);
  const digest = createHash("sha256").update(normalized).digest("hex").slice(0, 8);
  return `[${digest}]@${domain}`;
}

/**
 * Anything shaped like an address in free text: no whitespace, brackets,
 * quotes or list separators on either side of the "@", and no trailing dot,
 * so "an anna@kunde.de." at the end of a sentence keeps its full stop.
 */
const ADDRESS_IN_TEXT = /[^\s<>()[\]"',;:@]+@[^\s<>()[\]"',;:@]*[^\s<>()[\]"',;:@.]/g;

/** Mask every address in a free-text log line, such as an error message or an operator alert. */
export function maskAddressesIn(text: string): string {
  return text.replace(ADDRESS_IN_TEXT, maskAddress);
}
