import { describe, expect, test } from "bun:test";
import statuteJson from "@/data/law/bsig-2025.json";
import { REPORT_TEXT, REPORTING_CLOCK } from "./bsig-32";

const section32 = ((): string => {
  const norms: unknown = (statuteJson as { norms?: unknown }).norms;
  const text =
    typeof norms === "object" && norms !== null
      ? (norms as Record<string, unknown>)["§ 32"]
      : undefined;
  if (typeof text !== "string") throw new Error("bsig-2025.json: § 32 missing");
  return text;
})();

describe("§ 32 BSIG reporting clock", () => {
  test("the deadlines are the statute's, read from the vendored text", () => {
    expect(section32).toContain(
      `innerhalb von ${REPORTING_CLOCK.earlyWarningHours} Stunden nach Kenntniserlangung`,
    );
    expect(section32).toContain(
      `innerhalb von ${REPORTING_CLOCK.notificationHours} Stunden nach Kenntniserlangung`,
    );
    expect(REPORTING_CLOCK.finalReportMonths).toBe(1);
    expect(section32).toContain("spätestens einen Monat nach Übermittlung der Meldung");
  });

  test("the final report lists every item of Nr. 4 a to d", () => {
    for (const part of [
      "Schweregrad",
      "Auswirkungen",
      "Art der Bedrohung",
      "Abhilfemaßnahmen",
      "grenzüberschreitenden",
    ]) {
      expect(section32).toContain(part);
      expect(REPORT_TEXT.de.final_report.content).toContain(part);
    }
  });

  test("the German report names are the statute's words", () => {
    // Mid-sentence in the statute: "eine frühe Erstmeldung".
    const { name } = REPORT_TEXT.de.early_warning;
    expect(section32).toContain(name.charAt(0).toLowerCase() + name.slice(1));
    expect(section32).toContain(REPORT_TEXT.de.final_report.name);
  });
});
