import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

const namespaces = [
  "applicability",
  "assets",
  "auth",
  "audit",
  "audit-readiness",
  "changes",
  "common",
  "companyLookup",
  "compliance",
  "dashboard",
  "evidence",
  "exercises",
  "export",
  "funnel",
  "gap-assessment",
  "guide",
  "grcComparison",
  "improvements",
  "incidents",
  "info",
  "internal-audits",
  "landing",
  "kpis",
  "management-reviews",
  "methodology",
  "newsletter",
  "notifications",
  "onboarding",
  "organization",
  "patches",
  "policies",
  "policy-config",
  "pricing",
  "portal",
  "requirements",
  "review",
  "riskAssessment",
  "assetInventory",
  "risks",
  "settings",
  "sicherheitsfragebogen",
  "suppliers",
  "supplierPortal",
  "team",
  "training",
  "trainingPortal",
  "vulnerabilities",
] as const;

type Messages = Record<string, unknown>;

// Newly added locales (fr/it/es/pl) do not yet have every namespace
// translated (the wiki `info` namespace is curated separately). Fall back
// to English per-namespace so a partial locale renders instead of 500ing.
async function load(ns: string, locale: string): Promise<Messages> {
  try {
    return (await import(`../messages/${ns}/${locale}.json`)).default;
  } catch (err) {
    // Only fall back for a genuinely-absent namespace file; surface real
    // errors (e.g. malformed JSON) instead of silently serving English.
    const message = (err instanceof Error ? err.message : "").toLowerCase();
    const missing =
      message.includes("cannot find module") ||
      message.includes("module not found") ||
      message.includes("failed to resolve");
    if (!missing) throw err;
    return (await import(`../messages/${ns}/en.json`)).default;
  }
}

function isPlainObject(value: unknown): value is Messages {
  return (
    typeof value === "object" && value !== null && !Array.isArray(value)
  );
}

/**
 * Fill the holes in `primary` from `fallback`, key by key, at every depth.
 * `primary` always wins where it has a value; an array in `primary` is
 * taken whole rather than merged element-wise.
 *
 * Why this exists on top of the per-file fallback above: that one only
 * catches a namespace file that is entirely absent. A file that EXISTS
 * but is missing individual keys still throws MISSING_MESSAGE at render
 * time, which is a 500 on a real page, not a cosmetic gap. That was live:
 * `info.footer.partners` was absent in cs/es/fr/it/pl/pt/ro while
 * PublicFooter read it unconditionally, so every page in those seven
 * locales threw. An audit on 2026-09-01 found 553 such keys across the
 * message set — `info.nis2Events.*` in seven locales (a public wiki
 * page), `requirements.AI-DOC_*` in it/es, `portal.journey` in es,
 * `info.*` and `funnel.*` in nl, and the whole `newsletter` namespace
 * missing for seven locales.
 *
 * Filling from English makes a missing key degrade to English text
 * instead of an exception, and stops the next one from being an incident.
 * It does NOT make the gaps acceptable — those 553 keys are still
 * untranslated and now render English. This is the floor, not the goal.
 */
function fillMissing(fallback: unknown, primary: unknown): unknown {
  if (!isPlainObject(fallback) || !isPlainObject(primary)) {
    return primary === undefined ? fallback : primary;
  }
  const out: Messages = { ...primary };
  for (const [key, value] of Object.entries(fallback)) {
    out[key] = key in primary ? fillMissing(value, primary[key]) : value;
  }
  return out;
}

/**
 * Merged messages are identical for every request in a locale, and the
 * merge walks ~2 MB of `info` content, so it runs once per locale per
 * process. Disabled outside production so editing a message file in dev
 * still hot-reloads.
 */
const mergedCache =
  process.env.NODE_ENV === "production" ? new Map<string, Messages>() : null;

async function messagesFor(locale: string): Promise<Messages> {
  const cached = mergedCache?.get(locale);
  if (cached) return cached;

  const own = Object.assign(
    {},
    ...(await Promise.all(namespaces.map((ns) => load(ns, locale)))),
  ) as Messages;

  let messages = own;
  if (locale !== "en") {
    const english = Object.assign(
      {},
      ...(await Promise.all(namespaces.map((ns) => load(ns, "en")))),
    ) as Messages;
    messages = fillMissing(english, own) as Messages;
  }

  mergedCache?.set(locale, messages);
  return messages;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return { locale, messages: await messagesFor(locale) };
});
