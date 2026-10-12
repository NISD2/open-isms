import { describe, expect, test } from "bun:test";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { describeError } from "./errors";

describe("what an assistant reads of an error", () => {
  test("a refusal reads as written, a failed check as its fields", () => {
    expect(
      describeError(new TRPCError({ code: "FORBIDDEN", message: "Not yours." })),
    ).toBe("Not yours.");
    const check = z.object({ name: z.string() }).safeParse({});
    if (check.success) throw new Error("expected a failed check");
    expect(describeError(check.error)).toContain("name");
  });

  test("an internal error, which may carry a failed query's values, reads as nothing", () => {
    const failed = new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed query: insert into supplier ... params: Example Supplier GmbH",
    });
    expect(describeError(failed)).toBeNull();
    expect(describeError(new Error("anything else"))).toBeNull();
  });
});
