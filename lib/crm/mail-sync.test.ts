/**
 * The mail step of the sync, against a store that holds recorded mail and a fake
 * Close that only knows notes:
 * - each recorded mail becomes one note on the contact, dated when it was sent, once;
 * - a type that is not on the list is dropped without a call;
 * - a note Close refuses is dropped and never stops the others;
 * - an outage ends the run and leaves the mail for the next one;
 * - nothing is written while the run is stopped earlier.
 */
import { describe, expect, test } from "bun:test";
import type { CloseSettings } from "./close";
import {
  type CloseSyncStore,
  type ErasedCloseRow,
  type MailToLog,
  runCloseSync,
} from "./sync";

const settings: CloseSettings = {
  apiKey: "test-key",
  statusId: undefined,
  suppressedStatusId: undefined,
  fieldIds: {},
};

const mail = (
  id: string,
  emailType = "auth.welcome",
  contactId = "cont_1",
  sentAt = new Date("2026-10-19T08:30:00Z"),
): MailToLog => ({
  id,
  emailType,
  sentAt,
  link: { leadId: "lead_1", contactId },
});

/** Nobody to sync, so a run is only its mail step (or the erasure a test adds). */
function memoryStore(recorded: MailToLog[], erased: ErasedCloseRow[] = []) {
  const logged = new Set<string>();
  const store: CloseSyncStore = {
    erased: async () => erased,
    people: async () => [],
    unloggedMail: async (limit) =>
      recorded.filter((m) => !logged.has(m.id)).slice(0, limit),
    mailLogged: async (ids) => {
      for (const id of ids) logged.add(id);
    },
    linked: async () => {},
    refused: async () => {},
    forget: async () => {},
    optOut: async () => 0,
  };
  return { store, logged };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

type NoteBody = {
  lead_id: string;
  contact_id: string;
  note: string;
  date_created: string;
};

/** Close with the contacts in `known`; `down` answers 503 to every call. */
function fakeClose(opts: { known?: string[]; down?: boolean } = {}) {
  const known = new Set(opts.known ?? ["cont_1"]);
  const notes: NoteBody[] = [];
  const urls: string[] = [];
  const impl = async (url: string, init: RequestInit) => {
    urls.push(url);
    if (opts.down) return json({ error: "down" }, 503);
    if (init.method === "POST" && url.endsWith("/activity/note/")) {
      const body: NoteBody = JSON.parse(String(init.body));
      if (!known.has(body.contact_id)) {
        return json({ "field-errors": { contact_id: "not found" } }, 400);
      }
      notes.push(body);
      return json({ id: `acti_${notes.length}` });
    }
    return json({ error: "unexpected" }, 500);
  };
  return { impl, notes, urls };
}

describe("runCloseSync, mail step", () => {
  test("writes a note per recorded mail on the contact, dated when it was sent, once", async () => {
    const { store, logged } = memoryStore([
      mail("m1"),
      mail("m2", "product.lifecycle_nudge"),
    ]);
    const close = fakeClose();
    expect(await runCloseSync(store, settings, close.impl)).toMatchObject({
      mailLogged: 2,
      mailRefused: 0,
      stopped: null,
    });
    expect(close.notes[0]).toEqual({
      lead_id: "lead_1",
      contact_id: "cont_1",
      note: "Platform email sent: Welcome email",
      date_created: "2026-10-19T08:30:00.000Z",
    });
    expect(close.notes[1]?.note).toBe("Platform email sent: Activation nudge email");
    expect([...logged]).toEqual(["m1", "m2"]);

    await runCloseSync(store, settings, close.impl);
    expect(close.notes).toHaveLength(2);
  });

  test("a type that is not on the list is dropped without a call", async () => {
    const { store, logged } = memoryStore([mail("m1", "auth.verification_code")]);
    const close = fakeClose();
    expect(await runCloseSync(store, settings, close.impl)).toMatchObject({
      mailLogged: 0,
      mailRefused: 0,
    });
    expect(close.notes).toHaveLength(0);
    expect(logged.has("m1")).toBe(true);
  });

  test("a note Close refuses is dropped and does not stop the others", async () => {
    const { store, logged } = memoryStore([
      mail("m1", "auth.welcome", "cont_gone"),
      mail("m2"),
    ]);
    const close = fakeClose();
    expect(await runCloseSync(store, settings, close.impl)).toMatchObject({
      mailLogged: 1,
      mailRefused: 1,
      stopped: null,
    });
    expect([...logged]).toEqual(["m1", "m2"]);
  });

  test("an outage leaves the mail for the next run and ends this one", async () => {
    const { store, logged } = memoryStore([mail("m1"), mail("m2")]);
    const close = fakeClose({ down: true });
    expect(await runCloseSync(store, settings, close.impl)).toMatchObject({
      mailLogged: 0,
      stopped: "HTTP 503",
    });
    expect(logged.size).toBe(0);
  });

  test("nothing is written while the run is stopped earlier", async () => {
    // An erasure Close cannot reach stops the run before the mail step.
    const erased: ErasedCloseRow = {
      id: "row-1",
      leadId: "lead_9",
      contactId: "cont_9",
      createdLead: true,
    };
    const { store, logged } = memoryStore([mail("m1")], [erased]);
    const close = fakeClose({ down: true });
    expect(await runCloseSync(store, settings, close.impl)).toMatchObject({
      mailLogged: 0,
      stopped: "HTTP 503",
    });
    expect(logged.size).toBe(0);
    expect(close.urls.some((u) => u.endsWith("/activity/note/"))).toBe(false);
  });
});
