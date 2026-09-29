import { createHash } from "node:crypto";
import type { CloseFieldValues } from "./fields";

/**
 * What was last written for a person, as one value: any change to a value, or to
 * the set of fields configured, changes it. Entries keep the registry's order.
 */
export const fingerprint = (fields: CloseFieldValues): string =>
  createHash("sha256")
    .update(JSON.stringify([Object.entries(fields.contact), Object.entries(fields.lead)]))
    .digest("hex");
