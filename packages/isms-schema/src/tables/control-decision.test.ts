/**
 * Schema tests for the control decision table. No database needed.
 *
 * They hold the two structural promises the guided form rests on: a decision belongs to a company
 * and a control rather than to an item, and every outcome that needs proof has somewhere to put it.
 */
import { describe, expect, test } from "bun:test";
import { getTableConfig } from "drizzle-orm/pg-core";
import { controlOutcomeEnum, settledFactEnum } from "../enums";
import { controlDecision } from "./control-decision";
import { company } from "./organization";

const cfg = getTableConfig(controlDecision);
const names = cfg.columns.map((c) => c.name);

describe("a control decision", () => {
  test("belongs to a company and a control, not to an item", () => {
    expect(names).toContain("company_id");
    expect(names).toContain("control_id");
    expect(names).toContain("edition");
    // Keying on the item would let one shared control carry two contradicting outcomes, because
    // the crosswalk is many-to-many.
    expect(names).not.toContain("requirement_id");
    expect(names).not.toContain("requirement_status_id");
  });

  test("carries the register and the count the SERVER found, for a no-object decision", () => {
    for (const c of ["evidence_module", "evidence_count", "evidence_at"])
      expect(names).toContain(c);
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
    const decidedBy = cfg.columns.find((c) => c.name === "decided_by");
    const decidedAt = cfg.columns.find((c) => c.name === "decided_at");
    expect(decidedBy?.notNull).toBe(true);
    expect(decidedAt?.notNull).toBe(true);
  });

  test("supersedes is unique, so two concurrent writers cannot both replace the same decision", () => {
    const unique = cfg.indexes.find((i) => i.config.unique === true);
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
  const companyColumns = getTableConfig(company).columns;

  test("an unmeasured threshold defaults to unsettled, never to no", () => {
    const ci = companyColumns.find((c) => c.name === "critical_installation");
    expect(ci?.notNull).toBe(true);
    // "no" would switch off §§ 31 Abs. 2 and 39 Abs. 1 for an operator who simply has not measured.
    expect(ci?.default).toBe("unsettled");
  });

  test("service types are nullable, so unsettled and none are different answers", () => {
    const st = companyColumns.find((c) => c.name === "service_types");
    expect(st?.notNull).toBe(false);
  });

  test("a settled fact has three values, with unsettled last and available", () => {
    expect(settledFactEnum.enumValues).toEqual(["yes", "no", "unsettled"]);
  });
});
