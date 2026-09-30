/**
 * The screen script behind the Durchgang design preview: which screens each item shows, in which
 * order. Data only, no rendering and no IO. The page resolves it against the real sources (the
 * framework definition, the guidance file, the glossary, the citation rows) and hands the result to
 * the client shell: one script per framework, the schema stays the source of truth for what is
 * asked, the script decides only order, grouping and teaching.
 *
 * Each kind of content has its own type because it gets its own visual form: the duty renders as
 * a paragraph block with its statute, an example renders as the artefact itself, what is often
 * missed lives in one fixed place beside every screen of the item.
 *
 * The teaching copy is written here for the preview only. In the build it lives in
 * messages/durchgang and passes the primary-source fact-check before any item ships.
 */

import type { FunctionalGroup } from "@/lib/asset-inventory/catalog";

export interface Term {
  readonly term: string;
  readonly definition: string;
  readonly source: string | null;
}

export interface Citation {
  readonly label: string;
  readonly citation: string;
  readonly href: string | null;
  /** Scope the reader needs next to the citation, e.g. that the CIR binds only some entities. */
  readonly note: string | null;
}

export interface FieldSpec {
  /** An intake field key from `CATEGORY_FIELD_MAPPING`. */
  readonly key: string;
  readonly label: string;
  readonly type: "text" | "date";
}

export interface PreviewField extends FieldSpec {
  readonly meaning: string | null;
  readonly whereToFind: string | null;
}

/** An example is shown as the thing it describes, never as a paragraph about it. */
export type Example =
  | {
      readonly kind: "compare";
      readonly caption: string;
      readonly good: { readonly value: string; readonly note: string };
      readonly bad: { readonly value: string; readonly note: string };
    }
  | {
      readonly kind: "rows";
      readonly caption: string;
      readonly rows: ReadonlyArray<{ name: string; detail: string }>;
    }
  | {
      readonly kind: "matrix";
      readonly caption: string;
      readonly impact: string;
      readonly frequency: string;
      readonly result: string;
    };

export type SourceIcon = "privacy" | "ledger" | "provider";

type Screen<F> =
  | {
      readonly kind: "learn";
      readonly title: string;
      readonly body: readonly string[];
      /** The legal duty behind the item, with the statute it comes from. */
      readonly duty: { readonly text: string; readonly cite: string };
    }
  | { readonly kind: "example"; readonly title: string; readonly example: Example }
  | {
      readonly kind: "fields";
      readonly title: string;
      readonly lead: string;
      /** The document the answers are copied from, named so the form can look like it. */
      readonly document: string;
      readonly fields: readonly F[];
    }
  | {
      readonly kind: "evidence";
      readonly title: string;
      readonly lead: string;
      readonly document: string;
    }
  | {
      readonly kind: "provision";
      readonly title: string;
      readonly lead: string;
      readonly source: string;
    }
  | {
      readonly kind: "adopt";
      readonly title: string;
      readonly lead: string;
      readonly lines: ReadonlyArray<{ label: string; text: string }>;
    }
  | {
      readonly kind: "sources";
      readonly title: string;
      readonly lead: string;
      readonly sources: ReadonlyArray<{
        id: string;
        icon: SourceIcon;
        label: string;
        text: string;
      }>;
    }
  | {
      readonly kind: "register";
      readonly title: string;
      readonly lead: string;
      /** One slice of the asset catalogue per screen, so no screen is a wall of checkboxes. */
      readonly groups: readonly FunctionalGroup[];
    }
  | {
      readonly kind: "done";
      readonly title: string;
      readonly recorded: readonly string[];
      readonly note: string;
    };

export type ScriptScreen = Screen<FieldSpec>;
export type PreviewScreen = Screen<PreviewField>;

export interface ScriptItem {
  /** Requirement code in the NIS 2 framework. */
  readonly code: string;
  /** Category slug, to find the requirement and its source URLs in the framework data. */
  readonly categorySlug: string;
  readonly section: string;
  /** The plain task, as the home screen names it. */
  readonly headline: string;
  readonly teaser: string;
  /** What people miss on this item. Shown in the same place on every one of its screens. */
  readonly overlooked: readonly string[];
  /** Keys under `info.glossary.terms`. */
  readonly glossary: readonly string[];
  /** Sourced definitions the glossary does not carry. */
  readonly extraTerms: readonly Term[];
  readonly screens: readonly ScriptScreen[];
}

