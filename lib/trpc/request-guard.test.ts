import { describe, expect, test } from "bun:test";
import { checkTransport } from "./request-guard";

const check = (method: string, headers: Record<string, string> = {}) =>
  checkTransport(method, new Headers(headers));

describe("tRPC transport guard", () => {
  test("the app's own JSON POST passes, with or without a charset", () => {
    expect(check("POST", { "content-type": "application/json" })).toEqual({ ok: true });
    expect(
      check("POST", {
        "content-type": "application/json; charset=utf-8",
        "sec-fetch-site": "same-origin",
      }),
    ).toEqual({ ok: true });
  });

  test("a server-side JSON POST with no Sec-Fetch-Site passes", () => {
    expect(check("POST", { "content-type": "Application/JSON" }).ok).toBe(true);
  });

  test("a form a browser sends without a preflight is refused with 415", () => {
    for (const contentType of [
      "multipart/form-data; boundary=----x",
      "application/x-www-form-urlencoded",
      "text/plain",
    ]) {
      expect(check("POST", { "content-type": contentType })).toMatchObject({
        ok: false,
        status: 415,
      });
    }
  });

  test("a POST with no or an unparseable content type is refused with 415", () => {
    expect(check("POST")).toMatchObject({ ok: false, status: 415 });
    expect(check("POST", { "content-type": "json" })).toMatchObject({
      ok: false,
      status: 415,
    });
  });

  test("a cross-site POST is refused with 403, even as JSON", () => {
    expect(
      check("POST", {
        "content-type": "application/json",
        "sec-fetch-site": "cross-site",
      }),
    ).toMatchObject({ ok: false, status: 403 });
  });

  test("reads stay open, cross-site included", () => {
    expect(check("GET")).toEqual({ ok: true });
    expect(check("GET", { "sec-fetch-site": "cross-site" })).toEqual({ ok: true });
    expect(check("HEAD")).toEqual({ ok: true });
  });
});
