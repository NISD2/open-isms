import complianceEn from "@/messages/compliance/en.json";
import requirementsEn from "@/messages/requirements/en.json";
import { routing } from "@/i18n/routing";

/**
 * Locale-resolved message bundles for server code that indexes messages by
 * dynamic keys (category codes, requirement codes) instead of next-intl's
 * t(). The locale file is deep-merged onto the English bundle so individual
 * untranslated keys fall back per-key instead of rendering raw key paths.
 * English is returned for unknown locales; load failures log once per
 * locale per process and serve English.
 *
 * Server-only by construction: this module statically imports the full
 * English bundles (~70KB). Do not import it from client components —
 * LOCALES and other client-safe locale utilities live in lib/locale.ts.
 */
export type ComplianceMessages = typeof complianceEn;
export type RequirementsMessages = typeof requirementsEn;

type CategoryCode = keyof ComplianceMessages["compliance"]["categories"];
type RequirementKey = keyof RequirementsMessages["requirements"];

const LOCALE_CODES = new Set<string>(routing.locales);

/** "de-DE", "DE", " de " → "de"; empty or unsupported → "en". */
function normalizeLocale(locale: string): string {
  const base = locale.trim().toLowerCase().split("-")[0] ?? "";
  return LOCALE_CODES.has(base) ? base : "en";
}

function deepMergeMessages<T>(base: T, override: Record<string, unknown>): T {
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(override)) {
    // "" is the untranslated-field sentinel in the bundles; an empty
    // override must not mask a later-filled English value.
    if (value === "") continue;
    const baseValue = out[key];
    const bothObjects =
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      baseValue !== null &&
      typeof baseValue === "object" &&
      !Array.isArray(baseValue);
    out[key] = bothObjects
      ? deepMergeMessages(
          baseValue as Record<string, unknown>,
          value as Record<string, unknown>,
        )
      : value;
  }
  return out as T;
}

function loadMerged<T>(
  ns: "compliance" | "requirements",
  locale: string,
  en: T,
): Promise<T> {
  const mod =
    ns === "compliance"
      ? import(`../messages/compliance/${locale}.json`)
      : import(`../messages/requirements/${locale}.json`);
  return mod.then(
    (m) => deepMergeMessages(en, m.default as Record<string, unknown>),
    (err) => {
      console.error(
        `[messages] failed to load ${ns}/${locale}.json, serving English:`,
        err,
      );
      return en;
    },
  );
}

const complianceCache = new Map<string, Promise<ComplianceMessages>>();
const requirementsCache = new Map<string, Promise<RequirementsMessages>>();

export function getComplianceMessages(
  locale: string,
): Promise<ComplianceMessages> {
  const loc = normalizeLocale(locale);
  if (loc === "en") return Promise.resolve(complianceEn);
  const cached = complianceCache.get(loc);
  if (cached) return cached;
  const loading = loadMerged("compliance", loc, complianceEn);
  complianceCache.set(loc, loading);
  return loading;
}

export function getRequirementsMessages(
  locale: string,
): Promise<RequirementsMessages> {
  const loc = normalizeLocale(locale);
  if (loc === "en") return Promise.resolve(requirementsEn);
  const cached = requirementsCache.get(loc);
  if (cached) return cached;
  const loading = loadMerged("requirements", loc, requirementsEn);
  requirementsCache.set(loc, loading);
  return loading;
}

export function getCategory(
  messages: ComplianceMessages,
  code: string,
): ComplianceMessages["compliance"]["categories"][CategoryCode] | undefined {
  return messages.compliance.categories[code as CategoryCode];
}

export function getCategoryName(
  messages: ComplianceMessages,
  code: string,
): string {
  return getCategory(messages, code)?.name ?? code;
}

export function getRequirementTitle(
  messages: RequirementsMessages,
  code: string,
): string {
  const key = code.replace(/\./g, "_") as RequirementKey;
  return messages.requirements[key]?.title ?? code;
}

export function getRequirementDescription(
  messages: RequirementsMessages,
  code: string,
): string | null {
  const key = code.replace(/\./g, "_") as RequirementKey;
  return messages.requirements[key]?.description ?? null;
}
