import { describe, expect, test } from "bun:test";
import { shownToReader } from "./answered";

const locations = {
  id: "dataProcessingLocations",
  conditions: [{ field: "processesCustomerData", equals: true }],
};

describe("shownToReader", () => {
  test("a question that applies is shown, answered or not", () => {
    expect(shownToReader(locations, { processesCustomerData: true })).toBe(true);
  });

  test("an answer given before the question it depends on existed stays visible", () => {
    expect(shownToReader(locations, { dataProcessingLocations: "DE" })).toBe(true);
  });

  test("an answer the supplier's other answers rule out is not shown", () => {
    expect(
      shownToReader(locations, {
        processesCustomerData: false,
        dataProcessingLocations: "DE",
      }),
    ).toBe(false);
  });

  test("an unanswered question whose condition is open is not shown", () => {
    expect(shownToReader(locations, {})).toBe(false);
  });

  test("an older answer stays while one of several conditions is still open", () => {
    // A supplier from before 4.0.0: the three service boxes at "no", the new reach questions
    // unanswered. Its ISMS answer was given and nothing it says rules the question out.
    const isms = {
      id: "hasIsms",
      conditions: [
        { field: "processesCustomerData", equals: true },
        { field: "accessesCustomerSystems", equals: true },
        { field: "isSaas", equals: true },
        { field: "isOnPrem", equals: true },
        { field: "isManagedService", equals: true },
      ],
    };
    const older = {
      isSaas: false,
      isOnPrem: false,
      isManagedService: false,
      hasIsms: true,
    };
    expect(shownToReader(isms, older)).toBe(true);
    expect(
      shownToReader(isms, {
        ...older,
        processesCustomerData: false,
        accessesCustomerSystems: false,
      }),
    ).toBe(false);
  });
});
