/**
 * New signups into Close (close.com), the CRM the sales side works from.
 *
 * Off unless CLOSE_API_KEY is set, so a self-hosted instance never sends
 * anyone's signup to a vendor it has not chosen. On nisd2.eu it runs next to
 * the internal signup alert and does the same job for the CRM: one lead per
 * new account, in the "Platform user" status, unless Close already holds a
 * contact with that address (the users imported by hand before this existed).
 *
 * It must never cost a signup anything. Every failure is logged and swallowed,
 * and the calls give up after a few seconds so a slow Close cannot hold a
 * sign-in open.
 *
 * Takes its settings as a parameter and never reads process.env, so the tests
 * run without an environment.
 */

const CLOSE_API = "https://api.close.com/api/v1";
const TIMEOUT_MS = 5_000;

export type CloseSettings = {
  apiKey: string;
  /** Lead status for a new signup. Unset: Close uses the org's first status. */
  statusId?: string;
  /** Custom field id to value, e.g. {"cf_abc": "Platform signup"}. */
  customFields: Record<string, string>;
};

export type CloseSignup = {
  email: string;
  name: string | null;
  provider: string;
};

export type CloseSyncResult = "disabled" | "exists" | "created" | "failed";

type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

/**
 * Reads the three CLOSE_ settings. Returns null, which switches the sync off,
 * when there is no API key. A custom-field value that is not a JSON object of
 * strings is dropped with a warning rather than stopping the app.
 */
export function closeSettings(source: {
  CLOSE_API_KEY?: string;
  CLOSE_SIGNUP_STATUS_ID?: string;
  CLOSE_SIGNUP_CUSTOM_FIELDS?: string;
}): CloseSettings | null {
  const apiKey = source.CLOSE_API_KEY?.trim();
  if (!apiKey) return null;

  const customFields: Record<string, string> = {};
  const raw = source.CLOSE_SIGNUP_CUSTOM_FIELDS?.trim();
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        for (const [id, value] of Object.entries(parsed)) {
          if (typeof value === "string") customFields[id] = value;
        }
      } else {
        console.warn("[close] CLOSE_SIGNUP_CUSTOM_FIELDS is not a JSON object, ignored");
      }
    } catch {
      console.warn("[close] CLOSE_SIGNUP_CUSTOM_FIELDS is not valid JSON, ignored");
    }
  }

  return {
    apiKey,
    statusId: source.CLOSE_SIGNUP_STATUS_ID?.trim() || undefined,
    customFields,
  };
}

function headers(apiKey: string): HeadersInit {
  // Close takes the API key as the Basic-auth username with an empty password.
  return {
    Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`,
    "Content-Type": "application/json",
  };
}

/**
 * Does Close already hold a contact with this address? The search matches
 * words, so the exact address is compared here, case-insensitively.
 */
async function contactExists(
  email: string,
  settings: CloseSettings,
  fetchImpl: FetchLike,
): Promise<boolean> {
  const res = await fetchImpl(`${CLOSE_API}/data/search/`, {
    method: "POST",
    headers: headers(settings.apiKey),
    signal: AbortSignal.timeout(TIMEOUT_MS),
    body: JSON.stringify({
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
      _fields: { contact: ["id", "emails"] },
      results_limit: 25,
    }),
  });
  if (!res.ok) throw new Error(`search returned ${res.status}`);

  const body = (await res.json()) as {
    data?: { emails?: { email?: string }[] }[];
  };
  const wanted = email.toLowerCase();
  return (body.data ?? []).some((contact) =>
    (contact.emails ?? []).some((e) => e.email?.toLowerCase() === wanted),
  );
}

export async function pushSignupToClose(
  signup: CloseSignup,
  settings: CloseSettings | null,
  fetchImpl: FetchLike = fetch,
): Promise<CloseSyncResult> {
  if (!settings) return "disabled";

  try {
    if (await contactExists(signup.email, settings, fetchImpl)) return "exists";

    const name = signup.name?.trim() || signup.email;
    const lead: Record<string, unknown> = {
      name,
      description: `Signed up on the platform via ${signup.provider}.`,
      contacts: [{ name, emails: [{ email: signup.email, type: "office" }] }],
    };
    if (settings.statusId) lead.status_id = settings.statusId;
    for (const [id, value] of Object.entries(settings.customFields)) {
      lead[`custom.${id}`] = value;
    }

    const res = await fetchImpl(`${CLOSE_API}/lead/`, {
      method: "POST",
      headers: headers(settings.apiKey),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      body: JSON.stringify(lead),
    });
    if (!res.ok) throw new Error(`lead create returned ${res.status}`);
    return "created";
  } catch (err) {
    console.error("[close] Failed to push signup to Close:", err);
    return "failed";
  }
}
