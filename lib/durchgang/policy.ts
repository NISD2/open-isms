/**
 * A policy as the walk writes it: the template's fixed sections, then the clauses the person
 * chose, in the template's order, numbered, with the company's name filled in. Plain string
 * assembly, so the stored text and the screen's preview cannot differ.
 */

import { COMPANY_MARKER } from "./copy";

export interface PolicyDocument {
  readonly title: string;
  readonly sections: ReadonlyArray<{ readonly heading: string; readonly text: string }>;
  readonly clauses: ReadonlyArray<{
    readonly id: string;
    readonly label: string;
    readonly heading: string;
    readonly text: string;
  }>;
  readonly signature: string;
}

export interface PolicyPart {
  readonly heading: string;
  readonly text: string;
}

const named = (text: string, company: string) => text.split(COMPANY_MARKER).join(company);

export const policyTitle = (document: PolicyDocument, company: string): string =>
  named(document.title, company);

export const policySignature = (document: PolicyDocument, company: string): string =>
  named(document.signature, company);

/** The policy's numbered parts: every section, then each chosen clause. */
export const policyParts = (
  document: PolicyDocument,
  chosen: readonly string[],
  company: string,
): readonly PolicyPart[] =>
  [...document.sections, ...document.clauses.filter((c) => chosen.includes(c.id))].map(
    (part, i) => ({
      heading: `${i + 1}. ${named(part.heading, company)}`,
      text: named(part.text, company),
    }),
  );

/** The policy as the `policy` row stores it, in Markdown. */
export const policyText = (
  document: PolicyDocument,
  chosen: readonly string[],
  company: string,
): string =>
  [
    `# ${policyTitle(document, company)}`,
    ...policyParts(document, chosen, company).map((p) => `## ${p.heading}\n\n${p.text}`),
    policySignature(document, company),
  ].join("\n\n");
