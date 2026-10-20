/**
 * The invite step of the sync, run through runCloseSync, and the guard that keeps a
 * guest from another company off the inviter's lead fields:
 * - an invited address becomes a contact on the inviter's lead, with "Platform may
 *   email: No" and a note that says who invited them and when;
 * - an address Close already holds, on any lead, is left where it is;
 * - an invite is dealt with once, so a contact sales deleted is not added again;
 * - a refused address is dropped and never stops the others; an outage ends the run
 *   and leaves the invite for the next one;
 * - a guest who later signs up is linked to that contact, and their company's facts
 *   are not written onto a lead that belongs to somebody else's company.
 */
import { describe, expect, test } from "bun:test";
import type { CloseSettings } from "./close";
import type { CloseFacts } from "./fields";
import { type CloseInvite, type InviteOutcome, MAX_INVITES_PER_RUN } from "./invite-step";
import { type CloseSyncPerson, type CloseSyncStore, runCloseSync } from "./sync";

const settings: CloseSettings = {
  apiKey: "test-key",
  statusId: undefined,
  suppressedStatusId: undefined,
  fieldIds: { mayEmail: "cf_may", company: "cf_company", logins: "cf_logins" },
};

const invite = (n: number, over: Partial<CloseInvite> = {}): CloseInvite => ({
  id: `inv_${n}`,
  kind: "team",
  email: `guest${n}@example.test`,
  name: null,
  invitedAt: new Date(Date.UTC(2026, 9, n)),
  inviterName: "Anna Inviter",
  link: { leadId: "lead_inviter", contactId: "cont_inviter" },
  ...over,
});

type Handled = { inviteId: string; outcome: InviteOutcome; contactId: string | null };

function memoryStore(
  waiting: CloseInvite[],
  opts: { people?: CloseSyncPerson[]; leadCompanies?: string[] } = {},
) {
  const handled: Handled[] = [];
  const store: CloseSyncStore = {
    erased: async () => [],
    people: async () => opts.people ?? [],
    linked: async () => {},
    refused: async () => {},
    forget: async () => {},
    optOut: async () => 0,
    knownMail: async () => new Set(),
    recordMail: async () => {},
    leadCompanies: async () => new Set(opts.leadCompanies ?? []),
    openInvites: async (limit) => {
      const open = waiting.filter((w) => !handled.some((h) => h.inviteId === w.id));
      return { invites: open.slice(0, limit), waiting: open.length };
    },
    inviteHandled: async (row) => {
      handled.push({
        inviteId: row.inviteId,
        outcome: row.outcome,
        contactId: row.link?.contactId ?? null,
      });
    },
  };
  return { store, handled };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

type Call = { method: string; path: string; body: Record<string, unknown> | undefined };

/** Close: `held` maps an address to the contact that has it; `refuse` addresses are refused. */
function fakeClose(
  opts: {
    held?: Record<string, { leadId: string; contactId: string }>;
    refuse?: string[];
    down?: boolean;
  } = {},
) {
  const calls: Call[] = [];
  let next = 0;
  const impl = async (url: string, init: RequestInit) => {
    const path = url.replace("https://api.close.com/api/v1", "").split("?")[0] ?? "";
    const body = init.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ method: String(init.method), path, body });
    if (opts.down) return json({ error: "down" }, 503);
    if (path === "/data/search/") {
      const email: string = body.query.queries[1].related_query.condition.value;
      const hit = opts.held?.[email];
      return json({
        data: hit
          ? [{ id: hit.contactId, lead_id: hit.leadId, emails: [{ email }] }]
          : [],
      });
    }
    if (path === "/contact/" && init.method === "POST") {
      if (opts.refuse?.includes(body.emails[0].email)) {
        return json({ "field-errors": { emails: "invalid" } }, 400);
      }
      next += 1;
      return json({ id: `cont_new${next}`, lead_id: body.lead_id });
    }
    if (path === "/activity/note/") return json({ id: "acti_1" });
    if (path.startsWith("/contact/") || path.startsWith("/lead/"))
      return json({ id: "x", lead_id: "lead_x" });
    return json({ error: `unexpected ${path}` }, 500);
  };
  return {
    impl,
    calls,
    created: () => calls.filter((c) => c.method === "POST" && c.path === "/contact/"),
  };
}

