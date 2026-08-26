/**
 * Machine-derived e2e coverage accounting: for each of the 49 NIS2
 * requirements, what the walker classification says, and whether any
 * current e2e layer exercises it. Run: bun e2e/coverage-report.ts
 */
import {
  nis2Categories,
  getNis2RequirementsForCategory,
} from "@nisd2/grc-data-model/frameworks";
import { REQUIREMENT_FIELD_MAP } from "@/lib/compliance/requirement-fields";
import {
  classifyRequirement,
  UI_CUSTOM_EDITORS,
} from "./lib/walker-classification";

type Row = {
  code: string;
  title: string;
  kind: string;
  moduleRef: string | null;
  intakeTested: boolean;
  moduleTested: boolean;
  editorTested: boolean;
};

// What the CURRENT suite actually drives:
const INTAKE_TESTED = new Set(
  Object.keys(REQUIREMENT_FIELD_MAP).filter((c) => !UI_CUSTOM_EDITORS.has(c)),
);
// l1/assets.spec.ts + the l2 module sweep create real records in these.
const MODULES_TESTED = new Set([
  "asset",
  "policy",
  "incident",
  "exercise",
  "improvement_item",
  "vulnerability",
  "patch_record",
  "change_request",
  "kpi_measurement",
  "internal_audit",
  "management_review",
]);
// l2/editors.spec.ts drives every custom editor, so the set IS the custom-
// editor registry — derive it rather than restate the nine codes a third time.
// NOTE: "tested" here means the editor's page was driven and persisted, not
// that every structured sub-table (algorithm/criteria rows) was exercised;
// those inner surfaces remain a partial gap.
const EDITORS_TESTED = UI_CUSTOM_EDITORS;

const rows: Row[] = [...nis2Categories]
  .sort((a, b) => a.sortOrder - b.sortOrder)
  .flatMap((cat) =>
    getNis2RequirementsForCategory(cat.slug).map((r) => ({
      code: r.code,
      title: r.legalRef,
      kind: classifyRequirement(r.code, r.moduleRef ?? null),
      moduleRef: r.moduleRef ?? null,
      intakeTested: INTAKE_TESTED.has(r.code),
      moduleTested: r.moduleRef ? MODULES_TESTED.has(r.moduleRef) : false,
      editorTested: EDITORS_TESTED.has(r.code),
    })),
  );

const covered = rows.filter((r) => r.intakeTested || r.moduleTested || r.editorTested);
const partial = covered.filter(
  (r) => (r.kind === "module" || r.kind === "custom-editor") && !r.moduleTested && !r.editorTested,
);
const untouched = rows.filter((r) => !r.intakeTested && !r.moduleTested && !r.editorTested);

console.log(`Total requirements: ${rows.length}`);
console.log(`Touched by any e2e layer: ${covered.length}`);
console.log(`  of which only their intake fields (primary surface untested): ${partial.length}`);
console.log(`Completely untouched: ${untouched.length}`);
console.log("\n== Completely untouched ==");
for (const r of untouched) {
  console.log(`  ${r.code} [${r.kind}${r.moduleRef ? `:${r.moduleRef}` : ""}] ${r.title}`);
}
console.log("\n== Intake tested but primary surface (editor/module) untested ==");
for (const r of partial) {
  console.log(`  ${r.code} [${r.kind}${r.moduleRef ? `:${r.moduleRef}` : ""}] ${r.title}`);
}
