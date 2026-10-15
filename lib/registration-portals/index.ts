import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { RegistrationPortal, RegistrationPortalsData } from "./schema";
import { registrationPortalsDataSchema } from "./schema";

/**
 * The portals, for a Czech page with the Czech gloss of each authority and act where the data
 * has one. Every other page, and every caller that passes no locale, gets the data as written.
 */
export function getRegistrationPortals(locale?: string): RegistrationPortalsData {
  const filePath = join(process.cwd(), "data", "nis2-registration-portals.json");
  const raw = JSON.parse(readFileSync(filePath, "utf-8"));
  const data = registrationPortalsDataSchema.parse(raw);
  return locale === "cs" ? { ...data, portals: data.portals.map(inCzech) } : data;
}

const inCzech = (portal: RegistrationPortal): RegistrationPortal => ({
  ...portal,
  authority: portal.authorityCs ?? portal.authority,
  nationalLaw: portal.nationalLawCs ?? portal.nationalLaw,
});

/**
 * Whether the national NIS 2 transposition is in force, still in the
 * legislative pipeline, or absent. Derived purely from
 * `portal.entryIntoForce` + `portal.status` so the tracker UI and the
 * applicability callout never disagree.
 */
export type TranspositionStatus = "in-force" | "bill-pending" | "drafting" | "unknown";

export function getTranspositionStatus(
  portal: RegistrationPortal,
  today: Date = new Date(),
): TranspositionStatus {
  if (portal.entryIntoForce) {
    const eif = new Date(portal.entryIntoForce);
    if (Number.isNaN(eif.getTime())) return "unknown";
    return eif.getTime() <= today.getTime() ? "in-force" : "bill-pending";
  }
  if (portal.status === "not-yet-available") return "drafting";
  // pre-registration / planned with no entryIntoForce date → bill exists
  // but no in-force date set yet
  return "bill-pending";
}

export type {
  PortalStatus,
  RegistrationPortal,
  RegistrationPortalsData,
} from "./schema";
export {
  portalStatus,
  registrationPortalSchema,
  registrationPortalsDataSchema,
} from "./schema";
