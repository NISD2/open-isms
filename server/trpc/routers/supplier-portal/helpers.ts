/**
 * Supplier portal helpers — pure utilities only.
 *
 * No cross-tenant operations live here. The supplier portal v2 is fully
 * bilateral: every customer sees the supplier's data via an explicit invite +
 * access token, never via auto-linking or domain matching.
 */
import { randomBytes } from "node:crypto";

/** 64-char hex token for access / revoke links. */
export function generateOpaqueToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Normalize a domain string to lowercase FQDN, stripping protocol and path.
 *   "https://Foo.Example.de/contact" → "foo.example.de"
 *   "user@example.de"                → "example.de"
 *   "  example.de  "                 → "example.de"
 */
export function normalizeDomain(input: string | null | undefined): string | null {
  if (!input) return null;
  let s = input.trim().toLowerCase();
  if (s.includes("@")) s = s.split("@")[1] ?? "";
  s = s.replace(/^https?:\/\//, "");
  s = s.split("/")[0] ?? "";
  s = s.split("?")[0] ?? "";
  s = s.replace(/^www\./, "");
  if (!s.includes(".")) return null;
  return s;
}
