/**
 * The German copy for the opening steps, in one file.
 *
 * Not in `messages/` yet, deliberately. This wording has not been through the primary-source
 * fact-check gate or past Simon, and translating unsettled copy into ten locales is work that gets
 * thrown away. Keeping it in one typed object means the move to next-intl is mechanical.
 *
 * Two rules govern everything here. The sidebar explains and never recommends. And no threshold,
 * count or interval appears unless it can be read in the vendored statute.
 */

import type { StepId } from "./steps";

export interface Choice {
  readonly value: string;
  readonly label: string;
  /** Shown under the label. One line: this is a choice, not a paragraph. */
  readonly hint?: string;
}

export interface SidebarCopy {
  /** What this question is for, in the reader's terms. Never advice. */
  readonly explains: string;
  /** How the statute is cited on screen, for example "§ 28 BSIG". */
  readonly cite: string;
  /** Where the definition lives when it is not in the statute we vendored. */
  readonly furtherReading?: { readonly label: string; readonly href: string };
}

export interface StepCopy {
  /** The one question, as a heading. */
  readonly question: string;
  /** One line under it. Says what the answer is used for, never how to answer. */
  readonly subline: string;
  readonly sidebar: SidebarCopy | null;
  /** Overrides for the enum options the schema introspects, so the reader sees German. */
  readonly choices?: readonly Choice[];
  /** The label on the answer that records a wait rather than an answer. */
  readonly wait?: string;
}

export const STEP_COPY: Readonly<Record<StepId, StepCopy>> = {
  welcome: {
    question: "Ein Durchgang, ein Punkt nach dem anderen",
    subline:
      "Das Gesetz verlangt am Ende ein einziges Dokument: eine nachweisbare, unterschriebene und aktuelle Aufstellung Ihrer Maßnahmen. Daran arbeiten wir hier.",
    sidebar: null,
  },

  classification: {
    question: "Sind Sie eine besonders wichtige oder eine wichtige Einrichtung?",
    subline:
      "Das BSI fragt das bei der Registrierung ab. Es entscheidet, wie streng die Aufsicht ist.",
    sidebar: {
      explains:
        "Das Gesetz kennt genau zwei Kategorien. Betreiber kritischer Anlagen und die größten Unternehmen der geregelten Sektoren sind besonders wichtig, der Rest der geregelten Sektoren ist wichtig. Der Unterschied liegt vor allem in der Aufsicht: besonders wichtige Einrichtungen werden regelmäßig geprüft, wichtige erst anlassbezogen.",
      cite: "§ 28 Abs. 1 und Abs. 2 BSIG",
    },
    // The thresholds are § 28's own, and the test resolves each number in the vendored text.
    // Note that the two Absätze do not name the same Anlagen, which is easy to compress away.
    choices: [
      {
        value: "essential",
        label: "Besonders wichtige Einrichtung",
        hint: "Kritische Anlage, oder Anlage 1 und mindestens 250 Beschäftigte, oder über 50 Mio. Umsatz und über 43 Mio. Bilanzsumme.",
      },
      {
        value: "important",
        label: "Wichtige Einrichtung",
        hint: "Anlage 1 oder 2 und mindestens 50 Beschäftigte, oder Umsatz und Bilanzsumme jeweils über 10 Mio.",
      },
    ],
    wait: "Weiß ich nicht",
  },

  sectors: {
    question: "In welchen Sektoren sind Sie tätig?",
    subline: "So, wie Sie es bei der Registrierung angeben würden.",
    sidebar: {
      explains:
        "Die Sektoren und Einrichtungsarten stehen in Anlage 1 und Anlage 2 des BSIG. Die Angabe gehört in die Registrierung und bestimmt mit, welche Aufsichtsbehörde für Sie zuständig ist.",
      cite: "§ 28 BSIG, Anlagen 1 und 2",
      furtherReading: {
        label: "Anlage 1 BSIG",
        href: "https://www.gesetze-im-internet.de/bsig_2025/anlage_1.html",
      },
    },
    wait: "Muss ich nachsehen",
  },

  registration: {
    question: "Haben Sie sich beim BSI registriert?",
    subline:
      "Falls nicht: lassen Sie das hier offen. Die Registrierung dauert, und der Rest geht ohne sie weiter.",
    sidebar: {
      explains:
        "Die Registrierung läuft über ein MUK-Konto im BSI-Portal. Sie ist spätestens drei Monate nach dem Zeitpunkt fällig, ab dem Sie als Einrichtung gelten. Wer sie versäumt, gilt nicht als registriert, und das Bundesamt kann die Registrierung selbst vornehmen.",
      cite: "§ 33 Abs. 1 BSIG",
      furtherReading: {
        label: "BSI-Meldeportal",
        href: "https://www.bsi.bund.de/",
      },
    },
    // No choices here on purpose: these are three real fields, and "noch nicht registriert" is
    // the wait in the footer rather than a radio button that would then hide them.
    wait: "Läuft gerade",
  },
};

/**
 * German labels for the fields, overriding the ones `introspectSchema` derives from the key.
 *
 * Without this the screen reads "Muk Account Id" and "Bsi Registration Date", because the
 * introspector title-cases the identifier and the identifiers are English. A German screen with
 * English labels is the tell that nobody looked at it.
 */
export const FIELD_LABEL: Readonly<Record<string, string>> = {
  entityClassification: "Einstufung",
  applicableSectors: "Sektoren",
  mukAccountId: "MUK-Kontonummer",
  bsiRegistrationDate: "Datum der Registrierung",
  registrationProofUploaded: "Bestätigung des BSI",
};

export const UI = {
  back: "Zurück",
  next: "Weiter",
  stepOf: (n: number, of: number) => `Schritt ${n} von ${of}`,
  start: "Anfangen",
  item: (code: string) => `Punkt ${code}`,
  optional: "optional",
  readStatute: "Gesetzestext lesen",
  waitingNote: "Offen, Sie kommen beim nächsten Mal hierher zurück.",
  done: "Fertig für heute",
} as const;
