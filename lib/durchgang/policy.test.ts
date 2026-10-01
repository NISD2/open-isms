import { expect, test } from "bun:test";
import { policyParts, policyText, policyTitle } from "./policy";

const document = {
  title: "Leitlinie der {company}",
  sections: [
    { heading: "Geltungsbereich", text: "Gilt für die {company}." },
    { heading: "Ziele", text: "Verfügbarkeit." },
  ],
  clauses: [
    { id: "training", label: "Schulungen", heading: "Schulungen", text: "Wir schulen." },
    { id: "suppliers", label: "Lieferanten", heading: "Lieferanten", text: "Auch sie." },
  ],
  signature: "Für die Geschäftsführung der {company}",
};

test("numbers the sections, then the chosen clauses in the template's order", () => {
  expect(policyParts(document, ["suppliers", "training"], "Muster GmbH")).toEqual([
    { heading: "1. Geltungsbereich", text: "Gilt für die Muster GmbH." },
    { heading: "2. Ziele", text: "Verfügbarkeit." },
    { heading: "3. Schulungen", text: "Wir schulen." },
    { heading: "4. Lieferanten", text: "Auch sie." },
  ]);
});

test("ignores a clause the template does not have", () => {
  expect(policyParts(document, ["unknown"], "X").map((p) => p.heading)).toEqual([
    "1. Geltungsbereich",
    "2. Ziele",
  ]);
});

test("writes the stored text as the preview shows it, with the company named throughout", () => {
  expect(policyTitle(document, "Muster GmbH")).toBe("Leitlinie der Muster GmbH");
  expect(policyText(document, ["training"], "Muster GmbH")).toBe(
    [
      "# Leitlinie der Muster GmbH",
      "## 1. Geltungsbereich\n\nGilt für die Muster GmbH.",
      "## 2. Ziele\n\nVerfügbarkeit.",
      "## 3. Schulungen\n\nWir schulen.",
      "Für die Geschäftsführung der Muster GmbH",
    ].join("\n\n"),
  );
});
