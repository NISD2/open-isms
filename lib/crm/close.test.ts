/**
 * The Close client's promises: it never throws, it trusts no response it has not
 * shape-checked, it tells a refused request from an outage, and it never repeats a
 * person's data back in an error.
 */
import { describe, expect, test } from "bun:test";
import { type CloseSettings, closeClient, closeSettings } from "./close";

const settings: CloseSettings = {
  apiKey: "test-key",
  statusId: "stat_platform_user",
  fieldIds: { leadSource: "cf_source", grandfathered: "cf_gf" },
};

type Call = { url: string; init: RequestInit };

function fakeFetch(responses: (Response | Error)[]) {
  const calls: Call[] = [];
  const impl = async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const next = responses.shift();
    if (!next) throw new Error("unexpected call");
    if (next instanceof Error) throw next;
    return next;
  };
  return { impl, calls };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const bodyOf = (call: Call | undefined) => JSON.parse(String(call?.init.body));

const fields = { "custom.cf_co": "Muster GmbH" };

describe("closeSettings", () => {
  test("is off without an API key", () => {
    expect(closeSettings({ CLOSE_FIELD_IDS: {} })).toBeNull();
  });

  test("passes the normalised values through", () => {
    expect(
      closeSettings({
        CLOSE_API_KEY: "k",
        CLOSE_SIGNUP_STATUS_ID: "stat_x",
        CLOSE_FIELD_IDS: { logins: "cf_l" },
      }),
    ).toEqual({ apiKey: "k", statusId: "stat_x", fieldIds: { logins: "cf_l" } });
  });
});

describe("findContact", () => {
  test("returns the lead and contact holding exactly this address, whatever its case", async () => {
    const { impl, calls } = fakeFetch([
      json({
        data: [
          {
            id: "cont_2",
            lead_id: "lead_2",
            emails: [{ email: "jane.doe@example.test.other" }],
          },
          {
            id: "cont_1",
            lead_id: "lead_1",
            emails: [{ email: "jane.doe@example.test" }],
          },
        ],
      }),
    ]);
    const found = await closeClient(settings, impl).findContact("Jane.Doe@Example.test");
    expect(found).toEqual({ ok: true, value: { leadId: "lead_1", contactId: "cont_1" } });
    expect(calls[0]?.url).toBe("https://api.close.com/api/v1/data/search/");
    expect(new Headers(calls[0]?.init.headers).get("Authorization")).toBe(
      `Basic ${Buffer.from("test-key:").toString("base64")}`,
    );
  });

  test("a near match from the word search is not the same person", async () => {
    const { impl } = fakeFetch([
      json({
        data: [{ id: "c", lead_id: "l", emails: [{ email: "jane@example.test.other" }] }],
      }),
    ]);
    expect(await closeClient(settings, impl).findContact("jane@example.test")).toEqual({
      ok: true,
      value: null,
    });
  });

  test("a 2xx in an unexpected shape is an outage, not 'nobody found'", async () => {
    const { impl } = fakeFetch([json({ results: [] })]);
    const found = await closeClient(settings, impl).findContact("jane@example.test");
    expect(found).toMatchObject({ ok: false, kind: "unavailable" });
  });

  test("a non-JSON 2xx is an outage", async () => {
    const { impl } = fakeFetch([
      new Response("<html>maintenance</html>", { status: 200 }),
    ]);
    const found = await closeClient(settings, impl).findContact("jane@example.test");
    expect(found).toMatchObject({ ok: false, kind: "unavailable" });
  });
});

describe("createLead", () => {
  test("puts person fields on the contact and company fields on the lead", async () => {
    const { impl, calls } = fakeFetch([json({ id: "lead_9", contact_ids: ["cont_9"] })]);
    const created = await closeClient(settings, impl).createLead(
      { name: "Jane Doe", email: "jane@example.test" },
      { contact: { "custom.cf_gf": "Yes" }, lead: { "custom.cf_co": "Muster GmbH" } },
    );
    expect(created).toEqual({
      ok: true,
      value: { leadId: "lead_9", contactId: "cont_9" },
    });
    expect(bodyOf(calls[0])).toEqual({
      name: "Jane Doe",
      description: "Signed up on the platform.",
      contacts: [
        {
          name: "Jane Doe",
          emails: [{ email: "jane@example.test", type: "office" }],
          "custom.cf_gf": "Yes",
        },
      ],
      status_id: "stat_platform_user",
      "custom.cf_source": "Platform signup",
      "custom.cf_co": "Muster GmbH",
    });
  });

  test("a response without a contact is an outage", async () => {
    const { impl } = fakeFetch([json({ id: "lead_9", contact_ids: [] })]);
    const created = await closeClient(settings, impl).createLead(
      { name: "J", email: "j@example.test" },
      { contact: {}, lead: {} },
    );
    expect(created).toMatchObject({ ok: false, kind: "unavailable" });
  });
});

