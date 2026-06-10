import { readFileSync } from "fs";
import { join } from "path";
import { registrationPortalsDataSchema } from "./schema";
import type { RegistrationPortal, RegistrationPortalsData } from "./schema";

export function getRegistrationPortals(): RegistrationPortalsData {
  const filePath = join(process.cwd(), "data", "nis2-registration-portals.json");
  const raw = JSON.parse(readFileSync(filePath, "utf-8"));
  return registrationPortalsDataSchema.parse(raw);
}

/**
 * Whether the national NIS 2 transposition is in force, still in the
 * legislative pipeline, or absent. Derived purely from
 * `portal.entryIntoForce` + `portal.status` so the tracker UI and the
 * applicability callout never disagree.
 */
export type TranspositionStatus =
  | "in-force"
  | "bill-pending"
  | "drafting"
  | "unknown";

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

export {
  portalStatus,
  registrationPortalSchema,
  registrationPortalsDataSchema,
} from "./schema";

export type {
  PortalStatus,
  RegistrationPortal,
  RegistrationPortalsData,
} from "./schema";
