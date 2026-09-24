/**
 * The guided form's tables, held to the promises the design rests on. No database needed.
 *
 * These live here rather than beside each table because the two schema packages use different test
 * runners (grc-data-model runs vitest, isms-schema has no runner at all) and CI runs neither over
 * src/. `test:unit` covers this directory, so a test here actually runs.
 *
 * What they pin, and why each one is worth a test rather than a comment:
 *
 *   - a decision keys on company and control, never on the item, because the crosswalk is
 *     many-to-many and a shared control must carry ONE decision rather than two contradicting ones
 *   - a "no object" decision has somewhere to put the register the SERVER counted and the count it
 *     found, so that answer can never be a bare tick
 *   - an unmeasured critical-installation threshold defaults to unsettled, never to no, because
 *     status under § 28 Abs. 1 Nr. 1 BSIG arises by operation of law rather than by notice
 *   - control titles stay nullable while the BSI's licence for them is unread
 */
import { describe, expect, test } from "bun:test";
import { getTableConfig } from "drizzle-orm/pg-core";
import { addresseeEnum, controlGradeEnum } from "@nisd2/grc-data-model/enums";
import {
  baustein,
  control,
  requirement,
  requirementControl,
} from "@nisd2/grc-data-model/schema";
import {
  company,
  controlDecision,
  controlOutcomeEnum,
  settledFactEnum,
} from "@nisd2/isms-schema";

const columnsOf = (t: Parameters<typeof getTableConfig>[0]) =>
  getTableConfig(t).columns.map((c) => c.name);

const columnOf = (t: Parameters<typeof getTableConfig>[0], name: string) =>
  getTableConfig(t).columns.find((c) => c.name === name);

describe("the BSI content tables", () => {
  test("a Baustein is keyed by id and edition, so a decision can pin the edition it was made against", () => {
    const pk = getTableConfig(baustein).primaryKeys[0];
    expect(pk?.columns.map((c) => c.name)).toEqual(["id", "edition"]);
  });

  test("a Baustein records where its grades came from and whether the two sources agreed", () => {
    const names = columnsOf(baustein);
    for (const c of ["url", "source_sha256", "verified", "issues", "extracted_at"]) {
      expect(names).toContain(c);
    }
  });

  test("a control carries its grade, its number and whether the Baustein withdrew it", () => {
    const names = columnsOf(control);
    for (const c of ["grade", "number", "withdrawn", "baustein_id", "edition"]) {
      expect(names).toContain(c);
    }
  });

  test("titles are nullable in both tables, because the BSI's licence for them is unread", () => {
    expect(columnOf(baustein, "title")?.notNull).toBe(false);
    expect(columnOf(control, "title")?.notNull).toBe(false);
  });

  test("the grades are the BSI's three, in English, weakest last", () => {
    expect(controlGradeEnum.enumValues).toEqual(["required", "expected", "optional"]);
  });
});

describe("the crosswalk, which is the one editorial table", () => {
  test("it is many-to-many on requirement and control, so one control can serve several items", () => {
    const pk = getTableConfig(requirementControl).primaryKeys[0];
    expect(pk?.columns.map((c) => c.name)).toEqual([
      "requirement_id",
      "control_id",
      "edition",
    ]);
  });

  test("every row says where the mapping came from, and the default is honest", () => {
    const provenance = columnOf(requirementControl, "provenance");
    expect(provenance?.notNull).toBe(true);
    expect(provenance?.default).toBe("ours");
  });
});

describe("the addressee column on requirement", () => {
  test("it defaults to 'all', so adding it changes nothing for the existing items", () => {
    const addressee = columnOf(requirement, "addressee");
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

describe("a control decision", () => {
  const names = columnsOf(controlDecision);

  test("belongs to a company and a control, not to an item", () => {
    expect(names).toContain("company_id");
    expect(names).toContain("control_id");
    expect(names).toContain("edition");
    expect(names).not.toContain("requirement_id");
    expect(names).not.toContain("requirement_status_id");
  });

  test("carries the register and the count the server found, for a no-object decision", () => {
    for (const c of ["evidence_module", "evidence_count", "evidence_at"]) {
      expect(names).toContain(c);
    }
  });

  test("carries a reason for covered-another-way and the five factors for a justification", () => {
    expect(names).toContain("reason");
    expect(names).toContain("justification");
  });

  test("carries a date or a register for a deferral", () => {
    expect(names).toContain("deferred_until");
    expect(names).toContain("deferred_until_module");
  });

  test("records who decided and when, because this is the documentation § 30 Abs. 1 S. 3 asks for", () => {
    expect(columnOf(controlDecision, "decided_by")?.notNull).toBe(true);
    expect(columnOf(controlDecision, "decided_at")?.notNull).toBe(true);
  });

  test("supersedes is unique, so two concurrent writers cannot both replace the same decision", () => {
    const unique = getTableConfig(controlDecision).indexes.find(
      (i) => i.config.unique === true,
    );
    expect(unique?.config.columns.map((c) => ("name" in c ? c.name : ""))).toEqual([
      "supersedes",
    ]);
  });

  test("the outcomes are the five the BSI's own method and the statute allow", () => {
    expect(controlOutcomeEnum.enumValues).toEqual([
      "done",
      "no_object",
      "covered_otherwise",
      "justified",
      "deferred",
    ]);
  });
});

describe("the status facts on the company", () => {
  test("an unmeasured threshold defaults to unsettled, never to no", () => {
    const ci = columnOf(company, "critical_installation");
    expect(ci?.notNull).toBe(true);
    // "no" would switch off §§ 31 Abs. 2 and 39 Abs. 1 for an operator who has simply not measured.
    expect(ci?.default).toBe("unsettled");
  });

  test("service types are nullable, so unsettled and none stay different answers", () => {
    expect(columnOf(company, "service_types")?.notNull).toBe(false);
  });

  test("a settled fact has three values, with unsettled available", () => {
    expect(settledFactEnum.enumValues).toEqual(["yes", "no", "unsettled"]);
  });
});
