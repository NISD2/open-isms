// Run with: bun examples/render-form.ts

import {
  supplierQuestionnaire,
  groupBySection,
  visibleFields,
} from "../src";

const response: Record<string, unknown> = {
  isSaas: true,
  isOnPrem: false,
  isProfessionalServices: false,
  isManagedService: false,
  hasSubprocessors: false,
};

const visible = visibleFields(supplierQuestionnaire, response);
const grouped = groupBySection({ ...supplierQuestionnaire, fields: visible });

console.log(`Showing ${visible.length} of ${supplierQuestionnaire.fields.length} fields based on response\n`);

for (const [section, fields] of grouped) {
  console.log(`# ${section.toUpperCase()} (${fields.length} fields)`);
  for (const f of fields) {
    const req = f.required ? " [required]" : "";
    console.log(`  - ${f.id} (${f.type})${req}`);
    console.log(`      EN: ${f.label.en}`);
    console.log(`      DE: ${f.label.de}`);
    console.log(`      Anchored to: ${f.legalBasis}`);
  }
  console.log();
}
