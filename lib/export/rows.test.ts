import { describe, expect, test } from "bun:test";
import { answerRow } from "./rows";
import { exportNames } from "./value-names";

describe("answerRow", () => {
  const answers = {
    labels: { PRO: { reviewFrequency: "Einkauf" }, ACC: { reviewFrequency: "Zugriffe" } },
    values: { trainingFrequency: { annual: "Jährlich", semi_annual: "Halbjährlich" } },
  };

  test("labels a key by its category, since one key can mean two things", () => {
    expect(answerRow("PRO", "reviewFrequency", "x", answers, "de")[0]).toBe("Einkauf");
    expect(answerRow("ACC", "reviewFrequency", "x", answers, "de")[0]).toBe("Zugriffe");
  });

  test("prints a choice by its name, a list name by name, a yes as Ja", () => {
    expect(answerRow("TRN", "trainingFrequency", "annual", answers, "de")[1]).toBe(
      "Jährlich",
    );
    expect(
      answerRow("TRN", "trainingFrequency", ["annual", "semi_annual"], answers, "de")[1],
    ).toBe("Jährlich, Halbjährlich");
    expect(answerRow("INC", "bsiReportingRegistered", true, answers, "de")[1]).toBe("Ja");
  });

  test("an empty answer prints nothing", () => {
    expect(answerRow("INC", "drillType", "", answers, "de")[1]).toBeNull();
    expect(answerRow("INC", "drillType", [], answers, "de")[1]).toBeNull();
  });
});

describe("exportNames answers", () => {
  test("German labels for both meanings of a shared key, and German choice names", async () => {
    const { answers } = await exportNames("de");
    expect(answers.labels.PRO?.reviewFrequency).toBe(
      "Wie oft die Einkaufsregeln überprüft werden",
    );
    expect(answers.labels.ACC?.reviewFrequency).toBe(
      "Wie oft Zugriffsrechte überprüft werden (normale und privilegierte Konten)",
    );
    expect(answers.values.trainingFrequency?.annual).toBe("Jährlich");
  });

  test("the walk's own wording wins over the guidance where the walk asks a field", async () => {
    const { answers } = await exportNames("de");
    expect(answers.labels.INC?.itEmergencyNumber).toBe("Notfallnummer, die alle anrufen");
  });
});
