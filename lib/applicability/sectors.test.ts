/**
 * The applicability check shows these names on a Czech page through a lookup that falls back to
 * English, so a missing Czech text would go unnoticed. The sector types demand `cs`; the special
 * cases are a literal list without a type, so this test is what holds them to it.
 */
import { describe, expect, test } from "bun:test";
import { SECTORS, SPECIAL_CASES } from "./sectors";

describe("Czech texts of the applicability check", () => {
  test("every special case has a Czech name and description", () => {
    const missing = SPECIAL_CASES.filter(
      (special) => !("cs" in special.name) || !("cs" in special.description),
    ).map((special) => special.id);
    expect(missing).toEqual([]);
  });

  test("no Czech sector text names German law or a German body", () => {
    const czech = [
      ...SECTORS.flatMap((sector) => [
        sector.name.cs,
        sector.description.cs,
        ...sector.subSectors.map((sub) => sub.name.cs),
      ]),
      ...SPECIAL_CASES.flatMap((special) => [special.name.cs, special.description.cs]),
    ];
    const german = czech.filter((text) =>
      ["BSIG", "BSI-KritisV", "KRITIS", "Bundes", "Deutschland", "Fraunhofer"].some(
        (word) => text.includes(word),
      ),
    );
    expect(german).toEqual([]);
  });
});
