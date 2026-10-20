/**
 * The mail step of the sync, run through runCloseSync with nobody to sync:
 * - it reads Resend newest first and stops at the second mail it already dealt with;
 * - it writes oldest first, so an interrupted run never leaves a hole the stop rule
 *   cannot see: a burst bigger than a page, the count and time budgets and an outage
 *   all resume;
 * - each mail becomes an email on the recipient's contact with sender, recipient,
 *   subject, text and send time; the text is fetched only when someone in Close needs it;
 * - a mail still on its way waits; a mail that is not listed, not delivered or for
 *   nobody in Close is logged without an email;
 * - Resend or Close failing ends the step and logs nothing it did not finish.
 */
import { describe, expect, test } from "bun:test";
import type { CloseSettings } from "./close";
import { MAX_ENTRIES_PER_RUN, type MailLogRow, type MailPoll } from "./mail-poll";
import type { ResendClient, ResendMail } from "./resend-history";
import { type CloseSyncStore, runCloseSync } from "./sync";

const settings: CloseSettings = {
  apiKey: "test-key",
  statusId: undefined,
  suppressedStatusId: undefined,
  fieldIds: {},
};

const BASE = Date.UTC(2026, 9, 1);

/** Mail n: the higher the number the newer. Newsletter issues by default. */
const mail = (n: number, over: Partial<ResendMail> = {}): ResendMail => ({
  id: `re_${n}`,
  from: "NISD2 <newsletter@nisd2.eu>",
  to: [`p${n}@example.test`],
  subject: `Issue ${n}`,
  sentAt: new Date(BASE + n * 60_000),
  lastEvent: "delivered",
  ...over,
});

/** Newest first, as Resend lists them. */
const history = (count: number, over: (n: number) => Partial<ResendMail> = () => ({})) =>
  Array.from({ length: count }, (_, i) => mail(count - i, over(count - i)));

const failure = (kind: "unavailable" | "rejected", detail: string, status: number) =>
  ({ ok: false, kind, detail, status, fields: [] }) as const;

/**
 * Resend pages of 100 over `mails`. `down` refuses the list; `bodyStatus` answers every
 * body request with that failure; the body of mail n is "Body of re_n".
 */
function fakeResend(
  mails: readonly ResendMail[],
  opts: { down?: boolean; bodyStatus?: 404 | 429 } = {},
) {
  let listCalls = 0;
  let bodyCalls = 0;
  const client: ResendClient = {
    list: async (after) => {
      listCalls += 1;
      if (opts.down) return failure("unavailable", "GET /emails: HTTP 401", 401);
      const start = after ? mails.findIndex((m) => m.id === after) + 1 : 0;
      const page = mails.slice(start, start + 100);
      return { ok: true, value: { mails: page, hasMore: start + 100 < mails.length } };
    },
    bodyText: async (id) => {
      bodyCalls += 1;
      if (opts.bodyStatus === 404)
        return failure("rejected", "GET /emails: HTTP 404", 404);
      if (opts.bodyStatus === 429) {
        return failure("unavailable", "GET /emails: HTTP 429", 429);
      }
      return { ok: true, value: `Body of ${id}` };
    },
  };
  return { client, listCalls: () => listCalls, bodyCalls: () => bodyCalls };
}

const poll = (resend: ResendClient, budgetMs?: number): MailPoll => ({
  resend,
  sources: {
    newsletterFrom: "newsletter@nisd2.eu",
    transactionalFrom: "noreply@nisd2.eu",
  },
  pauseMs: 0,
  budgetMs,
});