export interface PreviewItem
  extends Omit<ScriptItem, "screens" | "glossary" | "extraTerms" | "categorySlug"> {
  /** The requirement's own title from the message files. */
  readonly title: string;
  readonly image: string | null;
  /** Link to the national statute, for the duty block. */
  readonly statuteHref: string | null;
  readonly citations: readonly Citation[];
  readonly terms: readonly Term[];
  readonly screens: readonly PreviewScreen[];
}

const BSI_200_3_TABLE_10 = "BSI-Standard 200-3, Tabelle 10";

export const SCRIPT: readonly ScriptItem[] = [
  {
    code: "12.2",
    categorySlug: "registration",
    section: "Registrierung",
    headline: "Beim BSI registrieren",
    teaser: "Ihr Unternehmen meldet sich einmal beim BSI an.",
    overlooked: [
      "Das BSI fragt nach den öffentlichen IP-Adressen Ihres Unternehmens (§ 33 Abs. 1 Nr. 2 BSIG). Die kennt Ihr IT-Dienstleister. Fragen Sie ihn vorher.",
      "Ein neues Organisationszertifikat von ELSTER kommt per Brief. Beantragen Sie es früh.",
    ],
    glossary: ["bsiRegistration", "muk", "bsig"],
    extraTerms: [],
    screens: [
      {
        kind: "learn",
        title: "Die Registrierung beim BSI",
        body: [
          "Jedes Unternehmen, für das NIS 2 gilt, meldet sich einmal beim Bundesamt für Sicherheit in der Informationstechnik (BSI) an. Dabei geben Sie an, wer Sie sind und wie das BSI Sie erreicht.",
          "Das geht online über das Portal des BSI. Hinein kommen Sie mit „Mein Unternehmenskonto“ (MUK) und einem Organisationszertifikat von ELSTER. Haben Sie schon eins, etwa aus der Steuer, nutzen Sie es.",
        ],
        duty: {
          text: "Die Registrierung ist eine eigene Pflicht. Sie ist spätestens drei Monate fällig, nachdem Ihr Unternehmen unter NIS 2 fällt.",
          cite: "§ 33 Abs. 1 BSIG",
        },
      },
      {
        kind: "example",
        title: "So sieht es richtig aus",
        example: {
          kind: "compare",
          caption: "Die Kontaktadresse, die Sie dem BSI angeben",
          good: {
            value: "it-sicherheit@ihre-firma.de",
            note: "Eine Sammeladresse. Menschen wechseln, die Adresse bleibt.",
          },
          bad: {
            value: "m.mueller@ihre-firma.de",
            note: "Eine persönliche Adresse. Wechselt Frau Müller die Stelle, erreicht das BSI niemanden mehr.",
          },
        },
      },
      {
        kind: "fields",
        title: "Nehmen Sie Ihre Bestätigung zur Hand",
        lead: "Zwei Angaben. Beide stehen in Ihrem Unternehmenskonto und in der Bestätigung des BSI.",
        document: "Bestätigung der Registrierung",
        fields: [
          {
            key: "mukAccountId",
            label: "Kennung Ihres Unternehmenskontos (MUK)",
            type: "text",
          },
          { key: "bsiRegistrationDate", label: "Datum der Registrierung", type: "date" },
        ],
      },
      {
        kind: "evidence",
        title: "Laden Sie die Bestätigung hoch",
        lead: "Ein PDF aus dem Portal oder ein Foto des Briefs reicht. Damit zeigen Sie später, dass die Registrierung erledigt ist.",
        document: "Bestätigung der Registrierung",
      },
      {
        kind: "done",
        title: "Registrierung erfasst",
        recorded: [
          "Kennung Ihres Unternehmenskontos",
          "Datum der Registrierung",
          "Bestätigung als Nachweis",
        ],
        note: "Die Geschäftsführung sieht das am Ende noch einmal durch und unterschreibt.",
      },
    ],
  },
  {
    code: "2.1",
    categorySlug: "risk-management",
    section: "Risikomanagement",
    headline: "Festlegen, wie Sie Risiken einstufen",
    teaser: "Sie übernehmen die Methode des BSI.",
    overlooked: [
      "Nicht nur Angriffe zählen. § 30 Abs. 2 BSIG verlangt einen Ansatz, der auch Feuer, Wasser, Stromausfall und andere physische Gefahren einschließt.",
      "Welche Risiken hingenommen werden, entscheidet die Geschäftsführung. Diese Grenze gehört mit Datum in die Methode, nicht versteckt in eine Liste.",
    ],
    glossary: ["riskManagement"],
    extraTerms: [
      {
        term: "Risikostufe gering",
        definition:
          "Die bereits umgesetzten oder zumindest im Sicherheitskonzept vorgesehenen Sicherheitsmaßnahmen bieten einen ausreichenden Schutz. In der Praxis ist es üblich, geringe Risiken zu akzeptieren und die Gefährdung dennoch zu beobachten.",
        source: BSI_200_3_TABLE_10,
      },
      {
        term: "Risikostufe mittel",
        definition:
          "Die bereits umgesetzten oder zumindest im Sicherheitskonzept vorgesehenen Sicherheitsmaßnahmen reichen möglicherweise nicht aus.",
        source: BSI_200_3_TABLE_10,
      },
      {
        term: "Risikostufe hoch",
        definition:
          "Die bereits umgesetzten oder zumindest im Sicherheitskonzept vorgesehenen Sicherheitsmaßnahmen bieten keinen ausreichenden Schutz vor der jeweiligen Gefährdung.",
        source: BSI_200_3_TABLE_10,
      },
      {
        term: "Risikostufe sehr hoch",
        definition:
          "Die bereits umgesetzten oder zumindest im Sicherheitskonzept vorgesehenen Sicherheitsmaßnahmen bieten keinen ausreichenden Schutz vor der jeweiligen Gefährdung. In der Praxis werden sehr hohe Risiken selten akzeptiert.",
        source: BSI_200_3_TABLE_10,
      },
    ],
    screens: [
      {
        kind: "learn",
        title: "Wie Sie Risiken einstufen",
        body: [
          "Bevor Sie Risiken aufschreiben, legen Sie fest, wie Sie sie bewerten. Dann kommt jeder, der ein Risiko einschätzt, zum gleichen Ergebnis.",
          "Das BSI hat dafür eine fertige Methode, den Standard 200-3. Jedes Risiko bekommt zwei Einschätzungen: Wie oft kann es passieren? Wie groß wäre der Schaden? Daraus ergibt sich eine von vier Stufen.",
        ],
        duty: {
          text: "Sie brauchen Konzepte zur Risikoanalyse. Welche Methode Sie wählen, ist Ihnen freigestellt. Das BSI empfiehlt, sich an Standard 200-3 zu orientieren.",
          cite: "§ 30 Abs. 2 Nr. 1 BSIG",
        },
      },
      {
        kind: "provision",
        title: "Die Matrix des BSI",
        lead: "Waagerecht steht, wie oft etwas eintritt. Senkrecht, wie groß der Schaden wäre. Wo sich beides trifft, steht die Stufe.",
        source:
          "BSI-Standard 200-3, Kapitel 5.2, Abbildung 3. Das BSI schreibt dazu, die Matrix solle an die eigenen Bedürfnisse angepasst werden. Für ein Unternehmen mit 50 bis 150 Beschäftigten übernehmen wir sie unverändert.",
      },
      {
        kind: "example",
        title: "So lesen Sie die Matrix",
        example: {
          kind: "matrix",
          caption:
            "Der Server fällt einmal im Jahr bis einmal im Monat aus. Der Schaden ist begrenzt und überschaubar.",
          impact: "begrenzt",
          frequency: "häufig",
          result: "mittel",
        },
      },
      {
        kind: "adopt",
        title: "Methode übernehmen",
        lead: "Mit einem Klick halten Sie die Methode fest. So steht sie danach in Ihren Unterlagen:",
        lines: [
          { label: "Methode", text: "Risikoanalyse nach BSI-Standard 200-3, Kapitel 5" },
          {
            label: "Stufen",
            text: "Vier für die Häufigkeit, vier für den Schaden, vier Risikostufen",
          },
          {
            label: "Hingenommen",
            text: "Risiken der Stufe gering. Sie werden weiter beobachtet.",
          },
        ],
      },
      {
        kind: "done",
        title: "Methode festgelegt",
        recorded: [
          "Risikoanalyse nach BSI-Standard 200-3",
          "Matrix mit vier Stufen",
          "Geringe Risiken werden hingenommen und beobachtet",
        ],
        note: "Wenn Sie später Ihre Risiken einstufen, sehen Sie die Matrix wieder daneben.",
      },
    ],
  },
  {
    code: "2.2",
    categorySlug: "risk-management",
    section: "Risikomanagement",
    headline: "Aufschreiben, was Ihr Unternehmen hat",
    teaser: "Eine Liste der Abläufe, Programme und Geräte, mit denen Sie arbeiten.",
    overlooked: [
      "Clouddienste und Zugänge von außen gehören auch auf die Liste.",
      "Jeder Eintrag braucht jemanden, der dafür zuständig ist. Eine Liste ohne Zuständige hält einer Prüfung nicht stand.",
    ],
    glossary: ["riskManagement", "cir2024"],
    extraTerms: [],
    screens: [
      {
        kind: "learn",
        title: "Was Ihr Unternehmen zum Arbeiten braucht",
        body: [
          "Schützen können Sie nur, was Sie kennen. Deshalb schreiben Sie jetzt auf, womit Ihr Unternehmen arbeitet: Abläufe, Programme, Geräte, Räume und Verbindungen. Das BSI nennt diesen Schritt Strukturanalyse (Standard 200-2).",
          "Die Liste muss nicht perfekt sein. Kommt etwas dazu, ergänzen Sie es.",
        ],
        duty: {
          text: "Welche Risiken Sie haben, hängt davon ab, was Sie haben. Diese Liste ist die Grundlage für die Risikoanalyse.",
          cite: "§ 30 Abs. 2 Nr. 1 BSIG",
        },
      },
      {
        kind: "example",
        title: "So kann Ihre Liste aussehen",
        example: {
          kind: "rows",
          caption: "Kurz und einfach reicht. Eine Zeile pro Sache:",
          rows: [
            { name: "Lohnabrechnung", detail: "macht das Steuerbüro" },
            { name: "E-Mail", detail: "Microsoft 365, alle Beschäftigten" },
            { name: "Büro-PCs", detail: "zwölf Stück, im Hauptbüro" },
          ],
        },
      },
      {
        kind: "sources",
        title: "Wo Ihre Liste schon steht",
        lead: "Meist gibt es so eine Liste schon, nur verteilt. Haken Sie ab, wo Sie nachgesehen haben:",
        sources: [
          {
            id: "ropa",
            icon: "privacy",
            label: "Verzeichnis der Verarbeitungstätigkeiten",
            text: "Aus dem Datenschutz. Darin stehen viele Programme, mit denen Sie arbeiten.",
          },
          {
            id: "ledger",
            icon: "ledger",
            label: "Anlagenverzeichnis oder Inventarliste",
            text: "Aus der Buchhaltung. Darin stehen Geräte, Fahrzeuge und Räume.",
          },
          {
            id: "provider",
            icon: "provider",
            label: "Ihr IT-Dienstleister",
            text: "Er weiß, welche Server, Konten und Clouddienste es gibt.",
          },
        ],
      },
      {
        kind: "register",
        title: "Was Ihr Unternehmen jeden Tag tut",
        lead: "Haken Sie an, was bei Ihnen läuft. Im Zweifel gilt: lieber aufschreiben als weglassen.",
        groups: ["business-processes"],
      },
      {
        kind: "register",
        title: "Programme für Kunden, Personal und Geld",
        lead: "Womit Sie Kunden bedienen, Löhne zahlen und buchen.",
        groups: ["customer-facing", "sales", "customer-service", "hr-payroll", "finance"],
      },
      {
        kind: "register",
        title: "Programme, die alle nutzen",
        lead: "E-Mail, Dateiablage, Chat und alles, was nur Ihre Branche hat.",
        groups: ["it-applications", "sector-specific"],
      },
      {
        kind: "register",
        title: "Technik und Räume",
        lead: "Server, Geräte, Netz und die Orte, an denen gearbeitet wird.",
        groups: ["it-infrastructure", "endpoints", "network", "locations"],
      },
      {
        kind: "done",
        title: "Ihre Liste steht",
        recorded: [],
        note: "Als Nächstes schätzen Sie für jeden Eintrag ein, wie wichtig er ist (Schutzbedarf). Das zeigt diese Vorschau nicht mehr.",
      },
    ],
  },
];
