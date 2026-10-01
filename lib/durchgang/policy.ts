/**
 * A policy as the walk writes it: the template's fixed sections, then the clauses the person
 * chose, in the template's order, numbered, with the company's name and the item's answers filled
 * in. Plain string assembly, so the stored text and the screen's preview cannot differ.
 */

import { marker } from "./copy";

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

/** What a policy's markers stand for, by name: `company`, and each field the item asks. */
export type PolicyNames = Readonly<Record<string, string>>;

/** Written where an answer is still open, so the printed copy has a line to fill in by hand. */
export const BLANK = "_______________";

const answerText = (value: unknown): string =>
  value === null || value === undefined || String(value).trim() === ""
    ? BLANK
    : String(value).trim();

/** The names a policy is written with: the company's, and every asked field's answer or a blank. */
export const policyNames = (
  company: string,
  fields: readonly string[],
  answers: Readonly<Record<string, unknown>>,
): PolicyNames => ({
  ...Object.fromEntries(fields.map((f) => [f, answerText(answers[f])])),
  company,
});

const named = (text: string, names: PolicyNames) =>
  Object.entries(names).reduce(
    (acc, [name, value]) => acc.split(marker(name)).join(value),
    text,
  );

export const policyTitle = (document: PolicyDocument, names: PolicyNames): string =>
  named(document.title, names);

export const policySignature = (document: PolicyDocument, names: PolicyNames): string =>
  named(document.signature, names);

/** The policy's numbered parts: every section, then each chosen clause. */
export const policyParts = (
  document: PolicyDocument,
  chosen: readonly string[],
  names: PolicyNames,
): readonly PolicyPart[] =>
  [...document.sections, ...document.clauses.filter((c) => chosen.includes(c.id))].map(
    (part, i) => ({
      heading: `${i + 1}. ${named(part.heading, names)}`,
      text: named(part.text, names),
    }),
  );

/** The policy as the `policy` row stores it, in Markdown. */
export const policyText = (
  document: PolicyDocument,
  chosen: readonly string[],
  names: PolicyNames,
): string =>
  [
    `# ${policyTitle(document, names)}`,
    ...policyParts(document, chosen, names).map((p) => `## ${p.heading}\n\n${p.text}`),
    policySignature(document, names),
  ].join("\n\n");
