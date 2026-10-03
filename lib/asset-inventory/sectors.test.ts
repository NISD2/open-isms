import { describe, expect, test } from "bun:test";
import { SECTORS } from "@/lib/organization/constants";
import { CATALOG } from "./catalog";
import { catalogueSectorsOf, SECTOR_BY_ID } from "./sectors";

describe("catalogueSectorsOf", () => {
  test("maps a profile's sector to the catalogue's name for it", () => {
    expect(catalogueSectorsOf("manufacturing")).toEqual(["manufacturing"]);
    expect(catalogueSectorsOf("waste_management")).toEqual(["waste-management"]);
    expect(catalogueSectorsOf("financial_market")).toEqual([
      "financial-market-infrastructure",
    ]);
  });

  test("public administration and unknown sectors see no sector entries", () => {
    expect(catalogueSectorsOf("public_administration")).toEqual([]);
    expect(catalogueSectorsOf("n/a")).toEqual([]);
  });

  test("every profile sector maps to a catalogue sector that exists", () => {
    for (const sector of SECTORS) {
      for (const id of catalogueSectorsOf(sector))
        expect(SECTOR_BY_ID.has(id)).toBe(true);
    }
  });

  test("every sector a catalogue entry is gated on is reachable from a profile", () => {
    const reachable = new Set(SECTORS.flatMap((s) => catalogueSectorsOf(s)));
    const gated = new Set(CATALOG.flatMap((item) => item.appliesToSectors ?? []));
    expect([...gated].filter((id) => !reachable.has(id))).toEqual([]);
  });
});
