/**
 * The sync's promises, against an in-memory store and a fake Close that keeps
 * leads and contacts the way Close does:
 * - person facts land on the contact, company facts on the lead;
 * - a changed fact, or a newly configured field, reaches everyone already in Close;
 * - an unchanged person costs no call;
 * - a person Close refuses never stalls anyone else, and is dropped after five;
 * - a refused custom field is a setting, so it stops the run and counts against nobody;
 * - an outage ends the run at once;
 * - an erased person's contact is deleted wherever it sits, and their lead only
 *   when nobody else is on it;
 * - a merged lead is followed, a deleted person is never recreated.
 */
import { describe, expect, test } from "bun:test";
import type { CloseSettings } from "./close";
import type { CloseFacts, CloseFieldIds } from "./fields";
import {
  type CloseSyncLinkRow,
  type CloseSyncPerson,
  type CloseSyncStore,
  ERASED_LEAD_NAME,
  type ErasedCloseRow,
  MAX_PER_RUN,
  MAX_REFUSALS,
  runCloseSync,
} from "./sync";

const facts = (n: number): CloseFacts => ({
  signedUpAt: new Date(Date.UTC(2026, 8, 1) + n * 86_400_000),
  lastLoginAt: null,
  loginCount: n,
  grandfathered: false,
  mayEmail: true,
  freeMail: false,
  ceoCourse: { done: 0, total: 10, completedAt: null },
  company: {
    name: "Muster GmbH",
    sector: "waste",
    employeeCount: 10,
    country: "DE",
    actsAsSupplier: false,
  },
  access: "free",
  path: null,
});

const person = (n: number, sync: CloseSyncLinkRow | null = null): CloseSyncPerson => ({
  userId: `user-${n}`,
  email: `user-${n}@example.test`,
  name: `User ${n}`,
  facts: facts(n),
  sync,
});

/** logins is a contact field, supplier a lead field. */
const settings = (
  fieldIds: CloseFieldIds = { logins: "cf_logins", supplier: "cf_sup" },
): CloseSettings => ({ apiKey: "test-key", statusId: undefined, fieldIds });

/** The store as a map of rows, so a second run sees what the first one wrote. */
function memoryStore(people: CloseSyncPerson[], erased: ErasedCloseRow[] = []) {
  const rows = new Map<string, CloseSyncLinkRow & { lastError: string | null }>(
    people.flatMap((p) => (p.sync ? [[p.userId, { ...p.sync, lastError: null }]] : [])),
  );
  const erasedRows = [...erased];
  const store: CloseSyncStore = {
    erased: async () => [...erasedRows],
    people: async () => people.map((p) => ({ ...p, sync: rows.get(p.userId) ?? null })),
    linked: async (userId, link, createdLead, fieldsHash) => {
      rows.set(userId, {
        ...link,
        createdLead,
        fieldsHash,
        rejectedCount: 0,
        lastError: null,
      });
    },
    refused: async (userId, detail, giveUp) => {
      const row = rows.get(userId);
      rows.set(userId, {
        leadId: row?.leadId ?? null,
        contactId: row?.contactId ?? null,
        createdLead: row?.createdLead ?? false,
        fieldsHash: row?.fieldsHash ?? null,
        rejectedCount: giveUp ? MAX_REFUSALS : (row?.rejectedCount ?? 0) + 1,
        lastError: detail,
      });
    },
    forget: async (rowId) => {
      erasedRows.splice(
        erasedRows.findIndex((r) => r.id === rowId),
        1,
      );
    },
  };
  return { store, rows, erasedRows };
}

type Call = { method: string; path: string; body: unknown };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/**
 * Close as a fake with state. `contacts` seeds existing contacts (id to lead and
 * address); `refuse` lists addresses refused on create; `refuseField` is a custom
 * field key Close rejects everywhere; `down` fails every call.
 */
