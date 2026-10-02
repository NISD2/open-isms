import { expect, test } from "bun:test";
import {
  BLANK,
  criticalProcessesText,
  policyNames,
  policyParts,
  policyText,
  policyTitle,
  recoveryOrderText,
} from "./policy";

test("prints the processes that must keep running with their line, and a blank for none", () => {
  expect(
    criticalProcessesText([
      { name: "Vertrieb", how: " Aufträge per Telefon " },
      { name: "Buchhaltung", how: "" },
    ]),
  ).toBe("Vertrieb: Aufträge per Telefon; Buchhaltung");
  expect(criticalProcessesText([])).toBe(BLANK);
});

test("numbers the systems in recovery order, and a blank for none", () => {
  expect(recoveryOrderText(["ERP", "E-Mail"])).toBe("1. ERP, 2. E-Mail");
  expect(recoveryOrderText([])).toBe(BLANK);
});

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
  own: "Weitere Regelungen",
  signature: "Für die Geschäftsführung der {company}",
};

const muster = policyNames("Muster GmbH", [], {});

test("numbers the sections, then the chosen clauses in the template's order", () => {
  expect(policyParts(document, ["suppliers", "training"], muster, "")).toEqual([
    { clause: null, heading: "1. Geltungsbereich", text: "Gilt für die Muster GmbH." },
    { clause: null, heading: "2. Ziele", text: "Verfügbarkeit." },
    { clause: "training", heading: "3. Schulungen", text: "Wir schulen." },
    { clause: "suppliers", heading: "4. Lieferanten", text: "Auch sie." },
  ]);
});

test("ignores a clause the template does not have", () => {
  expect(policyParts(document, ["unknown"], muster, "").map((p) => p.heading)).toEqual([
    "1. Geltungsbereich",
    "2. Ziele",
  ]);
});

test("adds the company's own words last, as written, and nothing for blank ones", () => {
  const own = "Notfallhandy der IT bei der {company}: 0170 1234567";
  expect(policyParts(document, ["training"], muster, `  ${own} `).at(-1)).toEqual({
    clause: null,
    heading: "4. Weitere Regelungen",
    text: own,
  });
  expect(policyParts(document, [], muster, "  \n ")).toHaveLength(2);
});

test("writes the stored text as the preview shows it, with the company named throughout", () => {
  expect(policyTitle(document, muster)).toBe("Leitlinie der Muster GmbH");
  expect(policyText(document, ["training"], muster, "")).toBe(
    [
      "# Leitlinie der Muster GmbH",
      "## 1. Geltungsbereich\n\nGilt für die Muster GmbH.",
      "## 2. Ziele\n\nVerfügbarkeit.",
      "## 3. Schulungen\n\nWir schulen.",
      "Für die Geschäftsführung der Muster GmbH",
    ].join("\n\n"),
  );
});

test("fills each answer in, and leaves a line to write on where one is still open", () => {
  const plan = {
    ...document,
    sections: [
      { heading: "Leitung", text: "{incidentLead} leitet; Nummer {itEmergencyNumber}." },
    ],
  };
  const names = policyNames("Muster GmbH", ["incidentLead", "itEmergencyNumber"], {
    incidentLead: "  Anna Weber ",
    itEmergencyNumber: " ",
  });
  expect(policyParts(plan, [], names, "")[0]?.text).toBe(
    `Anna Weber leitet; Nummer ${BLANK}.`,
  );
});

test("a field called company cannot rename the company", () => {
  expect(policyNames("Muster GmbH", ["company"], { company: "Andere AG" }).company).toBe(
    "Muster GmbH",
  );
});
