import { z } from "zod";
import { ENTITY_TYPES, isoCountrySchema } from "./constants";

/** What an admin may change about the company (`assessment.updateCompany`), each field on its own. */
export const companySettingsSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  sector: z.string().min(1).max(255).optional(),
  entityType: z.enum(ENTITY_TYPES).optional(),
  legalForm: z.string().max(100).nullish(),
  employeeCount: z.number().int().positive().nullish(),
  contactEmail: z.string().email().nullish(),
  aiDataSharing: z.enum(["none", "basic", "full"]).optional(),
  cisoName: z.string().max(255).nullish(),
  cisoReportsTo: z.string().max(255).nullish(),
  bsiContactName: z.string().max(255).nullish(),
  bsiContactEmail: z.string().email().nullish(),
  bsiContactPhone: z.string().max(50).nullish(),
  bsiRegistrationId: z.string().max(100).nullish(),
  annualSecurityBudget: z.string().nullish(),
  primaryLocations: z.string().max(1000).nullish(),
  // Asked where the walk needs it, on the registration and reporting screens (CountryPicker).
  country: isoCountrySchema.optional(),
});
