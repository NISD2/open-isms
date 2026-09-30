/**
 * BSI-Standard 200-3 v1.0 (2017), the risk analysis the BSI recommends, as data: four frequency
 * bands (Tabelle 8), four damage levels (Tabelle 9), four risk categories (Tabelle 10) and the
 * matrix that assigns a category to each pair (Abbildung 3).
 *
 * The one copy in code. The seeded methodology rows, the Durchgang's matrix screen and its worked
 * example read from here. The requirement page's 2.1 guidance (data/guidance) shortens the same
 * scales in JSON, which cannot import this file; a test keeps its labels in step.
 *
 * Both languages are the BSI's own words: the German standard (pages 26 to 28) and the BSI's
 * English edition, Version 1.0, October 2017 (pages 21 to 23). Its figure uses shorter labels
 * than its tables ("often", "life-threatening"); the tables are the definitions, so they win.
 *
 * The category comes from the matrix, never from multiplying the two values: the standard
 * assigns it cell by cell, and no product threshold reproduces that assignment (a considerable
 * damage that is rare scores 3 and is "mittel", a negligible one that is frequent also scores 3
 * and is "gering").
 */

export const FREQUENCIES = ["rare", "medium", "frequent", "very_frequent"] as const;
export type Frequency = (typeof FREQUENCIES)[number];

export const IMPACTS = ["negligible", "limited", "considerable", "existential"] as const;
export type Impact = (typeof IMPACTS)[number];

export const RISK_LEVELS = ["low", "medium", "high", "very_high"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

/** Abbildung 3: one row per damage level, one column per frequency band. */
const MATRIX: Readonly<Record<Impact, Readonly<Record<Frequency, RiskLevel>>>> = {
  negligible: { rare: "low", medium: "low", frequent: "low", very_frequent: "low" },
  limited: { rare: "low", medium: "low", frequent: "medium", very_frequent: "high" },
  considerable: {
    rare: "medium",
    medium: "medium",
    frequent: "high",
    very_frequent: "very_high",
  },
  existential: {
    rare: "medium",
    medium: "high",
    frequent: "very_high",
    very_frequent: "very_high",
  },
};

export const riskLevel = (frequency: Frequency, impact: Impact): RiskLevel =>
  MATRIX[impact][frequency];

export type Bsi2003Locale = "de" | "en";

export interface ScaleText {
  readonly label: string;
  readonly description: string;
}

type Texts<K extends string> = Readonly<
  Record<Bsi2003Locale, Readonly<Record<K, ScaleText>>>
>;

/** Tabelle 8, Eintrittshäufigkeit. */
export const FREQUENCY_TEXT: Texts<Frequency> = {
  de: {
    rare: {
      label: "Selten",
      description:
        "Ereignis könnte nach heutigem Kenntnisstand höchstens alle fünf Jahre eintreten.",
    },
    medium: {
      label: "Mittel",
      description: "Ereignis tritt einmal alle fünf Jahre bis einmal im Jahr ein.",
    },
    frequent: {
      label: "Häufig",
      description: "Ereignis tritt einmal im Jahr bis einmal pro Monat ein.",
    },
    very_frequent: {
      label: "Sehr häufig",
      description: "Ereignis tritt mehrmals im Monat ein.",
    },
  },
  en: {
    rare: {
      label: "Rarely",
      description:
        "According to present knowledge, the event could occur every 5 years at the most.",
    },
    medium: {
      label: "Medium",
      description: "The event occurs once every 5 years to once a year.",
    },
    frequent: {
      label: "Frequently",
      description: "The event occurs once a year to once a month.",
    },
    very_frequent: {
      label: "Very frequently",
      description: "The event occurs several times a month.",
    },
  },
};

/** Tabelle 9, Schadensauswirkungen. */
export const IMPACT_TEXT: Texts<Impact> = {
  de: {
    negligible: {
      label: "Vernachlässigbar",
      description:
        "Die Schadensauswirkungen sind gering und können vernachlässigt werden.",
    },
    limited: {
      label: "Begrenzt",
      description: "Die Schadensauswirkungen sind begrenzt und überschaubar.",
    },
    considerable: {
      label: "Beträchtlich",
      description: "Die Schadensauswirkungen können beträchtlich sein.",
    },
    existential: {
      label: "Existenzbedrohend",
      description:
        "Die Schadensauswirkungen können ein existenziell bedrohliches, katastrophales Ausmaß erreichen.",
    },
  },
  en: {
    negligible: {
      label: "Negligible",
      description: "The effects of damage are low and can be neglected.",
    },
    limited: {
      label: "Limited",
      description: "The effects of the damage are limited and manageable.",
    },
    considerable: {
      label: "Considerable",
      description: "The effects of damage can be considerable.",
    },
    existential: {
      label: "Threatening the existence of the organisation",
      description:
        "The effects of the damage can reach a catastrophic level that threatens the existence of the organisation.",
    },
  },
};

/** Tabelle 10, Risikokategorien. */
export const RISK_LEVEL_TEXT: Texts<RiskLevel> = {
  de: {
    low: {
      label: "Gering",
      description:
        "Die bereits umgesetzten oder zumindest im Sicherheitskonzept vorgesehenen Sicherheitsmaßnahmen bieten einen ausreichenden Schutz. In der Praxis ist es üblich, geringe Risiken zu akzeptieren und die Gefährdung dennoch zu beobachten.",
    },
    medium: {
      label: "Mittel",
      description:
        "Die bereits umgesetzten oder zumindest im Sicherheitskonzept vorgesehenen Sicherheitsmaßnahmen reichen möglicherweise nicht aus.",
    },
    high: {
      label: "Hoch",
      description:
        "Die bereits umgesetzten oder zumindest im Sicherheitskonzept vorgesehenen Sicherheitsmaßnahmen bieten keinen ausreichenden Schutz vor der jeweiligen Gefährdung.",
    },
    very_high: {
      label: "Sehr hoch",
      description:
        "Die bereits umgesetzten oder zumindest im Sicherheitskonzept vorgesehenen Sicherheitsmaßnahmen bieten keinen ausreichenden Schutz vor der jeweiligen Gefährdung. In der Praxis werden sehr hohe Risiken selten akzeptiert.",
    },
  },
  en: {
    low: {
      label: "Low",
      description:
        "The security safeguards already implemented or at least envisaged in the security concept provide adequate protection. In practice, it is common to accept low risks and to still monitor the threat.",
    },
    medium: {
      label: "Medium",
      description:
        "The security safeguards already implemented or at least envisaged in the security concept might not be sufficient.",
    },
    high: {
      label: "High",
      description:
        "The security safeguards already implemented or at least envisaged in the security concept do not provide adequate protection against the respective threat.",
    },
    very_high: {
      label: "Very high",
      description:
        "The security safeguards already implemented or at least envisaged in the security concept do not provide adequate protection against the respective threat. In practice, very high risks are rarely accepted.",
    },
  },
};
