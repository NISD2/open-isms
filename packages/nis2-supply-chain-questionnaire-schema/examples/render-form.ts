// Run with: bun examples/render-form.ts

import { groupBySection, supplierQuestionnaire, visibleFields } from "../src";

const response: Record<string, unknown> = {
  isSaas: true,
  isOnPrem: false,
  isManagedService: false,
  processesCustomerData: true,
  accessesCustomerSystems: false,
  accessesCustomerPremises: false,
  hasSubprocessors: false,
};

const visible = visibleFields(supplierQuestionnaire, response);
const grouped = groupBySection({ ...supplierQuestionnaire, fields: visible });

console.log(
  `Showing ${visible.length} of ${supplierQuestionnaire.fields.length} fields based on response\n`,
);

for (const [section, fields] of grouped) {
  console.log(`# ${section.toUpperCase()} (${fields.length} fields)`);
  for (const f of fields) {
    const req = f.required ? " [required]" : "";
    console.log(`  - ${f.id} (${f.type})${req}`);
    console.log(`      EN: ${f.label.en}`);
    console.log(`      DE: ${f.label.de}`);
    console.log(`      Anchored to: ${f.legalBasis}`);
    if (f.iso27001) console.log(`      ISO/IEC 27001:2022: ${f.iso27001.join(", ")}`);
  }
  console.log();
}
