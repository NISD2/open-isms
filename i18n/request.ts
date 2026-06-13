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
  "grcComparison",
  "improvements",
  "incidents",
  "info",
  "internal-audits",
  "landing",
  "kpis",
  "management-reviews",
  "methodology",
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

  const modules = await Promise.all(
    namespaces.map((ns) => import(`../messages/${ns}/${locale}.json`)),
  );

  const messages = Object.assign({}, ...modules.map((m) => m.default));

  return { locale, messages };
});
