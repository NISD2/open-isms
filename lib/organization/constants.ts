import { entityTypeEnum } from "@nisd2/grc-data-model/enums";

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
