import { expect, test } from "bun:test";
import { sourceParts } from "./SourceText";

test("a source line's address becomes a link and the text before it stays text", () => {
  expect(
    sourceParts(
      "Zákon č. 264/2025 Sb., o kybernetické bezpečnosti, § 14: https://e-sbirka.gov.cz/sb/2025/264/2025-11-01#par_14",
    ),
  ).toEqual([
    { kind: "text", text: "Zákon č. 264/2025 Sb., o kybernetické bezpečnosti, § 14: " },
    { kind: "address", href: "https://e-sbirka.gov.cz/sb/2025/264/2025-11-01#par_14" },
  ]);
});

test("closing punctuation stays out of the address; a query string stays in", () => {
  expect(
    sourceParts(
      "Směrnice NIS 2 (https://eur-lex.europa.eu/legal-content/CS/TXT/?uri=CELEX:32022L2555). Portál: https://portal.nukib.gov.cz.",
    ),
  ).toEqual([
    { kind: "text", text: "Směrnice NIS 2 (" },
    {
      kind: "address",
      href: "https://eur-lex.europa.eu/legal-content/CS/TXT/?uri=CELEX:32022L2555",
    },
    { kind: "text", text: "). Portál: " },
    { kind: "address", href: "https://portal.nukib.gov.cz" },
    { kind: "text", text: "." },
  ]);
});

test("a line without an address is one text part", () => {
  expect(sourceParts("§ 38 BSIG")).toEqual([{ kind: "text", text: "§ 38 BSIG" }]);
});