describe("runCloseSync, invite step", () => {
  test("adds an invited address to the inviter's lead, not mailable, with a note", async () => {
    const { store, handled } = memoryStore([
      invite(3, { kind: "supplier", name: "Sam Supplier" }),
    ]);
    const close = fakeClose();
    expect(await runCloseSync(store, settings, close.impl)).toMatchObject({
      invitesAdded: 1,
      invitesKnown: 0,
      invitesRefused: 0,
      invitesPending: 0,
      stopped: null,
    });
    expect(close.created()[0]?.body).toEqual({
      lead_id: "lead_inviter",
      name: "Sam Supplier",
      emails: [{ email: "guest3@example.test", type: "office" }],
      "custom.cf_may": "No",
    });
    const note = close.calls.find((c) => c.path === "/activity/note/")?.body;
    expect(note).toMatchObject({
      lead_id: "lead_inviter",
      contact_id: "cont_new1",
      note: "Invited to the platform by Anna Inviter (supplier questionnaire).",
      date_created: new Date(Date.UTC(2026, 9, 3)).toISOString(),
    });
    expect(handled).toEqual([
      { inviteId: "inv_3", outcome: "added", contactId: "cont_new1" },
    ]);
  });

  test("an invitee without an account is named by their address", async () => {
    const { store } = memoryStore([invite(1)]);
    const close = fakeClose();
    await runCloseSync(store, settings, close.impl);
    expect(close.created()[0]?.body).toMatchObject({ name: "guest1@example.test" });
  });

  test("an address Close already holds is left on its own lead", async () => {
    const { store, handled } = memoryStore([invite(1)]);
    const close = fakeClose({
      held: { "guest1@example.test": { leadId: "lead_other", contactId: "cont_other" } },
    });
    expect(await runCloseSync(store, settings, close.impl)).toMatchObject({
      invitesAdded: 0,
      invitesKnown: 1,
    });
    expect(close.created()).toHaveLength(0);
    expect(handled).toEqual([
      { inviteId: "inv_1", outcome: "already_in_close", contactId: "cont_other" },
    ]);
  });

  test("an invite is dealt with once: a second run adds nothing, even if sales deleted the contact", async () => {
    const { store } = memoryStore([invite(1)]);
    await runCloseSync(store, settings, fakeClose().impl);
    const again = fakeClose();
    expect(await runCloseSync(store, settings, again.impl)).toMatchObject({
      invitesAdded: 0,
      invitesKnown: 0,
    });
    expect(again.created()).toHaveLength(0);
  });

  test("a refused address is dropped and does not stop the others", async () => {
    const { store, handled } = memoryStore([invite(1), invite(2)]);
    const close = fakeClose({ refuse: ["guest1@example.test"] });
    expect(await runCloseSync(store, settings, close.impl)).toMatchObject({
      invitesAdded: 1,
      invitesRefused: 1,
      stopped: null,
    });
    expect(handled.map((h) => h.outcome)).toEqual(["refused", "added"]);
  });

  test("an outage ends the run and leaves the invite for the next one", async () => {
    const { store, handled } = memoryStore([invite(1), invite(2)]);
    const close = fakeClose({ down: true });
    expect(await runCloseSync(store, settings, close.impl)).toMatchObject({
      invitesAdded: 0,
      invitesPending: 2,
      stopped: "HTTP 503",
    });
    expect(handled).toHaveLength(0);
  });

  test("at most one budget of invites per run; the rest waits", async () => {
    const many = Array.from({ length: MAX_INVITES_PER_RUN + 5 }, (_, i) => invite(i + 1));
    const { store } = memoryStore(many);
    expect(await runCloseSync(store, settings, fakeClose().impl)).toMatchObject({
      invitesAdded: MAX_INVITES_PER_RUN,
      invitesPending: 5,
    });
    expect(await runCloseSync(store, settings, fakeClose().impl)).toMatchObject({
      invitesAdded: 5,
      invitesPending: 0,
    });
  });
});

const facts: CloseFacts = {
  signedUpAt: new Date(Date.UTC(2026, 9, 10)),
  lastLoginAt: null,
  loginCount: 4,
  grandfathered: false,
  mayEmail: true,
  freeMail: false,
  ceoCourse: { done: 0, total: 10, completedAt: null },
  company: {
    name: "Supplier GmbH",
    sector: "waste",
    employeeCount: 12,
    country: "DE",
    actsAsSupplier: true,
  },
  access: "free",
  path: null,
};

const guest = (companyId: string | null): CloseSyncPerson => ({
  userId: "user-guest",
  companyId,
  email: "guest1@example.test",
  name: "Guest",
  facts,
  sync: null,
});

describe("a guest who signs up later", () => {
  const held = {
    "guest1@example.test": { leadId: "lead_inviter", contactId: "cont_guest" },
  };

  test("from another company: their own facts go on the contact, the lead keeps its company's", async () => {
    const { store } = memoryStore([], {
      people: [guest("company-supplier")],
      leadCompanies: ["company-customer"],
    });
    const close = fakeClose({ held });
    expect(await runCloseSync(store, settings, close.impl)).toMatchObject({ linked: 1 });
    expect(
      close.calls.some((c) => c.method === "PUT" && c.path === "/contact/cont_guest/"),
    ).toBe(true);
    expect(close.calls.some((c) => c.path === "/lead/lead_inviter/")).toBe(false);
  });

  test("from the inviter's company: both levels are written, as before", async () => {
    const { store } = memoryStore([], {
      people: [guest("company-customer")],
      leadCompanies: ["company-customer"],
    });
    const close = fakeClose({ held });
    await runCloseSync(store, settings, close.impl);
    expect(
      close.calls.some((c) => c.method === "PUT" && c.path === "/lead/lead_inviter/"),
    ).toBe(true);
  });

  test("on a lead nobody else is synced on, both levels are written", async () => {
    const { store } = memoryStore([], { people: [guest("company-supplier")] });
    const close = fakeClose({ held });
    await runCloseSync(store, settings, close.impl);
    expect(
      close.calls.some((c) => c.method === "PUT" && c.path === "/lead/lead_inviter/"),
    ).toBe(true);
  });
});
