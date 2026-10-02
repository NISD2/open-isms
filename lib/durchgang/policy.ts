/**
 * A policy as the walk writes it: the template's fixed sections, then the clauses the person
 * chose, in the template's order, then the company's own words if it wrote any, numbered, with
 * the company's name and the item's answers filled in. Plain string assembly, so the stored text
 * and the screen's preview cannot differ.
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
  /** The heading of the company's own addition. */
  readonly own: string;
  readonly signature: string;
}

export interface PolicyPart {
  /** The clause a part comes from, or null for a fixed section and the company's own words. */
  readonly clause: string | null;
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

/** The processes that must keep running as a plan prints them, each with how it goes on. */
export const criticalProcessesText = (
  rows: ReadonlyArray<{ readonly name: string; readonly how: string }>,
): string =>
  rows.length === 0
    ? BLANK
    : rows.map((r) => (r.how.trim() ? `${r.name}: ${r.how.trim()}` : r.name)).join("; ");

/** The systems in the order a plan brings them back, numbered. */
export const recoveryOrderText = (names: readonly string[]): string =>
  names.length === 0 ? BLANK : names.map((name, i) => `${i + 1}. ${name}`).join(", ");

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

/**
 * The policy's numbered parts: every section, then each chosen clause, then the company's own
 * words, which are printed as written.
 */
export const policyParts = (
  document: PolicyDocument,
  chosen: readonly string[],
  names: PolicyNames,
  own: string,
): readonly PolicyPart[] =>
  [
    ...document.sections.map((s) => ({
      clause: null,
      heading: named(s.heading, names),
      text: named(s.text, names),
    })),
    ...document.clauses
      .filter((c) => chosen.includes(c.id))
      .map((c) => ({
        clause: c.id,
        heading: named(c.heading, names),
        text: named(c.text, names),
      })),
    ...(own.trim() ? [{ clause: null, heading: document.own, text: own.trim() }] : []),
  ].map((part, i) => ({ ...part, heading: `${i + 1}. ${part.heading}` }));

/** The policy as the `policy` row stores it, in Markdown. */
export const policyText = (
  document: PolicyDocument,
  chosen: readonly string[],
  names: PolicyNames,
  own: string,
): string =>
  [
    `# ${policyTitle(document, names)}`,
    ...policyParts(document, chosen, names, own).map(
      (p) => `## ${p.heading}\n\n${p.text}`,
    ),
    policySignature(document, names),
  ].join("\n\n");
