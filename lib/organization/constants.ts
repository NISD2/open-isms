import { entityTypeEnum } from "@nisd2/grc-data-model/enums";
import { z } from "zod";

/** A country as `company.country` stores it, and the registration portal list is keyed by. */
export const isoCountrySchema = z
  .string()
  .length(2)
  .regex(/^[A-Z]{2}$/, "ISO 3166-1 alpha-2");

/** How § 28 BSIG can class a company, as the database stores it. */
export const ENTITY_TYPES = entityTypeEnum.enumValues;
export type EntityType = (typeof ENTITY_TYPES)[number];

export const SECTORS = [
  "energy",
  "transport",
  "banking",
  "financial_market",
  "health",
  "drinking_water",
  "waste_water",
  "digital_infrastructure",
  "ict_service_management",
  "public_administration",
  "space",
  "postal_courier",
  "waste_management",
  "chemicals",
  "food",
  "manufacturing",
  "digital_providers",
  "research",
] as const;
