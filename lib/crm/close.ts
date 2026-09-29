/**
 * Close (close.com), the CRM the sales side works from, over its REST API. The
 * close-sync (./sync) is the only caller: it finds a person's contact, creates or
 * updates their contact and lead, and deletes them again after an erasure.
 *
 * Off unless CLOSE_API_KEY is set, so a self-hosted instance never sends anyone to a
 * vendor it has not chosen.
 *
 * No call throws. Each answers ok with a body whose shape was checked, "rejected"
 * when Close refused this one request (a 4xx about the data), or "unavailable" when
 * Close cannot be used right now: network, timeout, 5xx, rate limit, a refused key,
 * or a 2xx whose body is not the shape the API documents.
 */
import { z } from "zod";
import { type CloseFieldIds, type CloseFieldValues, LEAD_SOURCE } from "./fields";

const CLOSE_API = "https://api.close.com/api/v1";
const TIMEOUT_MS = 5_000;

export type CloseSettings = {
  readonly apiKey: string;
  /** Lead status for a lead the sync creates. Unset: Close uses the org's first status. */
  readonly statusId: string | undefined;
  readonly fieldIds: CloseFieldIds;
};

/** The settings from the normalised environment (./config-schema), or null: sync off. */
export const closeSettings = (source: {
  readonly CLOSE_API_KEY?: string;
  readonly CLOSE_SIGNUP_STATUS_ID?: string;
  readonly CLOSE_FIELD_IDS: CloseFieldIds;
}): CloseSettings | null =>
  source.CLOSE_API_KEY
    ? {
        apiKey: source.CLOSE_API_KEY,
        statusId: source.CLOSE_SIGNUP_STATUS_ID,
        fieldIds: source.CLOSE_FIELD_IDS,
      }
    : null;

export type CloseFailure = {
  readonly ok: false;
  readonly kind: "rejected" | "unavailable";
  /** Status and, for a refusal, the names of the fields Close objected to. Never values. */
  readonly detail: string;
  readonly status: number | null;
  /** The request keys Close named as wrong, e.g. "custom.cf_…" or "contacts". */
  readonly fields: readonly string[];
};

export type CloseResult<T> = { readonly ok: true; readonly value: T } | CloseFailure;

/** Where a person sits in Close. */
export type CloseLink = { readonly leadId: string; readonly contactId: string };

export type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

const ok = <T>(value: T): CloseResult<T> => ({ ok: true, value });

const unavailable = (detail: string, status: number | null = null): CloseFailure => ({
  ok: false,
  kind: "unavailable",
  detail,
  status,
  fields: [],
});

/** A refused key, a rate limit or Close itself failing: nothing else will work right now. */
const isOutage = (status: number) =>
  status === 401 || status === 403 || status === 408 || status === 429 || status >= 500;

const refusalBody = z.object({ "field-errors": z.record(z.string(), z.unknown()) });

const searchBody = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      lead_id: z.string(),
      emails: z.array(z.object({ email: z.string() })),
    }),
  ),
});
const createdLeadBody = z.object({ id: z.string(), contact_ids: z.array(z.string()) });
const contactBody = z.object({ id: z.string(), lead_id: z.string() });
const leadContactsBody = z.object({ id: z.string(), contact_ids: z.array(z.string()) });
const idBody = z.object({ id: z.string() });
const deletedBody = z.object({});

const isEmpty = (fields: Readonly<Record<string, unknown>>) =>
  Object.keys(fields).length === 0;

