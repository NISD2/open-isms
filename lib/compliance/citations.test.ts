import { expect, test } from "bun:test";
import { buildCitationRows, typesetCitation } from "./citations";

const NBSP = " ";

test("sets a BSIG citation as one format, with non-breaking spaces", () => {
  expect(typesetCitation("§38(3) BSIG")).toBe(`§${NBSP}38 Abs.${NBSP}3 BSIG`);
  expect(typesetCitation("§30(2) Nr. 1 und 9 BSIG, CIR 12")).toBe(
    `§${NBSP}30 Abs.${NBSP}2 Nr.${NBSP}1 und 9 BSIG, CIR 12`,
  );
  expect(typesetCitation("nach § 38 Abs. 3 BSIG geschult")).toBe(
    `nach §${NBSP}38 Abs.${NBSP}3 BSIG geschult`,
  );
});

test("protects the directive's article numbers and leaves other text alone", () => {
  expect(typesetCitation("Art. 21(2)(a), Art. 21(2)(i)")).toBe(
    `Art.${NBSP}21(2)(a), Art.${NBSP}21(2)(i)`,
  );
  expect(typesetCitation("Anhang, Nr. 12.1, 12.4")).toBe(`Anhang, Nr.${NBSP}12.1, 12.4`);
  expect(typesetCitation("Kein Paragraf hier.")).toBe("Kein Paragraf hier.");
});

const SOURCE = {
  frameworkCode: "nis2",
  frameworkRef: "Art. 21(2)(b)",
  legalRef: "§30(2) Nr. 2 BSIG",
  referenceUrl: null,
  nationalUrl: null,
  cirReference: "3.1",
  cirUrl: "https://eur-lex.europa.eu/eli/reg_impl/2024/2690/oj",
} as const;

// The CIR binds only the entity types in its Art. 1, so it never sits under the BSIG label.
test("puts the CIR point on its own row, after the BSIG", () => {
  const rows = buildCitationRows(SOURCE, "de");
  expect(rows.map((r) => r.id)).toEqual(["framework", "national", "cir"]);
  expect(rows.find((r) => r.id === "national")?.citation).not.toContain("CIR");
  expect(rows.find((r) => r.id === "cir")).toMatchObject({
    citation: "3.1",
    href: SOURCE.cirUrl,
  });
});

test("adds no CIR row where the requirement follows no CIR point", () => {
  const rows = buildCitationRows({ ...SOURCE, cirReference: null }, "en");
  expect(rows.map((r) => r.id)).toEqual(["framework", "national"]);
});
