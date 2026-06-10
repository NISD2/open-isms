import { describe, test, expect } from "bun:test";
import { classify, computeSize } from "./classify";

// ─── computeSize ──────────────────────────────────────────────

describe("computeSize", () => {
  test("large by employee count (>= 250)", () => {
    expect(computeSize({ employees: 250, turnover: 0, balanceSheet: 0 })).toBe("large");
    expect(computeSize({ employees: 2500, turnover: 0, balanceSheet: 0 })).toBe("large");
  });

  test("large by financials (turnover > 50M AND balance > 43M)", () => {
    expect(computeSize({ employees: 10, turnover: 51, balanceSheet: 44 })).toBe("large");
  });

  test("not large if only turnover exceeds (need BOTH)", () => {
    expect(computeSize({ employees: 10, turnover: 100, balanceSheet: 40 })).toBe("medium");
  });

  test("not large if only balance exceeds (need BOTH)", () => {
    expect(computeSize({ employees: 10, turnover: 30, balanceSheet: 100 })).toBe("medium");
  });

  test("medium by employee count (>= 50)", () => {
    expect(computeSize({ employees: 50, turnover: 0, balanceSheet: 0 })).toBe("medium");
    expect(computeSize({ employees: 120, turnover: 0, balanceSheet: 0 })).toBe("medium");
  });

  test("medium by financials (turnover > 10M AND balance > 10M)", () => {
    expect(computeSize({ employees: 5, turnover: 11, balanceSheet: 11 })).toBe("medium");
  });

  test("not medium if only turnover exceeds (need BOTH)", () => {
    expect(computeSize({ employees: 10, turnover: 50, balanceSheet: 5 })).toBe("small");
  });

  test("small below all thresholds", () => {
    expect(computeSize({ employees: 30, turnover: 5, balanceSheet: 5 })).toBe("small");
    expect(computeSize({ employees: 49, turnover: 10, balanceSheet: 10 })).toBe("small");
  });

  test("boundary: exactly 50 employees is medium", () => {
    expect(computeSize({ employees: 50, turnover: 0, balanceSheet: 0 })).toBe("medium");
  });

  test("boundary: 49 employees with insufficient financials is small", () => {
    expect(computeSize({ employees: 49, turnover: 10, balanceSheet: 10 })).toBe("small");
  });

  test("boundary: turnover and balance exactly at 10M is NOT medium (need >10M)", () => {
    expect(computeSize({ employees: 10, turnover: 10, balanceSheet: 10 })).toBe("small");
  });

  test("employee count OR financials — either triggers", () => {
    // 249 employees but large financials → large
    expect(computeSize({ employees: 249, turnover: 60, balanceSheet: 50 })).toBe("large");
    // 300 employees but tiny financials → large (employee count alone)
    expect(computeSize({ employees: 300, turnover: 1, balanceSheet: 1 })).toBe("large");
  });
});

// ─── classify ─────────────────────────────────────────────────

