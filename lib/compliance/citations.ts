/**
 * Legal citation rows for a requirement, resolved per framework.
 *
 * Kept out of role-mapping.ts and the schema modules so client components can
 * import it without pulling drizzle-orm into the bundle. The framework enum is
 * imported as a type only, which erases at compile time while still making a
 * newly added framework a compile error in FRAMEWORK_CITATION_STYLE below.
 */

import type { frameworkEnum } from "@nisd2/grc-data-model/enums";
import type { CzechRef } from "@nisd2/grc-data-model/frameworks";
import { type CzechPart, czechArticle, czechCitations } from "./czech-law";

type FrameworkCode = (typeof frameworkEnum.enumValues)[number];

/**
 * How a framework names itself to the reader.
 *
 * `message` resolves against the `portal` namespace, which already carries the
 * framework names in all ten locales and is what the sidebar renders. That is
 * what makes gdpr read as DSGVO in German and GDPR everywhere else.
 *
 * `literal` covers frameworks with no message key, whose names are the same
 * proper noun in every locale.
 */
export type FrameworkLabel =
  | { readonly kind: "message"; readonly key: string }
  | { readonly kind: "literal"; readonly text: string };

interface FrameworkCitationStyle {
  readonly label: FrameworkLabel;
  /**
   * The national law transposing this framework, if it has one.
   *
   * This is what decides whether a requirement cites one text or two, and it
   * cannot be read off the citation strings. NIS 2 stores the EU article in
   * `frameworkRef` and the German transposition in `legalRef` — "Art. 21(2)(b)"
   * against "§30(2) Nr. 2 BSIG", two citations of two different texts. Directly
   * applicable regulations and standards have no transposition, so their
   * `legalRef` is the same citation as `frameworkRef`, only fuller:
   * "Art. 28" against "GDPR Art. 28(3)".
   */
  readonly nationalLaw: string | null;
}

/**
 * Deliberately keyed off the framework enum rather than
 * `complianceFramework.sidebarLabel`: that column is nullable free text, and a
 * missing or unexpected value there must not decide how a legal citation is
 * labelled.
 */
export const FRAMEWORK_CITATION_STYLE: Record<FrameworkCode, FrameworkCitationStyle> = {
  nis2: { label: { kind: "message", key: "nis2" }, nationalLaw: "BSIG" },
  gdpr: { label: { kind: "message", key: "dsgvo" }, nationalLaw: null },
  iso27001: { label: { kind: "message", key: "iso27001" }, nationalLaw: null },
  eu_ai_act: { label: { kind: "message", key: "aiact" }, nationalLaw: null },
  eu_cra: { label: { kind: "message", key: "cra" }, nationalLaw: null },
  arbeitsschutz: { label: { kind: "literal", text: "Arbeitsschutz" }, nationalLaw: null },
  brandschutz: { label: { kind: "literal", text: "Brandschutz" }, nationalLaw: null },
  bsi_grundschutz: {
    label: { kind: "literal", text: "BSI IT-Grundschutz" },
    nationalLaw: null,
  },
};

export interface CitationSource {
  readonly frameworkCode: string | null;
  readonly frameworkRef: string | null;
  readonly legalRef: string | null;
  /** requirement_category.reference_url — the framework's primary source. */
  readonly referenceUrl: string | null;
  /** requirement_category.national_url — the national transposition, if any. */
  readonly nationalUrl: string | null;
  /** The requirement's place in Czech law (its row's Czech columns), cited instead of the BSIG on a Czech page. */
  readonly czechRef?: CzechRef | null;
}

export interface CitationRow {
  readonly id: "framework" | "national" | CzechPart;
  readonly label: FrameworkLabel;
  /** Rendered verbatim. A legal citation is never reformatted for looks. */
  readonly citation: string;
  /**
   * The curated source page for this requirement's category, or null.
   *
   * Scoped to the category, not to the citation beside it: a citation may name
   * several articles and the category carries one URL. Attaching it to the
   * framework label rather than to the citation text is what keeps that
   * promise honest. Never a placeholder — no URL means no link.
   */
  readonly href: string | null;
}

const nonEmpty = (value: string | null): string | null => {
  const trimmed = value?.trim() ?? "";
  return trimmed === "" ? null : trimmed;
};

const isFrameworkCode = (code: string | null): code is FrameworkCode =>
  code !== null && Object.hasOwn(FRAMEWORK_CITATION_STYLE, code);

const NBSP = " ";

/**
 * A legal citation as German typography sets it: "§ 38 Abs. 3 BSIG", with a non-breaking space
 * after "§" and inside "Abs. 3", "Nr. 1" and "Art. 21", so no sign or abbreviation ends a line
 * alone (DIN 5008 recommends the protected space after "§"). The framework data writes
 * "§38(3)", which becomes "§ 38 Abs. 3". Free text, so a pattern is the right tool here.
 */
export const typesetCitation = (text: string): string =>
  text
    .replace(/§\s*(\d+[a-z]?)\((\d+)\)/g, `§${NBSP}$1 Abs.${NBSP}$2`)
    .replace(/§[ \t]*(?=\d)/g, `§${NBSP}`)
    .replace(/\b(Abs\.|Nr\.|Art\.)[ \t]+(?=\d)/g, `$1${NBSP}`);

/**
 * A Czech page cites Czech law where the requirement has a place in it: the directive in Czech
 * style, then the Act and the decree for each regime, each linked to its section. The regime is
 * not known here (the Portál NÚKIB shows it to the company), so both decrees show.
 */
const czechRows = (
  source: CitationSource,
  czechRef: CzechRef,
): readonly CitationRow[] => {
  const style = FRAMEWORK_CITATION_STYLE.nis2;
  const frameworkRef = nonEmpty(source.frameworkRef);
  return [
    ...(frameworkRef === null
      ? []
      : [
          {
            id: "framework" as const,
            label: style.label,
            citation: czechArticle(frameworkRef),
            href: nonEmpty(source.referenceUrl),
          },
        ]),
    ...czechCitations(czechRef).map((c) => ({
      id: c.part,
      label: { kind: "literal" as const, text: c.label },
      citation: c.citation,
      href: c.href,
    })),
  ];
};

export function buildCitationRows(
  source: CitationSource,
  locale?: string,
): readonly CitationRow[] {
  if (!isFrameworkCode(source.frameworkCode)) return [];
  if (locale === "cs" && source.frameworkCode === "nis2" && source.czechRef)
    return czechRows(source, source.czechRef);

  const style = FRAMEWORK_CITATION_STYLE[source.frameworkCode];
  const typeset = (value: string | null) => {
    const text = nonEmpty(value);
    return text === null ? null : typesetCitation(text);
  };
  const frameworkRef = typeset(source.frameworkRef);
  const legalRef = typeset(source.legalRef);

  // With a national transposition the two columns cite different texts, so each
  // gets its own labelled row. Without one they cite the same text and the
  // fuller of the two says everything the other would.
  const frameworkCitation = style.nationalLaw ? frameworkRef : (legalRef ?? frameworkRef);

  const rows: readonly (CitationRow | null)[] = [
    frameworkCitation === null
      ? null
      : {
          id: "framework",
          label: style.label,
          citation: frameworkCitation,
          href: nonEmpty(source.referenceUrl),
        },
    style.nationalLaw === null || legalRef === null
      ? null
      : {
          id: "national",
          label: { kind: "literal", text: style.nationalLaw },
          citation: legalRef,
          href: nonEmpty(source.nationalUrl),
        },
  ];

  return rows.filter((row) => row !== null);
}
