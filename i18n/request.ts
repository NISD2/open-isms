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
  "help",
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

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  // Newly added locales (fr/it/es/pl) do not yet have every namespace
  // translated (the wiki `info` namespace is curated separately). Fall back
  // to English per-namespace so a partial locale renders instead of 500ing.
  async function load(ns: string): Promise<Record<string, unknown>> {
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

  const modules = await Promise.all(namespaces.map((ns) => load(ns)));
  const messages = Object.assign({}, ...modules);

  return { locale, messages };
});
