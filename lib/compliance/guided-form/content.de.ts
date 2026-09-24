/**
 * The German copy for the opening steps, in one file.
 *
 * Not in `messages/` yet, deliberately. This wording has not been through the primary-source
 * fact-check gate or past Simon, and translating unsettled copy into ten locales is work that gets
 * thrown away. Keeping it in one typed object means the move to next-intl is mechanical: the keys
 * are already the shape a message file wants, and no component changes.
 *
 * Two rules govern everything here. The sidebar explains and never recommends, because the moment
 * it recommends we are selling an opinion. And no threshold, count or interval appears unless it
 * can be read in the vendored statute, which is why the critical-installation screen names the
 * regulation instead of a number.
 */

import type { Addressee } from "./policy";
import type { StepId } from "./steps";
import { SECTORS_35_2 } from "./steps";

export interface Choice {
  readonly value: string;
  readonly label: string;
  /** Shown under the label. Kept to one line: this is a choice, not a paragraph. */
  readonly hint?: string;
}

export interface SidebarCopy {
  /** What this question is for, in the reader's terms. Never advice. */
  readonly explains: string;
  /** How the statute is cited on screen, for example "§ 35 Abs. 2 BSIG". */
  readonly cite: string;
  /** The paragraph key in the vendored file, so the verbatim text can be shown on demand. */
  readonly norm: string;
  /** Where the definition lives when it is not in the statute we vendored. */
  readonly furtherReading?: { readonly label: string; readonly href: string };
}

export interface StepCopy {
  /** The one question, as a heading. */
  readonly question: string;
  /** One line under it. Says what the answer is used for, never how to answer. */
  readonly subline: string;
  readonly sidebar: SidebarCopy | null;
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

  sector: {
    question: "Gehört Ihr Unternehmen zu einem dieser Sektoren?",
    subline: "Die Antwort entscheidet über einen Punkt der Liste, sonst nichts.",
    sidebar: {
      explains:
        "Für fünf Sektoren gilt eine zusätzliche Pflicht: Sie unterrichten betroffene Kunden und das BSI über erhebliche Cyberbedrohungen. Gehört Ihr Sektor nicht dazu, entfällt dieser Punkt vollständig.",
      cite: "§ 35 Abs. 2 BSIG",
      norm: "§ 35",
    },
    choices: [
      ...SECTORS_35_2.map((s) => ({ value: s, label: s })),
      {
        value: "none",
        label: "Keiner davon",
        hint: "Das ist eine Antwort, kein Überspringen.",
      },
    ],
    wait: "Muss ich intern klären",
  },

  service_types: {
    question: "Erbringen Sie einen dieser Dienste selbst?",
    subline:
      "Mehrfachauswahl. Gemeint ist, dass Sie den Dienst anbieten, nicht dass Sie ihn nutzen.",
    sidebar: {
      explains:
        "Zwei Stellen im Gesetz führen bestimmte Anbieter gesondert auf, und die Listen sind nicht deckungsgleich. Wer darauf steht, registriert sich bei einer anderen Stelle, und für die Sicherheitsmaßnahmen hat der EU-Durchführungsrechtsakt Vorrang vor der deutschen Aufzählung.",
      cite: "§ 60 Abs. 1 Satz 1 und § 30 Abs. 3 BSIG",
      norm: "§ 60",
    },
    wait: "Muss ich intern klären",
  },

  critical_installation: {
    question: "Betreiben Sie eine kritische Anlage?",
    subline: "Wenn Sie das nicht sicher wissen, ist das hier die übliche Antwort.",
    sidebar: {
      explains:
        "Betreiber kritischer Anlagen gelten als besonders wichtige Einrichtung und haben zwei Pflichten mehr: Systeme zur Angriffserkennung und ein Nachweis gegenüber dem BSI alle drei Jahre. Welche Anlagen kritisch sind und ab welchen Schwellenwerten, steht nicht im BSIG selbst, sondern in der Rechtsverordnung dazu.",
      cite: "§ 28 Abs. 1 Nr. 1, § 31 BSIG",
      norm: "§ 28",
      furtherReading: {
        label: "BSI-Kritisverordnung",
        href: "https://www.gesetze-im-internet.de/bsi-kritisv/",
      },
    },
    choices: [
      { value: "yes", label: "Ja" },
      { value: "no", label: "Nein" },
    ],
    wait: "Weiß ich nicht",
  },

  your_number: {
    question: "Das ist Ihre Liste",
    subline: "Jede Zeile, die weggefallen ist, hat einen Grund, den Sie angegeben haben.",
    sidebar: null,
  },
};

/**
 * The names the interface uses for each addressee when it explains why something fell away.
 *
 * Keyed on the type rather than on string, so adding an addressee to the policy fails to compile
 * here until someone has written the sentence that explains it to a reader.
 */
export const ADDRESSEE_LABEL: Readonly<Record<Addressee, string>> = {
  all: "Gilt für alle Einrichtungen",
  critical_installation: "Nur für Betreiber kritischer Anlagen",
  service_type_60_1: "Nur für die in § 60 Abs. 1 Satz 1 genannten Anbieter",
  sector_35_2: "Nur für die in § 35 Abs. 2 genannten Sektoren",
};

export const UI = {
  back: "Zurück",
  next: "Weiter",
  stepOf: (n: number, of: number) => `Schritt ${n} von ${of}`,
  start: "Anfangen",
  readStatute: "Gesetzestext lesen",
  waitingNote: "Offen, Sie kommen beim nächsten Mal hierher zurück.",
  none: "Keiner davon",
  /**
   * The running header count, and the wording matters.
   *
   * It shows what could still apply, which is what falls as someone answers no. Calling that
   * "gilt für Sie" would assert that an unanswered item applies, and asserting something the
   * company never said is the exact defect this whole flow is built to avoid.
   */
  inPlay: "Punkte kommen infrage",
  /** The settled count on the reflection screen, where the open ones are broken out separately. */
  addressed: (total: number) => `von ${total} Punkten gelten für Sie`,
  removedHeading: "Weggefallen",
  removedCount: (n: number) => `${n} ${n === 1 ? "Punkt entfällt" : "Punkte entfallen"}`,
  unsettledHeading: "Noch offen",
  unsettledNote:
    "Diese Punkte hängen an einer Frage, die noch offen ist. Sie zählen weder dazu noch weg.",
} as const;
