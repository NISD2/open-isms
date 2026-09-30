import { describe, expect, test } from "bun:test";
import {
  type BaseContext,
  createTRPCSetup,
  UNEXPECTED_ERROR_MESSAGE,
} from "@nisd2/isms-trpc";
import { TRPCError } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { z } from "zod";

// Through the real HTTP adapter, because the formatter only runs there: a server-side caller gets
// the TRPCError itself.
const { router, publicProcedure } = createTRPCSetup<BaseContext>({
  logAudit: async () => {},
  hasReviewAccess: () => false,
});

const LEAK = 'Failed query: select "email" from "user" where "id" = $1 params: 4f1c2e';
const SUBMITTED = "Kronjuwelen-Server-Passwort";

const testRouter = router({
  crashes: publicProcedure.query(() => {
    throw new Error(LEAK);
  }),
  refuses: publicProcedure.query(() => {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }),
  refusesWithCauseOnly: publicProcedure.query(() => {
    throw new TRPCError({ code: "CONFLICT", cause: new Error(LEAK) });
  }),
  failsOnPurpose: publicProcedure.query(() => {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Insert returned no rows",
    });
  }),
  validates: publicProcedure
    .input(z.object({ name: z.string().max(3) }))
    .mutation(({ input }) => input.name),
});

type ErrorBody = {
  error: { json: { message: string; data: Record<string, unknown> & { code: string } } };
};

async function call(path: string, init?: RequestInit) {
  const logged: string[] = [];
  const res = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req: new Request(`http://localhost/api/trpc/${path}`, init),
    router: testRouter,
    createContext: () => ({
      session: null,
      userId: null,
      companyId: null,
      ip: "unknown",
      userAgent: null,
    }),
    onError: ({ error }) => {
      logged.push(error.message);
    },
  });
  const body = (await res.json()) as ErrorBody;
  return { status: res.status, error: body.error.json, logged };
}

describe("tRPC error shape", () => {
  test("an unexpected error reaches the client as the generic line only", async () => {
    const { status, error, logged } = await call("crashes");
    expect(status).toBe(500);
    expect(error.data.code).toBe("INTERNAL_SERVER_ERROR");
    expect(error.message).toBe(UNEXPECTED_ERROR_MESSAGE);
    expect(JSON.stringify(error)).not.toContain("Failed query");
    // The route's onError still receives the original, so the server log keeps it.
    expect(logged).toEqual([LEAK]);
  });

  test("no stack, even outside production", async () => {
    const { error } = await call("crashes");
    expect(error.data.stack).toBeUndefined();
    expect(Object.keys(error.data).sort()).toEqual(["code", "httpStatus", "path"]);
  });

  test("a deliberate TRPCError keeps its message and code", async () => {
    const { status, error } = await call("refuses");
    expect(status).toBe(403);
    expect(error.data.code).toBe("FORBIDDEN");
    expect(error.message).toBe("Admin access required");
  });

  test("a message copied from the cause is replaced, the deliberate code is kept", async () => {
    const { status, error } = await call("refusesWithCauseOnly");
    expect(status).toBe(409);
    expect(error.data.code).toBe("CONFLICT");
    expect(error.message).toBe(UNEXPECTED_ERROR_MESSAGE);
  });

  test("a deliberate INTERNAL_SERVER_ERROR is generic too", async () => {
    const { error } = await call("failsOnPurpose");
    expect(error.message).toBe(UNEXPECTED_ERROR_MESSAGE);
  });

  test("input validation keeps the field and the rule, never the submitted value", async () => {
    const { status, error } = await call("validates", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ json: { name: SUBMITTED } }),
    });
    expect(status).toBe(400);
    expect(error.data.code).toBe("BAD_REQUEST");
    const issues = JSON.parse(error.message) as Array<{ path: string[]; code: string }>;
    expect(issues[0]?.path).toEqual(["name"]);
    expect(issues[0]?.code).toBe("too_big");
    expect(error.message).not.toContain(SUBMITTED);
  });
});
