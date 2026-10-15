import { describe, expect, test } from "bun:test";
import { GAP_DOMAINS_CS, GAP_QUESTIONS_CS } from "./cs";
import { getGapAssessmentData } from "./index";
import { localizeGapDomain, localizeGapQuestion } from "./localize";

const { domains, questions } = getGapAssessmentData();

const czechValues = [
  ...Object.entries(GAP_DOMAINS_CS).flatMap(([id, d]) => [
    [`domain ${id} name`, d.name],
    [`domain ${id} description`, d.description],
  ]),
  ...Object.entries(GAP_QUESTIONS_CS).flatMap(([id, q]) => [
    [`${id} text`, q.text],
    [`${id} plainText`, q.plainText],
    [`${id} legalBasis`, q.legalBasis],
  ]),
] as const;

/** German law and the German authority, which a Czech reader's duties never rest on. */
const GERMAN_LAW = [
  "BSIG",
  "BSI",
  "MUK",
  "Bescheid",
  "Widerspruch",
  "gesetze-im-internet",
] as const;

describe("Czech gap assessment layer", () => {
  test("every package domain and question has a complete Czech entry", () => {
    const incomplete = [
      ...domains
        .filter((d) => !GAP_DOMAINS_CS[d.id]?.name || !GAP_DOMAINS_CS[d.id]?.description)
        .map((d) => `domain ${d.id}`),
      ...questions
        .filter((q) => {
          const cs = GAP_QUESTIONS_CS[q.id];
          return !cs?.text || !cs.plainText || !cs.legalBasis;
        })
        .map((q) => q.id),
    ];
    expect(incomplete).toEqual([]);
  });

  test("holds no ids the package no longer has", () => {
    const domainIds = new Set(domains.map((d) => d.id));
    const questionIds = new Set(questions.map((q) => q.id));
    const stale = [
      ...Object.keys(GAP_DOMAINS_CS).filter((id) => !domainIds.has(Number(id))),
      ...Object.keys(GAP_QUESTIONS_CS).filter((id) => !questionIds.has(id)),
    ];
    expect(stale).toEqual([]);
  });

  test("no Czech text or legal basis cites German law or the BSI", () => {
    const german = czechValues.filter(([, value]) =>
      GERMAN_LAW.some((term) => value.split(/[^\p{L}-]+/u).includes(term)),
    );
    expect(german.map(([where]) => where)).toEqual([]);
  });

  test("Czech typography: no ASCII double quote, no em-dash", () => {
    const bad = czechValues.filter(
      ([, value]) => value.includes('"') || value.includes("—"),
    );
    expect(bad.map(([where]) => where)).toEqual([]);
  });
});

describe("localizeGapDomain / localizeGapQuestion", () => {
  const domain = domains[0];
  const question = questions[0];

  test("Czech comes from the layer, German and English from the package", () => {
    expect(localizeGapDomain(domain, "cs")).toEqual(GAP_DOMAINS_CS[domain.id]);
    expect(localizeGapDomain(domain, "de").name).toBe(domain.name.de);
    expect(localizeGapQuestion(question, "cs")).toEqual(GAP_QUESTIONS_CS[question.id]);
    expect(localizeGapQuestion(question, "de").text).toBe(question.text.de);
    expect(localizeGapQuestion(question, "en").plainText).toBe(question.plainText.en);
  });

  test("a locale with neither Czech nor German falls back to English", () => {
    expect(localizeGapQuestion(question, "nl").text).toBe(question.text.en);
    expect(localizeGapDomain(domain, "fr").description).toBe(domain.description.en);
  });

  test("the package legal basis stays on German and English pages", () => {
    expect(localizeGapQuestion(question, "de").legalBasis).toBe(question.legalBasis);
    expect(localizeGapQuestion(question, "en").legalBasis).toBe(question.legalBasis);
  });
});