function fakeClose(
  opts: {
    contacts?: Record<string, { leadId: string; email: string }>;
    refuse?: string[];
    refuseField?: string;
    down?: boolean;
  } = {},
) {
  const contacts = new Map(Object.entries(opts.contacts ?? {}));
  const leads = new Map<string, string[]>();
  for (const [id, c] of contacts) {
    leads.set(c.leadId, [...(leads.get(c.leadId) ?? []), id]);
  }
  const calls: Call[] = [];
  let next = 0;

  const impl = async (url: string, init: RequestInit) => {
    const path = url.replace("https://api.close.com/api/v1", "").split("?")[0] ?? "";
    const method = String(init.method);
    const body = init.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ method, path, body });
    if (opts.down) return json({ error: "down" }, 503);
    if (opts.refuseField && body && JSON.stringify(body).includes(opts.refuseField)) {
      return json({ "field-errors": { [opts.refuseField]: "not a choice" } }, 400);
    }
    const [, kind, id] = path.split("/");

    if (path === "/data/search/") {
      const email: string = body.query.queries[1].related_query.condition.value;
      const hit = [...contacts].find(([, c]) => c.email === email);
      return json({
        data: hit ? [{ id: hit[0], lead_id: hit[1].leadId, emails: [{ email }] }] : [],
      });
    }
    if (method === "POST" && path === "/lead/") {
      const email: string = body.contacts[0].emails[0].email;
      if (opts.refuse?.includes(email)) {
        return json({ "field-errors": { contacts: "invalid" } }, 400);
      }
      next++;
      const [leadId, contactId] = [`lead_new${next}`, `cont_new${next}`];
      contacts.set(contactId, { leadId, email });
      leads.set(leadId, [contactId]);
      return json({ id: leadId, contact_ids: [contactId] });
    }
    if (kind === "contact" && id) {
      const contact = contacts.get(id);
      if (!contact) return json({ error: "not found" }, 404);
      if (method === "DELETE") {
        contacts.delete(id);
        leads.set(
          contact.leadId,
          (leads.get(contact.leadId) ?? []).filter((c) => c !== id),
        );
        return json({});
      }
      return json({ id, lead_id: contact.leadId });
    }
    if (kind === "lead" && id) {
      const members = leads.get(id);
      if (!members) return json({ error: "not found" }, 404);
      if (method === "DELETE") {
        for (const c of members) contacts.delete(c);
        leads.delete(id);
        return json({});
      }
      return json({ id, contact_ids: members });
    }
    return json({ error: "unexpected" }, 500);
  };
  return { impl, calls, contacts, leads };
}

const linkedRow = (
  leadId: string,
  contactId: string,
  createdLead = true,
): CloseSyncLinkRow => ({
  leadId,
  contactId,
  createdLead,
  fieldsHash: "stale",
  rejectedCount: 0,
});