describe("classify", () => {
  // Helper for sector input
  const annexI = (id: string) => ({ sectorId: id, annex: "I" as const });
  const annexII = (id: string) => ({ sectorId: id, annex: "II" as const });

  describe("excluded entities", () => {
    test("excluded → not_in_scope", () => {
      const result = classify({ excluded: true, sectors: [], specialCases: [] });
      expect(result.classification).toBe("not_in_scope");
      expect(result.reason).toBe("excluded");
    });
  });

  describe("no sector", () => {
    test("no sector selected → not_in_scope", () => {
      const result = classify({ excluded: false, sectors: [], specialCases: [] });
      expect(result.classification).toBe("not_in_scope");
      expect(result.reason).toBe("no_sector");
    });
  });

  describe("below size threshold", () => {
    test("small company in Annex I sector → not_in_scope", () => {
      const result = classify({
        excluded: false,
        sectors: [annexI("energy")],
        specialCases: [],
        size: "small",
      });
      expect(result.classification).toBe("not_in_scope");
      expect(result.reason).toBe("below_threshold");
    });

    test("small company in Annex II sector → not_in_scope", () => {
      const result = classify({
        excluded: false,
        sectors: [annexII("manufacturing")],
        specialCases: [],
        size: "small",
      });
      expect(result.classification).toBe("not_in_scope");
      expect(result.reason).toBe("below_threshold");
    });
  });

  describe("special cases (size-independent)", () => {
    test("KRITIS operator → kritis", () => {
      const result = classify({
        excluded: false,
        sectors: [annexI("energy")],
        specialCases: ["kritis"],
      });
      expect(result.classification).toBe("kritis");
      expect(result.reason).toBe("special_case");
      expect(result.supervision).toBe("proactive");
      expect(result.penaltyCeiling?.amount).toBe("EUR 10,000,000");
    });

    test("qTSP → besonders_wichtig", () => {
      const result = classify({
        excluded: false,
        sectors: [annexI("digital_infrastructure")],
        specialCases: ["qtsp"],
      });
      expect(result.classification).toBe("essential");
      expect(result.reason).toBe("special_case");
    });

    test("DNS provider → besonders_wichtig", () => {
      const result = classify({
        excluded: false,
        sectors: [annexI("digital_infrastructure")],
        specialCases: ["dns_provider"],
      });
      expect(result.classification).toBe("essential");
    });

    test("TLD registry → besonders_wichtig", () => {
      const result = classify({
        excluded: false,
        sectors: [annexI("digital_infrastructure")],
        specialCases: ["tld_registry"],
      });
      expect(result.classification).toBe("essential");
    });

    test("sole provider → besonders_wichtig", () => {
      const result = classify({
        excluded: false,
        sectors: [annexI("energy")],
        specialCases: ["sole_provider"],
      });
      expect(result.classification).toBe("essential");
    });

    test("OES legacy → besonders_wichtig", () => {
      const result = classify({
        excluded: false,
        sectors: [annexI("drinking_water")],
        specialCases: ["oes_legacy"],
      });
      expect(result.classification).toBe("essential");
    });

    test("special case with no size → still classified", () => {
      const result = classify({
        excluded: false,
        sectors: [annexI("digital_infrastructure")],
        specialCases: ["dns_provider"],
        // no size provided
      });
      expect(result.classification).toBe("essential");
    });

    test("KRITIS + other special case → kritis wins", () => {
      const result = classify({
        excluded: false,
        sectors: [annexI("energy")],
        specialCases: ["kritis", "sole_provider"],
      });
      expect(result.classification).toBe("kritis");
    });

    test("medium telecom provider → essential (Art 3(1)(c))", () => {
      const result = classify({
        excluded: false,
        sectors: [annexI("digital_infrastructure")],
        specialCases: ["telecom_provider"],
        size: "medium",
      });
      expect(result.classification).toBe("essential");
      expect(result.reason).toBe("special_case");
      expect(result.penaltyCeiling?.amount).toBe("EUR 10,000,000");
      expect(result.supervision).toBe("proactive");
    });

    test("large telecom provider → essential", () => {
      const result = classify({
        excluded: false,
        sectors: [annexI("digital_infrastructure")],
        specialCases: ["telecom_provider"],
        size: "large",
      });
      expect(result.classification).toBe("essential");
    });

    test("small telecom provider → important (Art 2(2)(a)(i))", () => {
      const result = classify({
        excluded: false,
        sectors: [annexI("digital_infrastructure")],
        specialCases: ["telecom_provider"],
        size: "small",
      });
      expect(result.classification).toBe("important");
      expect(result.reason).toBe("special_case");
      expect(result.penaltyCeiling?.amount).toBe("EUR 7,000,000");
      expect(result.supervision).toBe("reactive");
    });

    test("non-qualified TSP → important regardless of size (Art 2(2)(a)(ii))", () => {
      const result = classify({
        excluded: false,
        sectors: [annexI("digital_infrastructure")],
        specialCases: ["non_qualified_tsp"],
      });
      expect(result.classification).toBe("important");
      expect(result.reason).toBe("special_case");
    });

    test("domain registrar → important regardless of size (Art 2(4))", () => {
      const result = classify({
        excluded: false,
        sectors: [annexI("digital_infrastructure")],
        specialCases: ["domain_registrar"],
      });
      expect(result.classification).toBe("important");
      expect(result.reason).toBe("special_case");
    });

    test("telecom + qTSP → essential wins (qTSP always essential)", () => {
      const result = classify({
        excluded: false,
        sectors: [annexI("digital_infrastructure")],
        specialCases: ["telecom_provider", "qtsp"],
        size: "small",
      });
      expect(result.classification).toBe("essential");
    });
  });

  describe("size + sector classification", () => {
    test("large + Annex I → besonders_wichtig", () => {
      const result = classify({
        excluded: false,
        sectors: [annexI("energy")],
        specialCases: [],
        size: "large",
      });
      expect(result.classification).toBe("essential");
      expect(result.reason).toBe("size_and_sector");
      expect(result.supervision).toBe("proactive");
      expect(result.penaltyCeiling?.amount).toBe("EUR 10,000,000");
      expect(result.penaltyCeiling?.turnoverPercent).toBe("2%");
    });

    test("medium + Annex I → wichtig", () => {
      const result = classify({
        excluded: false,
        sectors: [annexI("health")],
        specialCases: [],
        size: "medium",
      });
      expect(result.classification).toBe("important");
      expect(result.supervision).toBe("reactive");
      expect(result.penaltyCeiling?.amount).toBe("EUR 7,000,000");
      expect(result.penaltyCeiling?.turnoverPercent).toBe("1.4%");
    });

    test("large + Annex II → wichtig (NOT besonders_wichtig)", () => {
      const result = classify({
        excluded: false,
        sectors: [annexII("manufacturing")],
        specialCases: [],
        size: "large",
      });
      expect(result.classification).toBe("important");
      expect(result.reason).toBe("size_and_sector");
    });

    test("medium + Annex II → wichtig", () => {
      const result = classify({
        excluded: false,
        sectors: [annexII("chemicals")],
        specialCases: [],
        size: "medium",
      });
      expect(result.classification).toBe("important");
    });

    test("large + both Annexes → besonders_wichtig (Annex I wins)", () => {
      const result = classify({
        excluded: false,
        sectors: [annexI("energy"), annexII("manufacturing")],
        specialCases: [],
        size: "large",
      });
      expect(result.classification).toBe("essential");
      expect(result.annexes).toContain("I");
      expect(result.annexes).toContain("II");
    });

    test("medium + both Annexes → wichtig", () => {
      const result = classify({
        excluded: false,
        sectors: [annexI("transport"), annexII("food")],
        specialCases: [],
        size: "medium",
      });
      expect(result.classification).toBe("important");
    });
  });

  // ─── Real-world examples from thresholds.md ──────────────────

  describe("real-world examples", () => {
    test("Example 1: Mid-size manufacturing (120 emp, Annex II) → wichtig", () => {
      const size = computeSize({ employees: 120, turnover: 25, balanceSheet: 18 });
      expect(size).toBe("medium");
      const result = classify({
        excluded: false,
        sectors: [annexII("manufacturing")],
        specialCases: [],
        size,
      });
      expect(result.classification).toBe("important");
      expect(result.penaltyCeiling?.amount).toBe("EUR 7,000,000");
    });

    test("Example 2: Large energy utility (2500 emp, KRITIS) → kritis", () => {
      const size = computeSize({ employees: 2500, turnover: 800, balanceSheet: 500 });
      expect(size).toBe("large");
      const result = classify({
        excluded: false,
        sectors: [annexI("energy")],
        specialCases: ["kritis"],
        size,
      });
      expect(result.classification).toBe("kritis");
    });

    test("Example 3: Small MSSP (30 emp, 5M turnover) → not_in_scope", () => {
      const size = computeSize({ employees: 30, turnover: 5, balanceSheet: 3 });
      expect(size).toBe("small");
      const result = classify({
        excluded: false,
        sectors: [annexI("ict_service_management")],
        specialCases: [],
        size,
      });
      expect(result.classification).toBe("not_in_scope");
      expect(result.reason).toBe("below_threshold");
    });

    test("Example 4: Cloud provider subsidiary (group-level large, Annex I) → besonders_wichtig", () => {
      // Group level: 50,000 employees → large
      const size = computeSize({ employees: 50000, turnover: 30000, balanceSheet: 20000 });
      expect(size).toBe("large");
      const result = classify({
        excluded: false,
        sectors: [annexI("digital_infrastructure")],
        specialCases: [],
        size,
      });
      expect(result.classification).toBe("essential");
    });

    test("Example 5: Tiny DNS provider (3 emp, special case) → besonders_wichtig", () => {
      const result = classify({
        excluded: false,
        sectors: [annexI("digital_infrastructure")],
        specialCases: ["dns_provider"],
        // Size irrelevant for DNS providers
      });
      expect(result.classification).toBe("essential");
    });

    test("Example 6: Regional hospital (400 emp, Annex I health) → besonders_wichtig", () => {
      const size = computeSize({ employees: 400, turnover: 60, balanceSheet: 45 });
      expect(size).toBe("large");
      const result = classify({
        excluded: false,
        sectors: [annexI("health")],
        specialCases: [],
        size,
      });
      expect(result.classification).toBe("essential");
    });

    test("Example 7: Automotive supplier (600 emp, Annex II) → wichtig", () => {
      const size = computeSize({ employees: 600, turnover: 120, balanceSheet: 80 });
      expect(size).toBe("large");
      const result = classify({
        excluded: false,
        sectors: [annexII("manufacturing")],
        specialCases: [],
        size,
      });
      expect(result.classification).toBe("important");
    });

    test("Example 8: Law firm (200 emp, no NIS2 sector) → not_in_scope", () => {
      const result = classify({
        excluded: false,
        sectors: [],
        specialCases: [],
        size: "medium",
      });
      expect(result.classification).toBe("not_in_scope");
      expect(result.reason).toBe("no_sector");
    });

    test("Example 9: Chemical distributor (55 emp, Annex II) → wichtig", () => {
      const size = computeSize({ employees: 55, turnover: 80, balanceSheet: 12 });
      expect(size).toBe("medium");
      const result = classify({
        excluded: false,
        sectors: [annexII("chemicals")],
        specialCases: [],
        size,
      });
      expect(result.classification).toBe("important");
    });

    test("Example 10: Financial institution with DORA (1000 emp, Annex I banking) → besonders_wichtig", () => {
      const size = computeSize({ employees: 1000, turnover: 500, balanceSheet: 400 });
      expect(size).toBe("large");
      const result = classify({
        excluded: false,
        sectors: [annexI("banking")],
        specialCases: [],
        size,
      });
      expect(result.classification).toBe("essential");
    });
  });
});
