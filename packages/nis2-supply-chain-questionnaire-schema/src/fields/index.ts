// Combined source-of-truth field list for the supplier questionnaire.
// Edit src/fields/<section>.ts and run `bun run build:json` to update
// the published JSON artefact at data/supply-chain-questionnaire.json.

import { profileFields } from "./profile";
import { securityPracticesFields } from "./security-practices";
import { saasTechnicalFields } from "./saas-technical";
import { onPremTechnicalFields } from "./on-prem-technical";
import { proServicesFields } from "./pro-services";
import { managedServicesFields } from "./managed-services";
import type { SupplierField } from "../schema";

export const allFields: SupplierField[] = [
  ...profileFields,
  ...securityPracticesFields,
  ...saasTechnicalFields,
  ...onPremTechnicalFields,
  ...proServicesFields,
  ...managedServicesFields,
];