describe("runCloseSync", () => {
  test("does nothing without settings", async () => {
    const { store } = memoryStore([person(1)]);
    const close = fakeClose();
    expect(await runCloseSync(store, null, close.impl)).toEqual({
      skipped: "CLOSE_API_KEY is not set",
    });
    expect(close.calls).toHaveLength(0);
  });

  test("creates a lead for someone new, with contact fields on the contact", async () => {
    const { store, rows } = memoryStore([person(1)]);
    const close = fakeClose();
    expect(await runCloseSync(store, settings(), close.impl)).toMatchObject({
      created: 1,
      stopped: null,
    });
    expect(rows.get("user-1")).toMatchObject({ leadId: "lead_new1", createdLead: true });
    const create = close.calls.find((c) => c.method === "POST" && c.path === "/lead/");
    expect(create?.body).toMatchObject({
      "custom.cf_sup": "No",
      contacts: [{ name: "User 1", "custom.cf_logins": 1 }],
    });
  });

  test("links someone Close already has and writes both levels onto it", async () => {
    const { store, rows } = memoryStore([person(2)]);
    const close = fakeClose({
      contacts: { cont_csv: { leadId: "lead_csv", email: "user-2@example.test" } },
    });
    expect(await runCloseSync(store, settings(), close.impl)).toMatchObject({
      linked: 1,
    });
    expect(rows.get("user-2")).toMatchObject({ leadId: "lead_csv", createdLead: false });
    expect(close.calls).toContainEqual({
      method: "PUT",
      path: "/contact/cont_csv/",
      body: { "custom.cf_logins": 2 },
    });
    expect(close.calls).toContainEqual({
      method: "PUT",
      path: "/lead/lead_csv/",
      body: { "custom.cf_sup": "No" },
    });
  });

  test("a second run with nothing changed makes no call", async () => {
    const { store } = memoryStore([person(1)]);
    const close = fakeClose();
    await runCloseSync(store, settings(), close.impl);
    const before = close.calls.length;
    expect(await runCloseSync(store, settings(), close.impl)).toMatchObject({
      created: 0,
      updated: 0,
      pending: 0,
    });
    expect(close.calls).toHaveLength(before);
  });

  test("a newly configured field is written to everyone already in Close", async () => {
    const { store } = memoryStore([person(1), person(2)]);
    const close = fakeClose();
    await runCloseSync(store, settings(), close.impl);
    const before = close.calls.length;

    const more = settings({
      logins: "cf_logins",
      supplier: "cf_sup",
      grandfathered: "cf_gf",
    });
    expect(await runCloseSync(store, more, close.impl)).toMatchObject({ updated: 2 });
    const contactWrites = close.calls
      .slice(before)
      .filter((c) => c.path.startsWith("/contact/"))
      .map((c) => c.body);
    expect(contactWrites).toEqual([
      { "custom.cf_logins": 2, "custom.cf_gf": "No" },
      { "custom.cf_logins": 1, "custom.cf_gf": "No" },
    ]);
  });

  test("a refused person does not stall the others and is dropped after five", async () => {
    const people = [person(1), person(2), person(3), person(4)];
    const { store, rows } = memoryStore(people);
    const refuse = ["user-4@example.test", "user-3@example.test", "user-2@example.test"];
    const close = fakeClose({ refuse });

    expect(await runCloseSync(store, settings(), close.impl)).toMatchObject({
      created: 1,
      refused: 3,
      stopped: null,
    });
    for (let run = 1; run < MAX_REFUSALS; run++) {
      await runCloseSync(store, settings(), close.impl);
    }
    const before = close.calls.length;
    expect(await runCloseSync(store, settings(), close.impl)).toMatchObject({
      gaveUp: 3,
      pending: 0,
    });
    expect(close.calls).toHaveLength(before);
    expect(rows.get("user-2")?.lastError).toBe("HTTP 400: contacts");
  });

  test("a refused custom field stops the run and counts against nobody", async () => {
    const { store, rows } = memoryStore([person(1), person(2)]);
    const close = fakeClose({ refuseField: "custom.cf_sup" });
    const result = await runCloseSync(store, settings(), close.impl);
    expect(result).toMatchObject({
      created: 0,
      refused: 0,
      pending: 2,
      stopped: expect.stringContaining("HTTP 400: custom.cf_sup"),
    });
    expect(rows.size).toBe(0);
  });

  test("a wrong status id is a setting too, not something to hold against people", async () => {
    const { store, rows } = memoryStore([person(1), person(2)]);
    const close = fakeClose({ refuseField: "status_id" });
    const withStatus = { ...settings(), statusId: "stat_wrong" };
    const result = await runCloseSync(store, withStatus, close.impl);
    expect(result).toMatchObject({
      refused: 0,
      stopped: expect.stringContaining("status_id"),
    });
    expect(rows.size).toBe(0);
  });

  test("an outage ends the run at the first call", async () => {
    const { store, rows } = memoryStore([person(1), person(2), person(3)]);
    const close = fakeClose({ down: true });
    expect(await runCloseSync(store, settings(), close.impl)).toMatchObject({
      created: 0,
      pending: 3,
      stopped: "HTTP 503",
    });
    expect(close.calls).toHaveLength(1);
    expect(rows.size).toBe(0);
  });

  test("writes at most MAX_PER_RUN people a run, newest signup first", async () => {
    const people = Array.from({ length: MAX_PER_RUN + 5 }, (_, i) => person(i));
    const { store, rows } = memoryStore(people);
    const result = await runCloseSync(store, settings(), fakeClose().impl);
    expect(result).toMatchObject({ created: MAX_PER_RUN, pending: 5 });
    expect(rows.has(`user-${MAX_PER_RUN + 4}`)).toBe(true);
    expect(rows.has("user-0")).toBe(false);
  });

  test("a merged lead is followed through the contact id, even if the address changed", async () => {
    const { store, rows } = memoryStore([person(1, linkedRow("lead_old", "cont_1"))]);
    const close = fakeClose({
      contacts: { cont_1: { leadId: "lead_merged", email: "someone-else@example.test" } },
    });
    expect(await runCloseSync(store, settings(), close.impl)).toMatchObject({
      updated: 1,
    });
    expect(rows.get("user-1")).toMatchObject({
      leadId: "lead_merged",
      contactId: "cont_1",
      createdLead: false,
    });
  });

  test("a person deleted in Close is not recreated", async () => {
    const { store, rows } = memoryStore([person(1, linkedRow("lead_old", "cont_1"))]);
    const close = fakeClose();
    expect(await runCloseSync(store, settings(), close.impl)).toMatchObject({
      created: 0,
      gaveUp: 1,
    });
    const created = close.calls.some((c) => c.method === "POST" && c.path === "/lead/");
    expect(created).toBe(false);
    expect(rows.get("user-1")?.rejectedCount).toBe(MAX_REFUSALS);
  });
});

