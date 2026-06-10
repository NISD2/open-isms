import "@/lib/server-guard";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { promises as dns } from "node:dns";
import { isDisposableEmail } from "@/lib/auth/disposable";

/**
 * Multi-layer sign-up quality gate.
 *
 * Layer 0 — string match against the vendored disposable-domain list
 *           (lib/auth/disposable.ts, ~100k entries from public CC0 list).
 * Layer 1 — MX-record check. Disposable services rotate front-domains
 *           (e.g. orders.nov17.net) but typically share a small set of
 *           MX backends. Resolving MX and matching against
 *           lib/auth/disposable-mx-hosts.txt catches the rotation.
 * Layer 2 — domain-age check via RDAP. Domains registered <30 days
 *           ago are almost always either typo-spam or freshly-spun
 *           disposable front-domains. RDAP is a free public protocol,
 *           no API key required.
 *
 * All three are silent rejections — the user record gets created with
 * isDisposableEmail=true so the attempt shows in admin, but no OTP is
 * issued and Google sign-in is refused. Mirrors the existing
 * disposable-domain handling in app/api/auth/register/route.ts and
 * lib/auth/config.ts.
 */

const MX_HOSTS = new Set(
  readFileSync(
    join(process.cwd(), "lib/auth/disposable-mx-hosts.txt"),
    "utf8",
  )
    .split("\n")
    .map((d) => d.trim().toLowerCase())
    .filter((d) => d && !d.startsWith("#")),
);

const MIN_DOMAIN_AGE_DAYS = 30;
const RDAP_TIMEOUT_MS = 2000;
const MX_TIMEOUT_MS = 1500;

// Simple syntactic check: a valid registrable hostname uses ASCII
// letters, digits, hyphen and dot. Anything else (whitespace, slashes,
// query strings, IDN) is rejected outright so the RDAP URL is built
// from a sanitised value.
const DOMAIN_SYNTAX = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/;

// 6-hour TTL cache, FIFO-bounded at CACHE_MAX entries. Sign-up is rare
// per-domain so the bound rarely bites; it exists to prevent a slow
// memory leak in long-running processes from an attacker feeding many
// unique domains.
const cache = new Map<string, { result: EmailQualityResult; expiresAt: number }>();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const CACHE_MAX = 10_000;

export type EmailQualityReason =
  | "disposable-domain"
  | "disposable-mx"
  | "domain-too-new";

export interface EmailQualityResult {
  block: boolean;
  reason?: EmailQualityReason;
}

/**
 * Whether the MX hostname or its immediate parent is on the disposable
 * block list. "mx.1secmail.com" matches both "mx.1secmail.com" and
 * "1secmail.com" entries — but we stop at one level up so eTLDs like
 * "co.uk" cannot accidentally block every business on that suffix.
 */
function mxHostMatches(host: string): boolean {
  const lc = host.toLowerCase().replace(/\.$/, "");
  if (MX_HOSTS.has(lc)) return true;
  const firstDot = lc.indexOf(".");
  if (firstDot > 0 && firstDot < lc.length - 1) {
    const parent = lc.slice(firstDot + 1);
    if (MX_HOSTS.has(parent)) return true;
  }
  return false;
}

/**
 * Three-way MX outcome:
 *   - "match"   : an MX record matched the disposable list → block
 *   - "clean"   : MX records exist, none matched → allow
 *   - "unknown" : DNS lookup failed, timed out, or returned no MX → fail open
 *
 * Distinguishing unknown from clean matters: a transient resolver
 * outage must NOT block legitimate users. Real email verification
 * (the OTP send) catches addresses that simply have no MX anyway.
 */
async function checkMx(domain: string): Promise<"match" | "clean" | "unknown"> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve("unknown"), MX_TIMEOUT_MS);
    dns
      .resolveMx(domain)
      .then((records) => {
        clearTimeout(timer);
        if (!records || records.length === 0) {
          resolve("unknown");
          return;
        }
        resolve(records.some((r) => mxHostMatches(r.exchange)) ? "match" : "clean");
      })
      .catch(() => {
        clearTimeout(timer);
        resolve("unknown");
      });
  });
}

/**
 * Returns true if the domain was registered fewer than `MIN_DOMAIN_AGE_DAYS`
 * days ago. Safe-fails to `false` on RDAP unavailability so a transient
 * registry outage never locks legitimate users out.
 */
async function isDomainTooNew(domain: string): Promise<boolean> {
  // Domain has already passed DOMAIN_SYNTAX in the caller, so it is
  // safe to interpolate into the URL path. encodeURIComponent is
  // belt-and-braces.
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), RDAP_TIMEOUT_MS);
  try {
    const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
      signal: controller.signal,
      headers: { Accept: "application/rdap+json" },
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { events?: Array<{ eventAction?: string; eventDate?: string }> };
    const reg = data.events?.find((e) => e.eventAction === "registration");
    if (!reg?.eventDate) return false;
    const ageMs = Date.now() - new Date(reg.eventDate).getTime();
    return ageMs < MIN_DOMAIN_AGE_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

export async function checkEmailQuality(email: string): Promise<EmailQualityResult> {
  if (isDisposableEmail(email)) {
    return { block: true, reason: "disposable-domain" };
  }

  const domain = email.split("@")[1]?.toLowerCase();
  // Bail on missing or syntactically-invalid domains. We do not block
  // (the register/oauth handler is responsible for the format check
  // earlier in the pipeline); we just skip the network-touching layers
  // so we never feed garbage into DNS or RDAP.
  if (!domain || !DOMAIN_SYNTAX.test(domain)) return { block: false };

  const cached = cache.get(domain);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.result;
  }

  // Run MX + RDAP in parallel; first decisive block wins, otherwise allow.
  const [mxOutcome, tooNew] = await Promise.all([
    checkMx(domain),
    isDomainTooNew(domain),
  ]);

  let result: EmailQualityResult;
  if (mxOutcome === "match") result = { block: true, reason: "disposable-mx" };
  else if (tooNew) result = { block: true, reason: "domain-too-new" };
  else result = { block: false };

  // FIFO-bounded cache: drop the oldest entry once we hit the cap so
  // an attacker feeding many unique domains can't grow the map without
  // limit. Map preserves insertion order, so iterator.next() is the
  // oldest entry.
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(domain, { result, expiresAt: Date.now() + CACHE_TTL_MS });
  return result;
}
