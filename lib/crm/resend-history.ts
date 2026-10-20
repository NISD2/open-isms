/**
 * Resend's list of sent emails (GET /emails), newest first, a hundred to a page. The
 * mail poll (./mail-poll) is the only caller. Resend keeps about 30 days.
 *
 * Like the Close client (./close), no call throws: ok with a body whose shape was
 * checked, "rejected" when Resend refused this one request, or "unavailable" when
 * Resend cannot be used right now (network, timeout, 5xx, rate limit, a refused key,
 * a body that is not the documented shape).
 */
import { z } from "zod";
import type { CloseFailure, CloseResult, FetchLike } from "./close";

const RESEND_API = "https://api.resend.com";
const TIMEOUT_MS = 10_000;
export const RESEND_PAGE_SIZE = 100;

export type ResendMail = {
  readonly id: string;
  /** "Name <address>" or a bare address. */
  readonly from: string;
  readonly to: readonly string[];
  readonly subject: string;
  readonly sentAt: Date;
  /** Resend's latest event: delivered, bounced, suppressed, sent, ... */
  readonly lastEvent: string | null;
};

export type ResendPage = {
  readonly mails: readonly ResendMail[];
  readonly hasMore: boolean;
};

/** Resend writes "2026-10-20 20:14:55.292000+00": a space and a two-digit offset. */
export const parseResendTime = (value: string): Date | null => {
  const iso = value.replace(" ", "T");
  const date = new Date(/[+-]\d\d$/.test(iso) ? `${iso}:00` : iso);
  return Number.isNaN(date.getTime()) ? null : date;
};

const listBody = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      from: z.string(),
      to: z.array(z.string()),
      subject: z.string(),
      created_at: z.string(),
      last_event: z.string().nullable().optional(),
    }),
  ),
  has_more: z.boolean(),
});

const failure = (
  kind: CloseFailure["kind"],
  detail: string,
  status: number | null,
): CloseFailure => ({ ok: false, kind, detail, status, fields: [] });

export const resendClient = (apiKey: string, fetchImpl: FetchLike = fetch) => ({
  /** One page of sent mail, newest first; `after` is the id of the last mail of the page before. */
  list: async (after?: string): Promise<CloseResult<ResendPage>> => {
    const query = new URLSearchParams({ limit: String(RESEND_PAGE_SIZE) });
    if (after) query.set("after", after);
    const res = await fetchImpl(`${RESEND_API}/emails?${query}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    }).catch((err: unknown) => (err instanceof Error ? err : new Error(String(err))));
    if (res instanceof Error) {
      return failure(
        "unavailable",
        `GET /emails: ${res.name === "TimeoutError" ? "timeout" : res.message}`,
        null,
      );
    }
    if (!res.ok) {
      // A key limited to sending is refused here, and that is a setting to fix, not an outage.
      const detail =
        res.status === 401 || res.status === 403
          ? `HTTP ${res.status}: Resend refused the key for listing mail (a key limited to sending cannot)`
          : `HTTP ${res.status}`;
      const outage =
        res.status === 429 ||
        res.status >= 500 ||
        res.status === 401 ||
        res.status === 403;
      return failure(
        outage ? "unavailable" : "rejected",
        `GET /emails: ${detail}`,
        res.status,
      );
    }
    const parsed = listBody.safeParse(await res.json().catch(() => undefined));
    if (!parsed.success) {
      return failure("unavailable", "GET /emails: unexpected response body", res.status);
    }
    const mails = parsed.data.data.flatMap((row) => {
      const sentAt = parseResendTime(row.created_at);
      return sentAt
        ? [
            {
              id: row.id,
              from: row.from,
              to: row.to,
              subject: row.subject,
              sentAt,
              lastEvent: row.last_event ?? null,
            },
          ]
        : [];
    });
    // A row with a time we cannot read is one we cannot place, so it is left out; if the
    // whole page is like that, the poll would walk on forever, so say so.
    if (mails.length === 0 && parsed.data.data.length > 0) {
      return failure("unavailable", "GET /emails: unreadable timestamps", res.status);
    }
    return { ok: true, value: { mails, hasMore: parsed.data.has_more } };
  },
});

export type ResendClient = ReturnType<typeof resendClient>;
