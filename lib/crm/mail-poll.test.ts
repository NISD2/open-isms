/**
 * The mail step of the sync, run through runCloseSync with nobody to sync:
 * - it reads Resend newest first and stops at the second mail it already dealt with;
 * - it writes oldest first, so an interrupted run never leaves a hole the stop rule
 *   cannot see: a burst bigger than a page, the note budget and an outage all resume;
 * - a mail still on its way waits; a mail that is not listed, not delivered or for
 *   nobody in Close is logged without a note;
 * - Resend or Close failing ends the step and logs nothing it did not finish.
 */
import { describe, expect, test } from "bun:test";
import type { CloseSettings } from "./close";
import { MAX_NOTES_PER_RUN, type MailLogRow, type MailPoll } from "./mail-poll";
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

/** Resend pages of 100 over `mails`; `down` refuses every call. */
function fakeResend(mails: readonly ResendMail[], down = false) {
  let calls = 0;
  const client: ResendClient = {
    list: async (after) => {
      calls += 1;
      if (down) {
        return {
          ok: false,
          kind: "unavailable",
          detail: "GET /emails: HTTP 401",
          status: 401,
          fields: [],
        };
      }
      const start = after ? mails.findIndex((m) => m.id === after) + 1 : 0;
      const page = mails.slice(start, start + 100);
      return { ok: true, value: { mails: page, hasMore: start + 100 < mails.length } };
    },
  };
  return { client, calls: () => calls };
}

const poll = (resend: ResendClient): MailPoll => ({
  resend,
  sources: {
    newsletterFrom: "newsletter@nisd2.eu",
    transactionalFrom: "noreply@nisd2.eu",
  },
  pauseMs: 0,
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

type Note = { contact_id: string; note: string; date_created: string };

/** Close with a contact for every address except `absent`; `down` fails the n-th lookup on. */
function fakeClose(opts: { absent?: string[]; downFromLookup?: number } = {}) {
  const notes: Note[] = [];
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
    if (url.endsWith("/activity/note/")) {
      notes.push(body);
      return json({ id: `acti_${notes.length}` });
    }
    return json({ error: "unexpected" }, 500);
  };
  return { impl, notes };
}

const run = (
  store: CloseSyncStore,
  close: ReturnType<typeof fakeClose>,
  resend: ReturnType<typeof fakeResend> | null,
) => runCloseSync(store, settings, close.impl, resend ? poll(resend.client) : null);

describe("runCloseSync, mail step", () => {
  test("without Resend the step is left out", async () => {
    const { store } = memoryStore();
    const close = fakeClose();
    expect(await run(store, close, null)).toMatchObject({ mailNoted: 0, stopped: null });
    expect(close.notes).toHaveLength(0);
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
    expect(close.notes.map((n) => n.note)).toEqual([
      'Newsletter sent: "Issue 3"',
      'Newsletter sent: "Issue 4"',
      'Newsletter sent: "Issue 5"',
    ]);
    expect(close.notes[0]).toMatchObject({
      contact_id: "cont_p3@example.test",
      date_created: new Date(BASE + 3 * 60_000).toISOString(),
    });
    expect(rows.map((r) => r.outcome)).toEqual(["noted", "noted", "noted"]);
  });

  test("a second run with nothing new makes no Close call", async () => {
    const { store } = memoryStore();
    const resend = fakeResend(history(4));
    await run(store, fakeClose(), resend);
    const close = fakeClose();
    expect(await run(store, close, resend)).toMatchObject({
      mailNoted: 0,
      mailPending: 0,
    });
    expect(close.notes).toHaveLength(0);
  });

  test("a burst bigger than a page is all written, with nothing left behind", async () => {
    const { store } = memoryStore(["re_1", "re_2"]);
    const close = fakeClose();
    const result = await run(store, close, fakeResend(history(230)));
    expect(result).toMatchObject({ mailNoted: 228, mailPending: 0, stopped: null });
    expect(new Set(close.notes.map((n) => n.note)).size).toBe(228);
  });

  test("the note budget leaves the newest mail for the next run, with no gap and no repeat", async () => {
    const total = MAX_NOTES_PER_RUN + 50;
    const { store } = memoryStore();
    const resend = fakeResend(history(total));
    const close = fakeClose();
    const first = await run(store, close, resend);
    expect(first).toMatchObject({ mailNoted: MAX_NOTES_PER_RUN, mailPending: 50 });
    // The oldest were written first, so what is left is the newest.
    expect(close.notes.at(-1)?.note).toBe(
      `Newsletter sent: "Issue ${MAX_NOTES_PER_RUN}"`,
    );

    expect(await run(store, close, resend)).toMatchObject({
      mailNoted: 50,
      mailPending: 0,
    });
    expect(close.notes).toHaveLength(total);
    expect(new Set(close.notes.map((n) => n.note)).size).toBe(total);
  });

  test("an empty log reads all of the history Resend still holds", async () => {
    const { store } = memoryStore();
    const resend = fakeResend(history(250));
    await run(store, fakeClose(), resend);
    expect(resend.calls()).toBe(3);
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
    expect(close.notes).toHaveLength(1);
  });

  test("not listed, not delivered and nobody in Close are logged without a note", async () => {
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
  });

  test("a mail to several recipients notes each one found in Close", async () => {
    const { store, rows } = memoryStore();
    const resend = fakeResend([
      mail(1, { to: ["a@example.test", "A@example.test", "b@example.test"] }),
    ]);
    const close = fakeClose();
    await run(store, close, resend);
    expect(close.notes.map((n) => n.contact_id)).toEqual([
      "cont_a@example.test",
      "cont_b@example.test",
    ]);
    expect(rows[0]).toMatchObject({ outcome: "noted", notes: 2 });
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
    expect(await run(store, close, fakeResend(history(3), true))).toMatchObject({
      mailNoted: 0,
      stopped: "GET /emails: HTTP 401",
    });
    expect(rows).toHaveLength(0);
    expect(close.notes).toHaveLength(0);
  });
});
