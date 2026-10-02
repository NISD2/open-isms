/**
 * A policy as the walk writes it: the template's fixed sections, then the clauses the person
 * chose, in the template's order, then the company's own words if it wrote any, numbered, with
 * the company's name and the item's answers filled in. Plain string assembly, so the stored text
 * and the screen's preview cannot differ.
 */

import type {
  CryptoAlgorithmEntry,
  CryptoPolicyConfig,
} from "@/lib/compliance/policy-config-defaults";
import {
  CRYPTO_CATEGORIES,
  type CryptoCategory,
  type CryptoStatus,
} from "@/lib/compliance/policy-config-schemas";
import type { RegistrationPortal } from "@/lib/registration-portals/schema";
import { marker } from "./copy";
import type { WalkLocale } from "./types";

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

/** The person an answer names, or a blank. */
export const personText = (value: unknown): string => answerText(value);

const CRYPTO_TEXT = {
  de: {
    bits: "Bit",
    tls: (version: string) => `TLS mindestens in Version ${version}, bevorzugt 1.3.`,
  },
  en: {
    bits: "bits",
    tls: (version: string) => `TLS at least in version ${version}, preferably 1.3.`,
  },
} as const;

const TLS_VERSION = { tls_1_2: "1.2", tls_1_3: "1.3" } as const satisfies Record<
  CryptoPolicyConfig["minTlsVersion"],
  string
>;

/** The 9.1 list screen's own names for the kinds and statuses, so the policy prints the same. */
export interface CryptoLabels {
  readonly categories: Readonly<Record<CryptoCategory, string>>;
  readonly status: Readonly<Record<CryptoStatus, string>>;
}

/**
 * The company's crypto list as its cryptography policy prints it: the accepted methods by kind,
 * then what is only kept for what exists and what is not used at all, then the TLS floor.
 */
export const acceptedCryptoText = (
  locale: WalkLocale,
  labels: CryptoLabels,
  list: Pick<CryptoPolicyConfig, "algorithms" | "minTlsVersion"> | null,
): string => {
  if (!list) return BLANK;
  const text = CRYPTO_TEXT[locale];
  const named = (e: CryptoAlgorithmEntry) =>
    e.keyLength ? `${e.algorithm} (${e.keyLength} ${text.bits})` : e.algorithm;
  const approved = CRYPTO_CATEGORIES.flatMap((category) => {
    const names = list.algorithms
      .filter((e) => e.status === "approved" && e.category === category)
      .map(named);
    return names.length > 0
      ? [`- ${labels.categories[category]}: ${names.join(", ")}`]
      : [];
  });
  const of = (status: CryptoStatus) =>
    list.algorithms.filter((e) => e.status === status).map(named);
  const deprecated = of("deprecated");
  const prohibited = of("prohibited");
  return [
    `${labels.status.approved}:`,
    ...approved,
    ...(deprecated.length > 0
      ? [`${labels.status.deprecated}: ${deprecated.join(", ")}`]
      : []),
    ...(prohibited.length > 0
      ? [`${labels.status.prohibited}: ${prohibited.join(", ")}`]
      : []),
    text.tls(TLS_VERSION[list.minTlsVersion]),
  ].join("\n");
};

/** The country whose reporting channel and its button we have checked: Germany's BSI portal. */
const CHECKED_COUNTRY = "DE";

const BUTTON = {
  de: (url: string) => `BSI-Portal (${url}), Schaltfläche „Sicherheitsvorfall melden“`,
  en: (url: string) => `the BSI portal (${url}), button "Sicherheitsvorfall melden"`,
} as const;

/**
 * Where a plan says incidents are reported, from the company's country: in Germany the BSI portal
 * and its button, checked against the BSI's instructions; elsewhere the authority and its
 * website, which says how; a blank where the country is not set.
 */
export const reportingChannelText = (
  locale: WalkLocale,
  portal: Pick<
    RegistrationPortal,
    "countryCode" | "authority" | "authorityUrl" | "portalUrl"
  > | null,
): string => {
  if (!portal) return BLANK;
  if (portal.countryCode === CHECKED_COUNTRY && portal.portalUrl) {
    return BUTTON[locale](portal.portalUrl);
  }
  return portal.authorityUrl
    ? `${portal.authority} (${portal.authorityUrl})`
    : portal.authority;
};

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
