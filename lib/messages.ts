import complianceEn from "@/messages/compliance/en.json";
import requirementsEn from "@/messages/requirements/en.json";
import { LOCALES } from "@/lib/locale";

/**
 * Locale-resolved message bundles for server code that indexes messages by
 * dynamic keys (category codes, requirement codes) instead of next-intl's
 * t(). The locale file is deep-merged onto the English bundle so individual
 * untranslated keys fall back per-key instead of rendering raw key paths.
 * English is returned for unknown locales and on load failure.
 *
 * Server-only by construction: this module statically imports the full
 * English bundles (~70KB). Do not import it from client components —
 * LOCALES and other client-safe locale utilities live in lib/locale.ts.
 */
export type ComplianceMessages = typeof complianceEn;
export type RequirementsMessages = typeof requirementsEn;

const LOCALE_CODES = new Set<string>(LOCALES.map((l) => l.code));

function deepMergeMessages<T>(base: T, override: Record<string, unknown>): T {
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(override)) {
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

export async function getComplianceMessages(
  locale: string,
): Promise<ComplianceMessages> {
  if (locale === "en" || !LOCALE_CODES.has(locale)) return complianceEn;
  try {
    const override = (await import(`../messages/compliance/${locale}.json`))
      .default as Record<string, unknown>;
    return deepMergeMessages(complianceEn, override);
  } catch {
    return complianceEn;
  }
}

export async function getRequirementsMessages(
  locale: string,
): Promise<RequirementsMessages> {
  if (locale === "en" || !LOCALE_CODES.has(locale)) return requirementsEn;
  try {
    const override = (await import(`../messages/requirements/${locale}.json`))
      .default as Record<string, unknown>;
    return deepMergeMessages(requirementsEn, override);
  } catch {
    return requirementsEn;
  }
}
