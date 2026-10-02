import { expect, test } from "bun:test";
import { typesetCitation } from "./citations";

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
