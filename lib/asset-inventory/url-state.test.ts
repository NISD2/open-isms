import { describe, expect, test } from "bun:test";
import { outputToCsv } from "./csv-export";
import { decodeUrlState, encodeUrlState } from "./url-state";

/** A hash as someone else could build it: any JSON, not only what encodeUrlState writes. */
const hashOf = (value: unknown) =>
  Buffer.from(JSON.stringify(value)).toString("base64url");

describe("decodeUrlState", () => {
  test("round-trips what the tool writes", () => {
    const state = {
      sectors: ["energy"],
      checked: ["erp"],
      custom: [{ name: "Leitstand", layer: "it-system" as const }],
    };
    expect(decodeUrlState(encodeUrlState(state))).toEqual(state);
  });

  test("drops a custom asset whose layer is not a real layer", () => {
    const decoded = decodeUrlState(
      hashOf({
        x: [
          { n: "kept", l: "raum" },
          { n: "unknown layer", l: '=HYPERLINK("https://evil.invalid")' },
          { n: "inherited name", l: "constructor" },
          { n: "no layer" },
          { n: "number layer", l: 3 },
        ],
      }),
    );
    expect(decoded?.custom).toEqual([{ name: "kept", layer: "raum" }]);
  });
});

describe("outputToCsv", () => {
  test("a formula in a shared asset name is exported as text", () => {
    const csv = outputToCsv({
      geschaeftsprozesse: [],
      anwendungen: [],
      itSysteme: [
        {
          id: "S001",
          layer: "it-system",
          name: '=HYPERLINK("https://evil.invalid","Details")',
          category: "server",
          defaultExposure: "internal",
          source: null,
        },
      ],
      raeume: [],
      kommunikationsverbindungen: [],
    });
    expect(csv.split("\r\n")).toEqual([
      "id,name,layer,category,exposure,source",
      'S001,"\'=HYPERLINK(""https://evil.invalid"",""Details"")",it-system,server,internal,custom',
    ]);
  });
});
