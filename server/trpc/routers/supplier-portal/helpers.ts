/**
 * Supplier portal helpers — pure utilities only.
 *
 * No cross-tenant operations live here. The supplier portal v2 is fully
 * bilateral: every customer sees the supplier's data via an explicit invite +
 * access token, never via auto-linking or domain matching. The one exception
 * is the instance's own operator, configured, added once and deletable
 * (lib/supplier-portal/platform-supplier.ts).
 */
import { randomBytes } from "node:crypto";

/** 64-char hex token for access / revoke links. */
export function generateOpaqueToken(): string {
  return randomBytes(32).toString("hex");
}