function memoryStore(known: string[] = []) {
  const ids = new Set(known);
  const rows: MailLogRow[] = [];
  const store: CloseSyncStore = {
    erased: async () => [],
    people: async () => [],
    linked: async () => {},
    refused: async () => {},
    forget: async () => {},
    optOut: async () => 0,
    openInvites: async () => ({ invites: [], waiting: 0 }),
    inviteHandled: async () => {},
    leadCompanies: async () => new Set(),
    knownMail: async (wanted) => new Set(wanted.filter((id) => ids.has(id))),
    recordMail: async (row) => {
      ids.add(row.resendId);
      rows.push(row);
    },
  };
  return { store, rows };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

type LoggedEmail = {
  lead_id: string;
  contact_id: string;
  status: string;
  sender: string;
  to: string[];
  subject: string;
  body_text: string | null;
  date_created: string;
};

/** Close with a contact for every address except `absent`; `down` fails the n-th lookup on. */
function fakeClose(opts: { absent?: string[]; downFromLookup?: number } = {}) {
  const emails: LoggedEmail[] = [];
  let lookups = 0;
  const impl = async (url: string, init: RequestInit) => {
    const body = init.body ? JSON.parse(String(init.body)) : undefined;
    if (url.endsWith("/data/search/")) {
      lookups += 1;
      if (opts.downFromLookup !== undefined && lookups >= opts.downFromLookup) {
        return json({ error: "down" }, 503);
      }
      const email: string = body.query.queries[1].related_query.condition.value;
      return json({
        data: opts.absent?.includes(email)
          ? []
          : [{ id: `cont_${email}`, lead_id: `lead_${email}`, emails: [{ email }] }],
      });
    }
    if (url.endsWith("/activity/email/")) {
      emails.push(body);
      return json({ id: `acti_${emails.length}` });
    }
    return json({ error: "unexpected" }, 500);
  };
  return { impl, emails };
}

const run = (
  store: CloseSyncStore,
  close: ReturnType<typeof fakeClose>,
  resend: ReturnType<typeof fakeResend> | null,
  budgetMs?: number,
) =>
  runCloseSync(
    store,
    settings,
    close.impl,
    resend ? poll(resend.client, budgetMs) : null,
  );

describe("runCloseSync, mail step", () => {
  test("without Resend the step is left out", async () => {
    const { store } = memoryStore();
    const close = fakeClose();
    expect(await run(store, close, null)).toMatchObject({ mailNoted: 0, stopped: null });
    expect(close.emails).toHaveLength(0);
  });

  test("logs a sent email with sender, recipient, subject, text and the original date", async () => {
    const { store, rows } = memoryStore();
    const close = fakeClose();
    await run(store, close, fakeResend([mail(1)]));
    expect(close.emails).toEqual([
      {
        lead_id: "lead_p1@example.test",
        contact_id: "cont_p1@example.test",
        status: "sent",
        sender: "NISD2 <newsletter@nisd2.eu>",
        to: ["p1@example.test"],
        subject: "Issue 1",
        body_text: "Body of re_1",
        date_created: new Date(BASE + 60_000).toISOString(),
      },
    ]);
    expect(rows).toEqual([
      expect.objectContaining({ resendId: "re_1", outcome: "noted", notes: 1 }),
    ]);
  });

  test("walks down to the second known mail and writes the rest oldest first", async () => {
    const { store, rows } = memoryStore(["re_2", "re_1"]);
    const close = fakeClose();
    expect(await run(store, close, fakeResend(history(5)))).toMatchObject({
      mailNoted: 3,
      mailSkipped: 0,
      mailPending: 0,
      stopped: null,
    });
    expect(close.emails.map((e) => e.subject)).toEqual(["Issue 3", "Issue 4", "Issue 5"]);
    expect(rows.map((r) => r.outcome)).toEqual(["noted", "noted", "noted"]);
  });

  test("a second run with nothing new makes no Close or body call", async () => {
    const { store } = memoryStore();
    const resend = fakeResend(history(4));
    await run(store, fakeClose(), resend);
    const bodiesBefore = resend.bodyCalls();
    const close = fakeClose();
    expect(await run(store, close, resend)).toMatchObject({
      mailNoted: 0,
      mailPending: 0,
    });
    expect(close.emails).toHaveLength(0);
    expect(resend.bodyCalls()).toBe(bodiesBefore);
  });

  test("a burst bigger than a page is all written, with nothing left behind", async () => {
    const { store } = memoryStore(["re_1", "re_2"]);
    const close = fakeClose();
    const result = await run(store, close, fakeResend(history(230)));
    expect(result).toMatchObject({ mailNoted: 228, mailPending: 0, stopped: null });
    expect(new Set(close.emails.map((e) => e.subject)).size).toBe(228);
  });

  test("the count budget leaves the newest mail for the next run, with no gap and no repeat", async () => {
    const total = MAX_ENTRIES_PER_RUN + 50;
    const { store } = memoryStore();
    const resend = fakeResend(history(total));
    const close = fakeClose();
    const first = await run(store, close, resend);
    expect(first).toMatchObject({ mailNoted: MAX_ENTRIES_PER_RUN, mailPending: 50 });
    // The oldest were written first, so what is left is the newest.
    expect(close.emails.at(-1)?.subject).toBe(`Issue ${MAX_ENTRIES_PER_RUN}`);

    expect(await run(store, close, resend)).toMatchObject({
      mailNoted: 50,
      mailPending: 0,
    });
    expect(close.emails).toHaveLength(total);
    expect(new Set(close.emails.map((e) => e.subject)).size).toBe(total);
  });

  test("the time budget stops a run after at least one mail and resumes after it", async () => {
    const { store } = memoryStore();
    const resend = fakeResend(history(5));
    const close = fakeClose();
    expect(await run(store, close, resend, 0)).toMatchObject({
      mailNoted: 1,
      mailPending: 4,
      stopped: null,
    });
    expect(close.emails.map((e) => e.subject)).toEqual(["Issue 1"]);
    expect(await run(store, close, resend)).toMatchObject({
      mailNoted: 4,
      mailPending: 0,
    });
    expect(close.emails.map((e) => e.subject)).toEqual([
      "Issue 1",
      "Issue 2",
      "Issue 3",
      "Issue 4",
      "Issue 5",
    ]);
  });

  test("an empty log reads all of the history Resend still holds", async () => {
    const { store } = memoryStore();
    const resend = fakeResend(history(250));
    await run(store, fakeClose(), resend);
    expect(resend.listCalls()).toBe(3);
  });

  test("a mail still on its way waits, and so does everything newer", async () => {
    const { store, rows } = memoryStore();
    const resend = fakeResend([
      mail(3),
      mail(2, { lastEvent: "sent", sentAt: new Date() }),
      mail(1),
    ]);
    const close = fakeClose();
    expect(await run(store, close, resend)).toMatchObject({
      mailNoted: 1,
      mailPending: 2,
    });
    expect(rows.map((r) => r.resendId)).toEqual(["re_1"]);
    expect(close.emails).toHaveLength(1);
  });

  test("not listed, not delivered and nobody in Close are logged without an email", async () => {
    const { store, rows } = memoryStore();
    const resend = fakeResend([
      mail(4, { to: ["gone@example.test"] }),
      mail(3, { lastEvent: "bounced" }),
      mail(2, { from: "NISD2 <noreply@nisd2.eu>", subject: "Your sign-in code" }),
      mail(1),
    ]);
    const close = fakeClose({ absent: ["gone@example.test"] });
    expect(await run(store, close, resend)).toMatchObject({
      mailNoted: 1,
      mailSkipped: 3,
    });
    expect(rows.map((r) => r.outcome)).toEqual([
      "noted",
      "skipped_not_listed",
      "skipped_not_delivered",
      "skipped_no_contact",
    ]);
    expect(rows.map((r) => r.notes)).toEqual([1, 0, 0, 0]);
    // The text is fetched for the one mail somebody in Close needed, not for the rest.
    expect(resend.bodyCalls()).toBe(1);
  });

  test("a mail to several recipients logs one email for each found in Close, one body fetch", async () => {
    const { store, rows } = memoryStore();
    const resend = fakeResend([
      mail(1, { to: ["a@example.test", "A@example.test", "b@example.test"] }),
    ]);
    const close = fakeClose();
    await run(store, close, resend);
    expect(close.emails.map((e) => e.to)).toEqual([
      ["a@example.test"],
      ["b@example.test"],
    ]);
    expect(rows[0]).toMatchObject({ outcome: "noted", notes: 2 });
    expect(resend.bodyCalls()).toBe(1);
  });

  test("a mail whose text Resend no longer holds is logged without a text", async () => {
    const { store } = memoryStore();
    const close = fakeClose();
    const result = await run(store, close, fakeResend([mail(1)], { bodyStatus: 404 }));
    expect(result).toMatchObject({ mailNoted: 1, stopped: null });
    expect(close.emails[0]).toMatchObject({ subject: "Issue 1", body_text: null });
  });

  test("a rate limit on the text ends the step and leaves the mail for the next run", async () => {
    const { store, rows } = memoryStore();
    const close = fakeClose();
    expect(
      await run(store, close, fakeResend(history(2), { bodyStatus: 429 })),
    ).toMatchObject({ mailNoted: 0, mailPending: 2, stopped: "GET /emails: HTTP 429" });
    expect(rows).toHaveLength(0);
    expect(close.emails).toHaveLength(0);
  });

  test("Close going down ends the step and logs only what was finished", async () => {
    const { store, rows } = memoryStore();
    const close = fakeClose({ downFromLookup: 2 });
    expect(await run(store, close, fakeResend(history(3)))).toMatchObject({
      mailNoted: 1,
      mailPending: 2,
      stopped: "HTTP 503",
    });
    expect(rows.map((r) => r.resendId)).toEqual(["re_1"]);
  });

  test("a key Resend refuses ends the run and touches nothing", async () => {
    const { store, rows } = memoryStore();
    const close = fakeClose();
    expect(await run(store, close, fakeResend(history(3), { down: true }))).toMatchObject(
      {
        mailNoted: 0,
        stopped: "GET /emails: HTTP 401",
      },
    );
    expect(rows).toHaveLength(0);
    expect(close.emails).toHaveLength(0);
  });
});
