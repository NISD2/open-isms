import { describe, expect, test } from "bun:test";
import { DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT } from "@/app/api/t/[slug]/route";
import { notFound } from "./endpoint";

const shape = async (res: Response) => ({
  status: res.status,
  body: await res.text(),
  headers: [...res.headers].sort(([a], [b]) => a.localeCompare(b)),
});

describe("the route", () => {
  test("answers every method but POST with the one 404 of the door", async () => {
    const expected = await shape(notFound());
    for (const handler of [GET, DELETE, PUT, PATCH, HEAD, OPTIONS]) {
      expect(await shape(await handler())).toEqual(expected);
    }
  });

  test("answers POST without a secret set, a key or an Origin with the same 404", async () => {
    const res = await POST(
      new Request("https://example.test/api/t/anything", { method: "POST", body: "{}" }),
      { params: Promise.resolve({ slug: "anything" }) },
    );
    expect(await shape(res)).toEqual(await shape(notFound()));
  });
});
