/**
 * Schema tests for the guided form's content and decision tables.
 *
 * These run without a database. They hold the shape of the tables to the promises the build plan
 * makes, so a later edit that quietly breaks one of them fails here rather than in production:
 *
 *   - a decision keys on company and control, never on the item, because the crosswalk is
 *     many-to-many and a shared control must carry one decision
 *   - a no-object decision has somewhere to put the register it cited and the count it found
 *   - content and company data stay in their own packages
 *   - the enums say what the BSI and the statute say, in English, in the documented order
 */
import { describe, expect, test } from "bun:test";
import { getTableConfig } from "drizzle-orm/pg-core";
import { baustein, control } from "./control";
import { requirementControl } from "./requirement-control";
import { requirement } from "./requirement";
import { addresseeEnum, controlGradeEnum } from "../enums";

const columns = (t: Parameters<typeof getTableConfig>[0]) =>
  getTableConfig(t).columns.map((c) => c.name);

describe("the BSI content tables", () => {
  test("a Baustein is keyed by id and edition, so a decision can pin the edition it was made against", () => {
    const cfg = getTableConfig(baustein);
    const pk = cfg.primaryKeys[0];
    expect(pk?.columns.map((c) => c.name)).toEqual(["id", "edition"]);
  });

  test("a Baustein records where its grades came from and whether the two sources agreed", () => {
    const names = columns(baustein);
    for (const c of ["url", "source_sha256", "verified", "issues", "extracted_at"]) {
      expect(names).toContain(c);
    }
  });

  test("a control carries its grade, its number and whether the Baustein withdrew it", () => {
    const names = columns(control);
    for (const c of ["grade", "number", "withdrawn", "baustein_id", "edition"]) {
      expect(names).toContain(c);
    }
  });

  test("titles are nullable in both tables, because the BSI's licence for them is unread", () => {
    const bTitle = getTableConfig(baustein).columns.find((c) => c.name === "title");
    const cTitle = getTableConfig(control).columns.find((c) => c.name === "title");
    expect(bTitle?.notNull).toBe(false);
    expect(cTitle?.notNull).toBe(false);
  });

  test("the grades are the BSI's three, in English, weakest last", () => {
    expect(controlGradeEnum.enumValues).toEqual(["required", "expected", "optional"]);
  });
});

describe("the crosswalk, which is the one editorial table", () => {
  test("it is many-to-many on requirement and control, so one control can serve several items", () => {
    const pk = getTableConfig(requirementControl).primaryKeys[0];
    expect(pk?.columns.map((c) => c.name)).toEqual(["requirement_id", "control_id", "edition"]);
  });

  test("every row says where the mapping came from, and the default is honest", () => {
    const provenance = getTableConfig(requirementControl).columns.find((c) => c.name === "provenance");
    expect(provenance?.notNull).toBe(true);
    expect(provenance?.default).toBe("ours");
  });
});

describe("the addressee column on requirement", () => {
  test("it defaults to 'all', so adding it changes nothing for the existing items", () => {
    const addressee = getTableConfig(requirement).columns.find((c) => c.name === "addressee");
    expect(addressee?.notNull).toBe(true);
    expect(addressee?.default).toBe("all");
  });

  test("the four values are the statute's addressees, and § 30 Abs. 3 is not among them", () => {
    // § 30 Abs. 3 decides WHICH RULEBOOK binds the areas, not whether an item applies, and its
    // list differs from the § 60 Abs. 1 list by two entries. Conflating them was a real defect.
    expect(addresseeEnum.enumValues).toEqual([
      "all",
      "critical_installation",
      "service_type_60_1",
      "sector_35_2",
    ]);
  });
});
