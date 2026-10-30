import { aiDataSharingEnum } from "@nisd2/isms-schema/enums";
import { z } from "zod";
import { getRegistrationPortals } from "@/lib/registration-portals";
import { ENTITY_TYPES, isoCountrySchema } from "./constants";

/** A country the walk names an authority for: the portal list the picker offers. */
const portalCountry = isoCountrySchema.refine(
  (code) => getRegistrationPortals().portals.some((p) => p.countryCode === code),
  "a country on the registration portal list",
);

/** What an admin may change about the company (`assessment.updateCompany`), each field on its own. */
export const companySettingsSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  sector: z.string().min(1).max(255).optional(),
  entityType: z.enum(ENTITY_TYPES).optional(),
  legalForm: z.string().max(100).nullish(),
  employeeCount: z.number().int().positive().nullish(),
  contactEmail: z.string().email().nullish(),
  aiDataSharing: z.enum(aiDataSharingEnum.enumValues).optional(),
  cisoName: z.string().max(255).nullish(),
  cisoReportsTo: z.string().max(255).nullish(),
  bsiContactName: z.string().max(255).nullish(),
  bsiContactEmail: z.string().email().nullish(),
  bsiContactPhone: z.string().max(50).nullish(),
  bsiRegistrationId: z.string().max(100).nullish(),
  annualSecurityBudget: z.string().nullish(),
  primaryLocations: z.string().max(1000).nullish(),
  // Asked where the walk needs it, on the registration and reporting screens (CountryPicker).
  country: portalCountry.optional(),
});
