import { expect, test } from "bun:test";
import {
  getNis2CzechRef,
  getNis2RequirementsForCategory,
  nis2Categories,
} from "@nisd2/grc-data-model/frameworks";
import { buildCitationRows } from "./citations";
import { czechArticle, czechCitations, czechDutyCitation } from "./czech-law";

const CODES = nis2Categories.flatMap((c) =>
  getNis2RequirementsForCategory(c.slug).map((r) => r.code),
);

test("every NIS 2 requirement has a place in Czech law", () => {
  expect(CODES).toHaveLength(49);
  for (const code of CODES) {
    const ref = getNis2CzechRef(code);
    expect({ code, cited: ref !== null && czechCitations(ref).length > 0 }).toEqual({
      code,
      cited: true,
    });
  }
});

test("writes the directive's articles the Czech way", () => {
  expect(czechArticle("Art. 21(2)(a), Art. 21(2)(i)")).toBe(
    "čl. 21 odst. 2 písm. a), čl. 21 odst. 2 písm. i)",
  );
  expect(czechArticle("Art. 20(2)")).toBe("čl. 20 odst. 2");
  expect(czechArticle("Art. 3(1)-(2)")).toBe("čl. 3 odst. 1 až 2");
});

test("links each text at the first section it cites, on e-Sbírka", () => {
  const rows = czechCitations({
    act: "§§ 15 až 17",
    lower: "příloha č. 2 písm. k)",
    higher: null,
  });
  expect(rows.map((r) => r.href)).toEqual([
    "https://e-sbirka.gov.cz/sb/2025/264/2025-11-01#par_15",
    "https://e-sbirka.gov.cz/sb/2025/410/2025-11-01",
  ]);
});

test("a duty card cites each decree's first place, and the Act only where no decree has one", () => {
  expect(czechDutyCitation(getNis2CzechRef("1.1"))).toEqual({
    cite: "§ 4 písm. b) vyhlášky č. 410/2025 Sb.; § 4 odst. 1 písm. a) vyhlášky č. 409/2025 Sb.",
    href: "https://e-sbirka.gov.cz/sb/2025/410/2025-11-01#par_4",
  });
  expect(czechDutyCitation(getNis2CzechRef("12.2"))?.cite).toBe(
    "§ 6 odst. 1 zákona č. 264/2025 Sb.",
  );
});

test("a Czech page cites Czech law instead of the BSIG; other pages keep the BSIG", () => {
  const source = {
    frameworkCode: "nis2",
    frameworkRef: "Art. 20(2)",
    legalRef: "§38(3) BSIG",
    referenceUrl: null,
    nationalUrl: null,
    czechRef: getNis2CzechRef("1.1"),
  };
  expect(buildCitationRows(source, "cs").map((r) => [r.id, r.citation])).toEqual([
    ["framework", "čl. 20 odst. 2"],
    ["lower", "§ 4 písm. b); § 5 odst. 2 písm. a), odst. 3"],
    ["higher", "§ 4 odst. 1 písm. a); § 10 odst. 3 písm. a), odst. 5"],
  ]);
  expect(buildCitationRows(source, "de").map((r) => r.id)).toEqual([
    "framework",
    "national",
  ]);
});
