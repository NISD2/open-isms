/**
 * An erased person's logged platform mail leaves Close with their contact. Close keeps a
 * deleted contact's emails on the lead (with the person's address and the mail text), and
 * the lead stays when sales put others on it, so the sync deletes those emails itself:
 * - only mail sent from our own addresses, never what sales wrote to the person;
 * - only the erased contact's, never another contact's on the same lead;
 * - before the contact, so a failure leaves the erasure queued for the next run;
 * - nothing at all when Resend is not configured, because no mail was ever logged.
 */
import { describe, expect, test } from "bun:test";
import type { CloseSettings } from "./close";
import type { MailPoll } from "./mail-poll";
import { type CloseSyncStore, type ErasedCloseRow, runCloseSync } from "./sync";

const settings: CloseSettings = {
  apiKey: "test-key",
  statusId: undefined,
  suppressedStatusId: undefined,
  fieldIds: {},
};

const mail: MailPoll = {
  resend: {
    list: async () => ({ ok: true, value: { mails: [], hasMore: false } }),
    bodyText: async () => ({ ok: true, value: null }),
  },
  sources: {
    newsletterFrom: "newsletter@nisd2.eu",
    transactionalFrom: "noreply@nisd2.eu",
  },
  pauseMs: 0,
};

const erasure: ErasedCloseRow = {
  id: "row-1",
  leadId: "lead_1",
  contactId: "cont_a",
  createdLead: true,
};

function memoryStore() {
  const forgotten: string[] = [];
  const store: CloseSyncStore = {
    erased: async () => [erasure],
    people: async () => [],
    linked: async () => {},
    refused: async () => {},
    forget: async (id) => {
      forgotten.push(id);
    },
    optOut: async () => 0,
    knownMail: async () => new Set(),
    recordMail: async () => {},
  };
  return { store, forgotten };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

type Email = { id: string; contact: string; sender: string };

/** One lead with two contacts and the given emails; `emailDeleteDown` fails email deletes. */
function fakeClose(emails: Email[], opts: { emailDeleteDown?: boolean } = {}) {
  const contacts = new Set(["cont_a", "cont_b"]);
  const left = [...emails];
  const calls: string[] = [];
  const impl = async (url: string, init: RequestInit) => {
    const path = url.replace("https://api.close.com/api/v1", "");
    const route = `${init.method} ${path.split("?")[0]}`;
    calls.push(route);
    if (route === "GET /contact/cont_a/")
      return json({ id: "cont_a", lead_id: "lead_1" });
    if (route === "GET /activity/email/") {
      return json({
        data: left.map((e) => ({ id: e.id, contact_id: e.contact, sender: e.sender })),
        has_more: false,
      });
    }
    const email = /^DELETE \/activity\/email\/(.+)\/$/.exec(route);
    if (email) {
      if (opts.emailDeleteDown) return json({ error: "down" }, 503);
      const at = left.findIndex((e) => e.id === email[1]);
      if (at >= 0) left.splice(at, 1);
      return json({});
    }
    if (route === "DELETE /contact/cont_a/") {
      contacts.delete("cont_a");
      return json({});
    }
    if (route === "GET /lead/lead_1/") {
      return json({ id: "lead_1", contact_ids: [...contacts] });
    }
    if (route === "PUT /lead/lead_1/") return json({ id: "lead_1" });
    return json({ error: `unexpected ${route}` }, 500);
  };
  return { impl, calls, remaining: () => left.map((e) => e.id) };
}

describe("erasure and logged mail", () => {
  test("deletes the erased contact's platform mail and leaves everything else", async () => {
    const close = fakeClose([
      { id: "acti_news", contact: "cont_a", sender: "NISD2 <newsletter@nisd2.eu>" },
      { id: "acti_welcome", contact: "cont_a", sender: "nisd2.eu <noreply@nisd2.eu>" },
      { id: "acti_sales", contact: "cont_a", sender: "Simon Orzel <simon@nisd2.eu>" },
      { id: "acti_other", contact: "cont_b", sender: "NISD2 <newsletter@nisd2.eu>" },
    ]);
    const { store, forgotten } = memoryStore();
    expect(await runCloseSync(store, settings, close.impl, mail)).toMatchObject({
      erased: 1,
      erasureRefused: 0,
      stopped: null,
    });
    expect(close.remaining()).toEqual(["acti_sales", "acti_other"]);
    expect(forgotten).toEqual(["row-1"]);
    // The mail goes before the contact does.
    expect(close.calls.indexOf("DELETE /contact/cont_a/")).toBeGreaterThan(
      close.calls.lastIndexOf("DELETE /activity/email/acti_welcome/"),
    );
  });

  test("a failure deleting the mail leaves the contact and the erasure for the next run", async () => {
    const close = fakeClose(
      [{ id: "acti_news", contact: "cont_a", sender: "NISD2 <newsletter@nisd2.eu>" }],
      { emailDeleteDown: true },
    );
    const { store, forgotten } = memoryStore();
    expect(await runCloseSync(store, settings, close.impl, mail)).toMatchObject({
      erased: 0,
      stopped: "HTTP 503",
    });
    expect(close.calls).not.toContain("DELETE /contact/cont_a/");
    expect(forgotten).toEqual([]);
  });

  test("without Resend no mail was ever logged, so no email is looked up", async () => {
    const close = fakeClose([]);
    const { store } = memoryStore();
    expect(await runCloseSync(store, settings, close.impl, null)).toMatchObject({
      erased: 1,
    });
    expect(close.calls.some((c) => c.includes("/activity/email/"))).toBe(false);
  });
});
