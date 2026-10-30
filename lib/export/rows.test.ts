import { describe, expect, test } from "bun:test";
import { journeyState } from "@/lib/compliance/journey-position";
import { exportLabels } from "@/lib/pdf/export-labels";
import { PDF_LOCALES } from "@/lib/pdf/format";
import { getReportLabels } from "@/lib/pdf/policy-labels";
import { answerRow, shown, statusCounts, statusLabel, titleOf } from "./rows";
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
  const signed = { state: "signed", coveredBy: null } as const;
  const metInStep = {
    state: "signed",
    coveredBy: { kind: "walk", codes: ["7.3"] },
  } as const;
  const stepUnsigned = {
    state: "awaiting",
    coveredBy: { kind: "walk", codes: ["7.3"] },
  } as const;
  const notRequired = { state: "na", coveredBy: { kind: "not_required" } } as const;
  const declined = { state: "na", coveredBy: null } as const;
  const open = { state: "started", coveredBy: null } as const;

  test("keeps signed off, not applicable, not required and open apart", () => {
    expect(
      statusCounts([signed, metInStep, stepUnsigned, notRequired, declined, open]),
    ).toEqual({ approved: 2, notApplicable: 1, notRequired: 1, open: 2 });
  });
});

describe("statusLabel", () => {
  const labels = getReportLabels("en");

  // An outside tester filled 2.1 in the walk: the overview said awaiting sign-off, the export
  // said "not started", because it printed the status row, which moves only with a signature.
  test("an item filled in the walk reads as the overview reads it, whatever the status row says", () => {
    const filled = {
      state: journeyState("not_started", { kind: "filled" }),
      coveredBy: null,
    };
    expect(statusLabel(filled, labels)).toBe("awaiting sign-off");
  });

  test("names the walk items that met a requirement, signed or still waiting", () => {
    const by = { kind: "walk", codes: ["7.1", "7.3"] } as const;
    expect(statusLabel({ state: "signed", coveredBy: by }, labels)).toBe(
      "signed off in the walkthrough with 7.1 and 7.3",
    );
    expect(statusLabel({ state: "awaiting", coveredBy: by }, labels)).toBe(
      "in the walkthrough with 7.1 and 7.3, awaiting sign-off",
    );
    expect(
      statusLabel({ state: "na", coveredBy: { kind: "not_required" } }, labels),
    ).toBe("not required by law");
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

describe("exportNames values", () => {
  test("every code the export prints by name has its names in every language the export is written in", async () => {
    for (const locale of PDF_LOCALES) {
      const { values } = await exportNames(locale);
      const unnamed = Object.entries(values).flatMap(([field, names]) =>
        Object.keys(names).length === 0 ? [field] : [],
      );
      expect(unnamed, locale).toEqual([]);
    }
  });

  test("an asset's tolerance and restore time print in the walk's own words, and 'nobody knows' as a yes", async () => {
    const words = {
      labels: exportLabels("de"),
      names: await exportNames("de"),
      locale: "de" as const,
    };
    expect(shown("maxOutage", "day", words, "asset")).toBe("1 Tag");
    expect(shown("restoreTime", "hours", words, "asset")).toBe("Stunden");
    expect(shown("restoreTimeUnknown", true, words, "asset")).toBe("Ja");
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
