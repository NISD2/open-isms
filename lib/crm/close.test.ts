/**
 * The Close sync runs inside sign-in, so the tests pin the two things that
 * matter most: it does nothing without a key, and no answer from Close can
 * throw back into the signup.
 */
import { describe, expect, test } from "bun:test";
import { type CloseSettings, closeSettings, pushSignupToClose } from "./close";

const settings: CloseSettings = {
  apiKey: "test-key",
  statusId: "stat_platform_user",
  customFields: { cf_source: "Platform signup" },
};

const signup = { email: "Jane.Doe@Example.test", name: "Jane Doe", provider: "google" };

type Call = { url: string; init: RequestInit };

function fakeFetch(responses: Response[]) {
  const calls: Call[] = [];
  const impl = async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const next = responses.shift();
    if (!next) throw new Error("unexpected call");
    return next;
  };
  return { impl, calls };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("closeSettings", () => {
  test("is off without an API key", () => {
    expect(closeSettings({})).toBeNull();
    expect(closeSettings({ CLOSE_API_KEY: "  " })).toBeNull();
  });

  test("reads status and custom fields", () => {
    expect(
      closeSettings({
        CLOSE_API_KEY: "k",
        CLOSE_SIGNUP_STATUS_ID: "stat_x",
        CLOSE_SIGNUP_CUSTOM_FIELDS: '{"cf_a":"Platform signup","cf_b":3}',
      }),
    ).toEqual({
      apiKey: "k",
      statusId: "stat_x",
      customFields: { cf_a: "Platform signup" },
    });
  });

  test("drops custom fields that are not a JSON object instead of failing", () => {
    expect(
      closeSettings({ CLOSE_API_KEY: "k", CLOSE_SIGNUP_CUSTOM_FIELDS: "not json" }),
    ).toEqual({
      apiKey: "k",
      statusId: undefined,
      customFields: {},
    });
  });
});

describe("pushSignupToClose", () => {
  test("does nothing when switched off", async () => {
    const { impl, calls } = fakeFetch([]);
    expect(await pushSignupToClose(signup, null, impl)).toBe("disabled");
    expect(calls).toHaveLength(0);
  });

  test("creates a lead with status, contact and custom fields", async () => {
    const { impl, calls } = fakeFetch([json({ data: [] }), json({ id: "lead_1" })]);
    expect(await pushSignupToClose(signup, settings, impl)).toBe("created");

    expect(calls[1]?.url).toBe("https://api.close.com/api/v1/lead/");
    const body = JSON.parse(String(calls[1]?.init.body));
    expect(body).toEqual({
      name: "Jane Doe",
      description: "Signed up on the platform via google.",
      contacts: [{ name: "Jane Doe", emails: [{ email: signup.email, type: "office" }] }],
      status_id: "stat_platform_user",
      "custom.cf_source": "Platform signup",
    });
    const auth = new Headers(calls[1]?.init.headers).get("Authorization");
    expect(auth).toBe(`Basic ${Buffer.from("test-key:").toString("base64")}`);
  });

  test("skips an address Close already holds, whatever its case", async () => {
    const { impl, calls } = fakeFetch([
      json({ data: [{ id: "cont_1", emails: [{ email: "jane.doe@example.test" }] }] }),
    ]);
    expect(await pushSignupToClose(signup, settings, impl)).toBe("exists");
    expect(calls).toHaveLength(1);
  });

  test("does not treat a near match from the word search as the same person", async () => {
    const { impl } = fakeFetch([
      json({
        data: [{ id: "cont_2", emails: [{ email: "jane.doe@example.test.other" }] }],
      }),
      json({ id: "lead_2" }),
    ]);
    expect(await pushSignupToClose(signup, settings, impl)).toBe("created");
  });

  test("falls back to the email as the name", async () => {
    const { impl, calls } = fakeFetch([json({ data: [] }), json({ id: "lead_3" })]);
    await pushSignupToClose({ ...signup, name: null }, settings, impl);
    expect(JSON.parse(String(calls[1]?.init.body)).name).toBe(signup.email);
  });

  test("never throws: an error from Close becomes 'failed'", async () => {
    const { impl } = fakeFetch([json({ error: "nope" }, 401)]);
    expect(await pushSignupToClose(signup, settings, impl)).toBe("failed");

    const down = async () => {
      throw new Error("network down");
    };
    expect(await pushSignupToClose(signup, settings, down)).toBe("failed");
  });
});
