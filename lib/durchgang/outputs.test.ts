/**
 * The approval page names what the walk produces from these lists. Every entry needs its words in
 * every language the pricing page has, or the page would show a raw key.
 */
import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { recordOf, WALK_DOCUMENTS, WALK_RECORDS } from "./outputs";
import { POLICY_TEMPLATES } from "./types";

const PRICING = join(import.meta.dir, "../../messages/pricing");

type Outputs = {
  readonly documents: Record<string, string>;
  readonly records: Record<string, string>;
};

const outputsIn = (file: string): Outputs =>
  JSON.parse(readFileSync(join(PRICING, file), "utf8")).pricing.approval.outputs;

describe("walk outputs", () => {
  test("every policy the walk writes is a document, and nothing else is", () => {
    expect([...WALK_DOCUMENTS].sort()).toEqual([...POLICY_TEMPLATES].sort());
  });

  test("the management approval is a record", () => {
    expect(WALK_RECORDS).toContain("approvals");
    expect(recordOf({ kind: "approve", id: "approve" })).toBe("approvals");
  });

  for (const file of readdirSync(PRICING).filter((f) => f.endsWith(".json"))) {
    test(`${file} names every document and record`, () => {
      const outputs = outputsIn(file);
      for (const key of WALK_DOCUMENTS) expect(outputs.documents[key]).toBeTruthy();
      for (const key of WALK_RECORDS) expect(outputs.records[key]).toBeTruthy();
    });
  }
});