export const closeClient = (settings: CloseSettings, fetchImpl: FetchLike = fetch) => {
  // Close takes the API key as the Basic-auth username with an empty password.
  const authorization = `Basic ${Buffer.from(`${settings.apiKey}:`).toString("base64")}`;

  const request = async <T>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    path: string,
    schema: z.ZodType<T>,
    body?: unknown,
  ): Promise<CloseResult<T>> => {
    const res = await fetchImpl(`${CLOSE_API}${path}`, {
      method,
      headers: { Authorization: authorization, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      body: body === undefined ? undefined : JSON.stringify(body),
    }).catch((err: unknown) => (err instanceof Error ? err : new Error(String(err))));
    if (res instanceof Error) {
      return unavailable(
        res.name === "TimeoutError"
          ? `${method} ${path}: timeout`
          : `${method} ${path}: ${res.message}`,
      );
    }
    const json: unknown = await res.json().catch(() => undefined);
    if (!res.ok) {
      // Only the names of the refused fields: Close's messages can echo a name or an email.
      const refused = refusalBody.safeParse(json);
      const fields = refused.success ? Object.keys(refused.data["field-errors"]) : [];
      const detail =
        fields.length > 0
          ? `HTTP ${res.status}: ${fields.join(", ")}`
          : `HTTP ${res.status}`;
      return isOutage(res.status)
        ? unavailable(detail, res.status)
        : { ok: false, kind: "rejected", detail, status: res.status, fields };
    }
    const parsed = schema.safeParse(json);
    return parsed.success
      ? ok(parsed.data)
      : unavailable(`${method} ${path}: unexpected response body`, res.status);
  };

  /** A 404 means it is not there. */
  const orNull = <T>(result: CloseResult<T>): CloseResult<T | null> =>
    !result.ok && result.status === 404 ? ok(null) : result;

  const contactPath = (id: string) => `/contact/${encodeURIComponent(id)}/`;
  const leadPath = (id: string) => `/lead/${encodeURIComponent(id)}/`;

  return {
    /**
     * The contact holding exactly this address, if any. Close's search matches words,
     * so the address is compared again here, case-insensitively.
     */
    findContact: async (email: string): Promise<CloseResult<CloseLink | null>> => {
      const found = await request("POST", "/data/search/", searchBody, {
        query: {
          type: "and",
          queries: [
            { type: "object_type", object_type: "contact" },
            {
              type: "has_related",
              this_object_type: "contact",
              related_object_type: "contact_email",
              related_query: {
                type: "field_condition",
                field: {
                  type: "regular_field",
                  object_type: "contact_email",
                  field_name: "email",
                },
                condition: { type: "text", mode: "phrase", value: email },
              },
            },
          ],
        },
        _fields: { contact: ["id", "lead_id", "emails"] },
        results_limit: 25,
      });
      if (!found.ok) return found;
      const wanted = email.toLowerCase();
      const hit = found.value.data.find((contact) =>
        contact.emails.some((e) => e.email.toLowerCase() === wanted),
      );
      return ok(hit ? { leadId: hit.lead_id, contactId: hit.id } : null);
    },

    /** Where this contact sits now, e.g. after its lead was merged; null when deleted. */
    getContact: async (contactId: string): Promise<CloseResult<CloseLink | null>> => {
      const found = orNull(
        await request("GET", `${contactPath(contactId)}?_fields=id,lead_id`, contactBody),
      );
      if (!found.ok) return found;
      return ok(
        found.value && { leadId: found.value.lead_id, contactId: found.value.id },
      );
    },

    /** How many contacts a lead has left; null when the lead is gone. */
    leadContactCount: async (leadId: string): Promise<CloseResult<number | null>> => {
      const lead = orNull(
        await request(
          "GET",
          `${leadPath(leadId)}?_fields=id,contact_ids`,
          leadContactsBody,
        ),
      );
      if (!lead.ok) return lead;
      return ok(lead.value ? lead.value.contact_ids.length : null);
    },

    /** One lead with one contact, the configured status and lead source, and the fields. */
    createLead: async (
      person: { readonly name: string; readonly email: string },
      fields: CloseFieldValues,
    ): Promise<CloseResult<CloseLink>> => {
      const leadSourceId = settings.fieldIds.leadSource;
      const created = await request("POST", "/lead/", createdLeadBody, {
        name: person.name,
        description: "Signed up on the platform.",
        contacts: [
          {
            name: person.name,
            emails: [{ email: person.email, type: "office" }],
            ...fields.contact,
          },
        ],
        ...(settings.statusId ? { status_id: settings.statusId } : {}),
        ...(leadSourceId ? { [`custom.${leadSourceId}`]: LEAD_SOURCE } : {}),
        ...fields.lead,
      });
      if (!created.ok) return created;
      const [contactId] = created.value.contact_ids;
      return contactId
        ? ok({ leadId: created.value.id, contactId })
        : unavailable("POST /lead/: no contact in the response", 200);
    },

    /** Only the fields sent change; a null clears one. Nothing to send, no call. */
    updateLead: async (
      leadId: string,
      fields: CloseFieldValues["lead"],
    ): Promise<CloseResult<null>> => {
      if (isEmpty(fields)) return ok(null);
      const updated = await request("PUT", leadPath(leadId), idBody, fields);
      return updated.ok ? ok(null) : updated;
    },

    /** Only the fields sent change; a null clears one. Nothing to send, no call. */
    updateContact: async (
      contactId: string,
      fields: CloseFieldValues["contact"],
    ): Promise<CloseResult<null>> => {
      if (isEmpty(fields)) return ok(null);
      const updated = await request("PUT", contactPath(contactId), idBody, fields);
      return updated.ok ? ok(null) : updated;
    },

    /** Already gone counts as done. */
    deleteLead: async (leadId: string): Promise<CloseResult<null>> => {
      const deleted = orNull(await request("DELETE", leadPath(leadId), deletedBody));
      return deleted.ok ? ok(null) : deleted;
    },

    /** Already gone counts as done. */
    deleteContact: async (contactId: string): Promise<CloseResult<null>> => {
      const deleted = orNull(
        await request("DELETE", contactPath(contactId), deletedBody),
      );
      return deleted.ok ? ok(null) : deleted;
    },
  };
};

export type CloseClient = ReturnType<typeof closeClient>;
