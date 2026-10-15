import { expect, test } from "bun:test";
import { czechProvisionHref } from "./czech-law";

const ESB = "https://e-sbirka.gov.cz/sb/2025";

test("links a genitive citation at the section before the text's name", () => {
  expect(czechProvisionHref("§ 13 odst. 2 zákona č. 264/2025 Sb.")).toBe(
    `${ESB}/264/2025-11-01#par_13`,
  );
  expect(czechProvisionHref("§ 5 vyhlášky č. 408/2025 Sb.")).toBe(
    `${ESB}/408/2025-11-01#par_5`,
  );
  expect(czechProvisionHref("§§ 15 až 17 zákona č. 264/2025 Sb.")).toBe(
    `${ESB}/264/2025-11-01#par_15`,
  );
});

test("links a nominative citation at the section after the text's name", () => {
  expect(czechProvisionHref("vyhláška č. 410/2025 Sb., § 4 písm. b)")).toBe(
    `${ESB}/410/2025-11-01#par_4`,
  );
});

test("takes the first Czech text a citation names, in the first clause that names one", () => {
  expect(
    czechProvisionHref(
      "§ 4 písm. b) vyhlášky č. 410/2025 Sb.; § 4 odst. 1 písm. a) vyhlášky č. 409/2025 Sb.",
    ),
  ).toBe(`${ESB}/410/2025-11-01#par_4`);
  expect(czechProvisionHref("čl. 23 NIS 2 · § 16 zákona č. 264/2025 Sb.")).toBe(
    `${ESB}/264/2025-11-01#par_16`,
  );
  expect(
    czechProvisionHref("§ 6 odst. 1 zákona č. 264/2025 Sb., vyhláška č. 334/2025 Sb."),
  ).toBe(`${ESB}/264/2025-11-01#par_6`);
});

test("skips another law's section earlier in the same clause", () => {
  expect(
    czechProvisionHref("§ 159 občanského zákoníku, § 58 zákona č. 264/2025 Sb."),
  ).toBe(`${ESB}/264/2025-11-01#par_58`);
});

test("a Czech text without a section links the whole text", () => {
  expect(czechProvisionHref("zákon č. 264/2025 Sb., o kybernetické bezpečnosti")).toBe(
    `${ESB}/264/2025-11-01`,
  );
  expect(czechProvisionHref("příloha č. 2 vyhlášky č. 410/2025 Sb.")).toBe(
    `${ESB}/410/2025-11-01`,
  );
});

test("German and EU citations, and other Czech laws, get no link", () => {
  expect(czechProvisionHref("§ 38 Abs. 1 BSIG · Art. 20 Abs. 1 NIS 2")).toBeNull();
  expect(czechProvisionHref("čl. 21 odst. 2 směrnice NIS 2")).toBeNull();
  expect(czechProvisionHref("§ 152 zákona č. 500/2004 Sb., správní řád")).toBeNull();
});
