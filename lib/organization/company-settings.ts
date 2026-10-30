import { z } from "zod";
import { getRegistrationPortals } from "@/lib/registration-portals";
import { companyUpdateSchema } from "@/schema/validators";
import { isoCountrySchema } from "./constants";

/** A country the walk names an authority for: the portal list the picker offers. */
const portalCountry = isoCountrySchema.refine(
  (code) => getRegistrationPortals().portals.some((p) => p.countryCode === code),
  "a country on the registration portal list",
);

/**
 * What an admin may change about the company (`assessment.updateCompany`), each field on its own.
 * Lengths, nullability and formats come from the company table's schema; only the country and the
 * BSI contact's address are narrower here.
 */
export const companySettingsSchema = companyUpdateSchema
  .pick({
    name: true,
    sector: true,
    entityType: true,
    legalForm: true,
    employeeCount: true,
    contactEmail: true,
    aiDataSharing: true,
    cisoName: true,
    cisoReportsTo: true,
    bsiContactName: true,
    bsiContactEmail: true,
    bsiContactPhone: true,
    bsiRegistrationId: true,
    annualSecurityBudget: true,
    primaryLocations: true,
  })
  .extend({
    // The table schema checks only its length (schema/validators.ts may not grow to say more).
    bsiContactEmail: z.string().email().max(255).nullish(),
    // Asked where the walk needs it, on the registration and reporting screens (CountryPicker).
    country: portalCountry.optional(),
  });
