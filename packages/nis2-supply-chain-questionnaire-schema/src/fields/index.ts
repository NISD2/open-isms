// Combined source-of-truth field list for the supplier questionnaire.
// Edit src/fields/<section>.ts and run `bun run build:json` to update
// the published JSON artefact at data/supply-chain-questionnaire.json.

import type { SupplierField } from "../schema";
import { gdprFields } from "./gdpr";
import { onPremTechnicalFields } from "./on-prem-technical";
import { profileFields } from "./profile";
import { saasTechnicalFields } from "./saas-technical";
import { securityPracticesFields } from "./security-practices";

export const allFields: SupplierField[] = [
  ...profileFields,
  ...securityPracticesFields,
  ...gdprFields,
  ...saasTechnicalFields,
  ...onPremTechnicalFields,
];