describe("following a contact", () => {
  test("getContact answers where the contact sits now, or null once it is deleted", async () => {
    const { impl, calls } = fakeFetch([
      json({ id: "cont_1", lead_id: "lead_merged" }),
      json({ error: "not found" }, 404),
    ]);
    const close = closeClient(settings, impl);
    expect(await close.getContact("cont_1")).toEqual({
      ok: true,
      value: { leadId: "lead_merged", contactId: "cont_1" },
    });
    expect(calls[0]?.init.method).toBe("GET");
    expect(await close.getContact("cont_1")).toEqual({ ok: true, value: null });
  });

  test("leadContactCount counts what is left on a lead, null when it is gone", async () => {
    const { impl } = fakeFetch([
      json({ id: "lead_1", contact_ids: ["cont_2"] }),
      json({ error: "not found" }, 404),
    ]);
    const close = closeClient(settings, impl);
    expect(await close.leadContactCount("lead_1")).toEqual({ ok: true, value: 1 });
    expect(await close.leadContactCount("lead_1")).toEqual({ ok: true, value: null });
  });
});

describe("refusals and outages", () => {
  test("a 400 is a refusal naming the fields, never their values", async () => {
    const { impl } = fakeFetch([
      json(
        {
          error: "jane@example.test is not valid",
          "field-errors": { "custom.cf_gf": "Maybe is not a choice" },
        },
        400,
      ),
    ]);
    const updated = await closeClient(settings, impl).updateContact("cont_1", {
      "custom.cf_gf": "Maybe",
    });
    expect(updated).toEqual({
      ok: false,
      kind: "rejected",
      detail: "HTTP 400: custom.cf_gf",
      status: 400,
      fields: ["custom.cf_gf"],
    });
  });

  test("a refused key, a rate limit and a 5xx are outages", async () => {
    for (const status of [401, 429, 503]) {
      const { impl } = fakeFetch([json({ error: "x" }, status)]);
      const updated = await closeClient(settings, impl).updateLead("lead_1", fields);
      expect(updated).toMatchObject({ ok: false, kind: "unavailable", status });
    }
  });

  test("a network error is an outage and does not throw", async () => {
    const { impl } = fakeFetch([new Error("network down")]);
    const updated = await closeClient(settings, impl).updateLead("lead_1", fields);
    expect(updated).toMatchObject({ ok: false, kind: "unavailable" });
  });
});

describe("updates and deletes", () => {
  test("updateLead and updateContact PUT only the fields given", async () => {
    const { impl, calls } = fakeFetch([json({ id: "lead_1" }), json({ id: "cont_1" })]);
    const close = closeClient(settings, impl);
    await close.updateLead("lead_1", { "custom.cf_co": null });
    await close.updateContact("cont_1", { "custom.cf_gf": "No" });
    expect(calls.map((c) => `${c.init.method} ${c.url}`)).toEqual([
      "PUT https://api.close.com/api/v1/lead/lead_1/",
      "PUT https://api.close.com/api/v1/contact/cont_1/",
    ]);
    expect(bodyOf(calls[0])).toEqual({ "custom.cf_co": null });
    expect(bodyOf(calls[1])).toEqual({ "custom.cf_gf": "No" });
  });

  test("nothing to write means no call", async () => {
    const { impl, calls } = fakeFetch([]);
    const close = closeClient(settings, impl);
    expect(await close.updateLead("lead_1", {})).toEqual({ ok: true, value: null });
    expect(await close.updateContact("cont_1", {})).toEqual({ ok: true, value: null });
    expect(calls).toHaveLength(0);
  });

  test("a delete of something already gone counts as done", async () => {
    const { impl } = fakeFetch([json({ error: "not found" }, 404)]);
    expect(await closeClient(settings, impl).deleteContact("cont_1")).toEqual({
      ok: true,
      value: null,
    });
  });

  test("ids are escaped into the path", async () => {
    const { impl, calls } = fakeFetch([json({})]);
    await closeClient(settings, impl).deleteLead("lead/../x");
    expect(calls[0]?.url).toBe("https://api.close.com/api/v1/lead/lead%2F..%2Fx/");
  });
});
