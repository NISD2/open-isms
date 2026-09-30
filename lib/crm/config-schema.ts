/**
 * The Close settings, as a slice of the environment schema (lib/env.ts), read and
 * normalised once when the environment loads.
 *
 * Nothing here can fail validation: a wrong Close setting switches a field or the
 * sync off, it never stops the application starting. A key that names no field,
 * or a CLOSE_FIELD_IDS that is not a JSON object, is dropped with one warning.
 */
import { z } from "zod";
import { trimmed } from "@/lib/env-value";
import { CLOSE_FIELD_KEYS, type CloseFieldIds } from "./fields";

const CONFIGURABLE = new Set<string>([...CLOSE_FIELD_KEYS, "leadSource"]);

const parseJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
};

const parseFieldIds = (v: unknown): CloseFieldIds => {
  const raw = trimmed(v);
  if (typeof raw !== "string") return {};
  const parsed = parseJson(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    console.warn("[close] CLOSE_FIELD_IDS is not a JSON object; no fields are synced");
    return {};
  }
  const entries = Object.entries(parsed);
  const unknown = entries.filter(([key]) => !CONFIGURABLE.has(key)).map(([key]) => key);
  if (unknown.length > 0) {
    console.warn(
      `[close] CLOSE_FIELD_IDS names no such field, ignored: ${unknown.join(", ")}`,
    );
  }
  return Object.fromEntries(
    entries.flatMap(([key, id]) =>
      CONFIGURABLE.has(key) && typeof id === "string" && id.trim()
        ? [[key, id.trim()]]
        : [],
    ),
  );
};

const optional = z.preprocess(trimmed, z.string().optional());

export const closeEnvShape = {
  CLOSE_API_KEY: optional,
  /** Lead status for a lead the sync creates, e.g. "Platform user". Unset: Close's first status. */
  CLOSE_SIGNUP_STATUS_ID: optional,
  /**
   * Lead status sales sets when someone objected to contact, e.g. "Suppressed".
   * Everyone on such a lead gets all optional platform email switched off.
   */
  CLOSE_SUPPRESSED_STATUS_ID: optional,
  /** JSON object, field key to Close custom field id, e.g. {"grandfathered":"cf_…"}. */
  CLOSE_FIELD_IDS: z.preprocess(parseFieldIds, z.custom<CloseFieldIds>()),
};
