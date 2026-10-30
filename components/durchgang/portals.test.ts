import { describe, expect, test } from "bun:test";
import { splitPortals } from "./portals";
import type { Registration } from "./view";

const portal = (countryCode: string) => ({
  countryCode,
  authority: `Authority ${countryCode}`,
  authorityUrl: null,
  csirt: null,
  portalName: null,
  portalUrl: null,
  status: "operational" as const,
});

const registration = (country: string | null): Registration => ({
  country,
  lastUpdated: "2026-10-01",
  portals: [portal("DE"), portal("AT"), portal("NL")],
});

const codes = (list: readonly { countryCode: string }[]) =>
  list.map((p) => p.countryCode);

describe("splitPortals", () => {
  test("takes the company's own country out to sit first, the rest by name", () => {
    const { own, others, all } = splitPortals(registration("NL"), "en");
    expect(own?.countryCode).toBe("NL");
    expect(codes(others)).toEqual(["AT", "DE"]);
    expect(codes(all)).toEqual(["AT", "DE", "NL"]);
  });

  test("sorts by the name in the reader's language", () => {
    // Österreich, Deutschland, Niederlande
    expect(codes(splitPortals(registration(null), "de").all)).toEqual(["DE", "NL", "AT"]);
  });

  // Without a country the screens ask for it (CountryPicker) instead of linking to a page
  // that has no country field.
  test("no country, or one the list does not hold, leaves no own country", () => {
    expect(splitPortals(registration(null), "en").own).toBeNull();
    expect(splitPortals(registration("US"), "en").own).toBeNull();
    expect(codes(splitPortals(registration("US"), "en").others)).toHaveLength(3);
  });
});
