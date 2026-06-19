/**
 * Locale expansion plan — single source of truth for which target locales
 * the translation pipeline produces, and from which source.
 *
 * IMPORTANT: listing a locale here does NOT serve it to users. Activating a
 * locale in the live app is a separate, deliberate step — add it to
 * i18n/routing.ts `locales` and i18n/request.ts ONLY after its messages are
 * translated and reviewed. Half-translated locales must never reach prod.
 *
 * Decision (2026-06-19): Wave 1 = fr, it, es, pl. Filters were
 * English-sufficiency + market size, not "is NIS2 transposed yet" (by
 * mid-2026 nearly every member state has transposed). Nordics are served in
 * English. See NIS2/2026-06-19-i18n-language-expansion-assessment.md.
 */

export const SOURCE_LOCALE = "en";

export interface TargetLocale {
  code: string;
  /** English name, for logs. */
  label: string;
  /** Native name, given to the model so it writes in-register. */
  endonym: string;
  wave: 1 | 2;
  /**
   * Primary national transposition reference. Given to the model so legal
   * phrasing anchors to the right regime, and so it does NOT silently swap
   * German BSIG examples for this country's law (that localisation is the
   * wiki's job, handled separately — see assessment §6).
   */
  nationalContext: string;
}

export const TARGET_LOCALES: TargetLocale[] = [
  {
    code: "fr",
    label: "French",
    endonym: "français",
    wave: 1,
    nationalContext:
      "France transposed NIS2 via Ordonnance n° 2024-1093 (Dec 2024); competent authority is ANSSI. Also serves Wallonia (Belgium) and Luxembourg.",
  },
  {
    code: "it",
    label: "Italian",
    endonym: "italiano",
    wave: 1,
    nationalContext:
      "Italy transposed NIS2 via Decreto Legislativo 138/2024 (in force Oct 2024); competent authority is ACN (Agenzia per la Cybersicurezza Nazionale).",
  },
  {
    code: "es",
    label: "Spanish",
    endonym: "español",
    wave: 1,
    nationalContext:
      "Spain's transposition (Anteproyecto de Ley de Coordinación y Gobernanza de la Ciberseguridad) was still in procedure in mid-2026; authorities are INCIBE and CCN.",
  },
  {
    code: "pl",
    label: "Polish",
    endonym: "polski",
    wave: 1,
    nationalContext:
      "Poland transposed NIS2 via the amendment to the ustawa o krajowym systemie cyberbezpieczeństwa (KSC), published 2026.",
  },
  {
    code: "cs",
    label: "Czech",
    endonym: "čeština",
    wave: 2,
    nationalContext:
      "Czechia transposed NIS2 via Act No. 264/2025 Sb. on Cybersecurity (in force Nov 2025); competent authority is NÚKIB.",
  },
  {
    code: "pt",
    label: "Portuguese",
    endonym: "português",
    wave: 2,
    nationalContext:
      "Portugal transposed NIS2 via Decreto-Lei n.º 125/2025; competent authority is CNCS.",
  },
  {
    code: "ro",
    label: "Romanian",
    endonym: "română",
    wave: 2,
    nationalContext:
      "Romania transposed NIS2 via Law 58/2024; competent authority is DNSC.",
  },
];

/**
 * Translation model. A reasoning model is chosen deliberately: legal nuance
 * and the stricter-version policy (see glossary.ts) benefit from reasoning.
 * Override with I18N_TRANSLATE_MODEL.
 */
export const TRANSLATION_MODEL =
  process.env.I18N_TRANSLATE_MODEL ?? "grok-4-1-fast-reasoning";

/**
 * The wiki namespace (~247k words/locale) is German-market-specific
 * (BSIG/Grundschutz) and must be localised as a curated EU-core subset, not
 * machine-translated 1:1. The pipeline refuses it unless --include-wiki is
 * passed explicitly. See assessment §6.
 */
export const WIKI_NAMESPACE = "info";

export function getTargetLocale(code: string): TargetLocale | undefined {
  return TARGET_LOCALES.find((l) => l.code === code);
}

export function localesForWave(wave: 1 | 2): TargetLocale[] {
  return TARGET_LOCALES.filter((l) => l.wave === wave);
}