describe("erasure", () => {
  const erasedRow = (
    id: string,
    leadId: string | null,
    contactId: string | null,
    createdLead: boolean,
  ): ErasedCloseRow => ({ id, leadId, contactId, createdLead });

  test("deletes the contact and the lead the sync made, when nobody else is on it", async () => {
    const close = fakeClose({
      contacts: { cont_a: { leadId: "lead_a", email: "a@x.test" } },
    });
    const { store, erasedRows } = memoryStore(
      [],
      [erasedRow("r1", "lead_a", "cont_a", true)],
    );
    expect(await runCloseSync(store, settings(), close.impl)).toMatchObject({
      erased: 1,
    });
    expect(close.contacts.has("cont_a")).toBe(false);
    expect(close.leads.has("lead_a")).toBe(false);
    expect(erasedRows).toHaveLength(0);
  });

  test("keeps a lead the sync made once sales put a colleague on it", async () => {
    const close = fakeClose({
      contacts: {
        cont_a: { leadId: "lead_a", email: "a@x.test" },
        cont_b: { leadId: "lead_a", email: "b@x.test" },
      },
    });
    const { store } = memoryStore([], [erasedRow("r1", "lead_a", "cont_a", true)]);
    await runCloseSync(store, settings(), close.impl);
    expect(close.contacts.has("cont_a")).toBe(false);
    expect(close.contacts.has("cont_b")).toBe(true);
    expect(close.leads.get("lead_a")).toEqual(["cont_b"]);
    // The lead was titled with the erased person's name.
    expect(close.calls).toContainEqual({
      method: "PUT",
      path: "/lead/lead_a/",
      body: { name: ERASED_LEAD_NAME },
    });
  });

  test("on a lead it did not make, deletes only the person's contact", async () => {
    const close = fakeClose({
      contacts: { cont_c: { leadId: "lead_csv", email: "c@x.test" } },
    });
    const { store } = memoryStore([], [erasedRow("r1", "lead_csv", "cont_c", false)]);
    await runCloseSync(store, settings(), close.impl);
    expect(close.contacts.has("cont_c")).toBe(false);
    expect(close.leads.has("lead_csv")).toBe(true);
  });

  test("finds the contact after a merge moved it to another lead", async () => {
    const close = fakeClose({
      contacts: {
        cont_a: { leadId: "lead_firm", email: "a@x.test" },
        cont_b: { leadId: "lead_firm", email: "b@x.test" },
      },
    });
    const { store } = memoryStore([], [erasedRow("r1", "lead_gone", "cont_a", true)]);
    expect(await runCloseSync(store, settings(), close.impl)).toMatchObject({
      erased: 1,
    });
    expect(close.contacts.has("cont_a")).toBe(false);
    expect(close.leads.get("lead_firm")).toEqual(["cont_b"]);
  });

  test("a row that never reached Close is simply dropped", async () => {
    const close = fakeClose();
    const { store, erasedRows } = memoryStore([], [erasedRow("r1", null, null, false)]);
    expect(await runCloseSync(store, settings(), close.impl)).toMatchObject({
      erased: 1,
    });
    expect(close.calls).toHaveLength(0);
    expect(erasedRows).toHaveLength(0);
  });
});
