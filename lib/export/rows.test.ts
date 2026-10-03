import { describe, expect, test } from "bun:test";
import { answerRow, statusCounts, titleOf } from "./rows";
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

  test("a long list is clipped once as a whole, like a long text answer", () => {
    const long = Array.from({ length: 4000 }, (_, i) => `entry ${i}`);
    const asList = answerRow("INC", "drillType", long, answers, "de")[1] ?? "";
    const asText = answerRow("INC", "drillType", long.join(", "), answers, "de")[1] ?? "";
    expect(asList).toBe(asText);
  });
});

describe("statusCounts", () => {
  const signed = { status: "approved", covered: null };
  const metInStep = {
    status: "not_started",
    covered: { by: { kind: "codes", codes: ["7.3"] }, done: true },
  } as const;
  const stepUnsigned = {
    status: "not_started",
    covered: { by: { kind: "codes", codes: ["7.3"] }, done: false },
  } as const;
  const notRequired = {
    status: "not_started",
    covered: { by: { kind: "not_required" }, done: true },
  } as const;
  const declined = { status: "not_applicable", covered: null };
  const open = { status: "in_progress", covered: null };

  test("keeps signed off, not applicable, not required and open apart", () => {
    expect(
      statusCounts([signed, metInStep, stepUnsigned, notRequired, declined, open]),
    ).toEqual({ approved: 2, notApplicable: 1, notRequired: 1, open: 2 });
  });
});

describe("titleOf", () => {
  const names = {
    managementTraining: {
      name: "Management body training (Art. 20(2) NIS 2)",
      stored: [
        "Schulung der Geschäftsleitung (§ 38 Abs. 3 BSIG)",
        "Management body training (Art. 20(2) NIS 2)",
      ],
    },
  };

  test("prints the walk's management training title in the export's language", () => {
    expect(
      titleOf({ title: "Schulung der Geschäftsleitung (§ 38 Abs. 3 BSIG)" }, names),
    ).toBe("Management body training (Art. 20(2) NIS 2)");
  });

  test("keeps a title someone typed, and a name", () => {
    expect(titleOf({ title: "GF-Workshop beim Systemhaus" }, names)).toBe(
      "GF-Workshop beim Systemhaus",
    );
    expect(titleOf({ name: "proALPHA ERP" }, names)).toBe("proALPHA ERP");
  });
});

describe("exportNames managementTraining", () => {
  test("knows the walk's title in every language it can be stored in", async () => {
    const { managementTraining } = await exportNames("en");
    expect(managementTraining.name).toBe("Management body training (Art. 20(2) NIS 2)");
    expect(managementTraining.stored).toContain(
      "Schulung der Geschäftsleitung (§ 38 Abs. 3 BSIG)",
    );
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
