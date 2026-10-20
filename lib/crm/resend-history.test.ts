/**
 * The Resend list client: it reads the page, tells a key that cannot list apart from
 * an outage, and never throws.
 */
import { describe, expect, test } from "bun:test";
import { parseResendTime, resendClient } from "./resend-history";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const row = (id: string, created_at = "2026-10-20 20:14:55.292000+00") => ({
  id,
  from: "NISD2 <newsletter@nisd2.eu>",
  to: ["anna@example.test"],
  subject: "Subject",
  created_at,
  last_event: "delivered",
});

describe("parseResendTime", () => {
  test("reads Resend's space and two-digit offset", () => {
    expect(parseResendTime("2026-10-20 20:14:55.292000+00")?.toISOString()).toBe(
      "2026-10-20T20:14:55.292Z",
    );
  });

  test("reads an ISO time and refuses nonsense", () => {
    expect(parseResendTime("2026-10-20T20:14:55Z")?.toISOString()).toBe(
      "2026-10-20T20:14:55.000Z",
    );
    expect(parseResendTime("yesterday")).toBeNull();
  });
});

describe("resendClient.list", () => {
  test("returns the page and asks for the next one after a given id", async () => {
    const urls: string[] = [];
    const client = resendClient("key", async (url) => {
      urls.push(url);
      return json({ data: [row("re_1"), row("re_2")], has_more: true });
    });
    const page = await client.list("re_0");
    expect(page).toMatchObject({ ok: true, value: { hasMore: true } });
    expect(page.ok && page.value.mails.map((m) => m.id)).toEqual(["re_1", "re_2"]);
    expect(urls[0]).toBe("https://api.resend.com/emails?limit=100&after=re_0");
  });

  test("a key that cannot list is named as such and counts as unavailable", async () => {
    const client = resendClient("key", async () => json({ message: "restricted" }, 401));
    expect(await client.list()).toMatchObject({
      ok: false,
      kind: "unavailable",
      status: 401,
      detail: expect.stringContaining("limited to sending"),
    });
  });

  test("a rate limit and a server error are outages", async () => {
    for (const status of [429, 503]) {
      const client = resendClient("key", async () => json({}, status));
      expect(await client.list()).toMatchObject({ ok: false, kind: "unavailable" });
    }
  });

  test("a body that is not the documented shape is unavailable, not a crash", async () => {
    const client = resendClient("key", async () => json({ nope: true }));
    expect(await client.list()).toMatchObject({ ok: false, kind: "unavailable" });
  });

  test("a network failure never throws", async () => {
    const client = resendClient("key", async () => {
      throw new Error("offline");
    });
    expect(await client.list()).toMatchObject({ ok: false, kind: "unavailable" });
  });

  test("rows with a time that cannot be read are left out", async () => {
    const client = resendClient("key", async () =>
      json({ data: [row("re_1"), row("re_2", "garbled")], has_more: false }),
    );
    const page = await client.list();
    expect(page.ok && page.value.mails.map((m) => m.id)).toEqual(["re_1"]);
  });
});
