/**
 * What the automatic audit row keeps of a mutation's input: a failed call keeps
 * none, a successful one keeps it scrubbed and bounded. Built with a recording
 * logAudit, as in audit-scope.test.ts, so module order cannot change the result.
 */
import { describe, expect, test } from "bun:test";
import type { AuditEntry } from "@nisd2/isms-trpc/audit";
import {
  AUDIT_INPUT_MAX_BYTES,
  type BaseContext,
  createTRPCSetup,
} from "@nisd2/isms-trpc/init";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

const MEMBER = "22222222-2222-4222-8222-222222222222";
const COMPANY = "33333333-3333-4333-8333-333333333333";
const RECORD = "44444444-4444-4444-8444-444444444444";

function harness() {
  const logged: AuditEntry[] = [];
  const t = createTRPCSetup<BaseContext>({
    logAudit: async (entry) => {
      logged.push(entry);
    },
    hasReviewAccess: () => true,
  });
  const appRouter = t.router({
    record: t.router({
      save: t.protectedProcedure.input(z.unknown()).mutation(() => "ok"),
      strict: t.protectedProcedure
        .input(z.object({ id: z.string().uuid(), title: z.string().max(10) }))
        .mutation(() => "ok"),
      refuse: t.protectedProcedure.input(z.unknown()).mutation(() => {
        throw new TRPCError({ code: "FORBIDDEN" });
      }),
    }),
  });
  const caller = t.createCallerFactory(appRouter)({
    session: { user: { id: MEMBER }, role: "member", companyId: COMPANY },
    userId: MEMBER,
    companyId: COMPANY,
    ip: "unknown",
    userAgent: null,
  });
  return { logged, caller };
}

describe("a failed mutation's row", () => {
  test("keeps the attempt and the record, not the input", async () => {
    const { logged, caller } = harness();

    await expect(
      caller.record.refuse({ id: RECORD, note: "sent by the caller" }),
    ).rejects.toThrow();

    expect(logged).toHaveLength(1);
    expect(logged[0]?.action).toBe("record.refuse");
    expect(logged[0]?.description).toBe("record.refuse failed (FORBIDDEN)");
    expect(logged[0]?.entityId).toBe(RECORD);
    expect(logged[0]?.newValue).toBeUndefined();
  });

  test("input the schema refuses is not stored", async () => {
    const { logged, caller } = harness();

    await expect(
      caller.record.strict({
        id: RECORD,
        title: "far longer than ten",
        extra: "not in the schema",
      }),
    ).rejects.toThrow();

    expect(logged[0]?.description).toBe("record.strict failed (BAD_REQUEST)");
    expect(logged[0]?.newValue).toBeUndefined();
  });
});

describe("a successful mutation's row", () => {
  test("keeps an ordinary input as before", async () => {
    const { logged, caller } = harness();

    await caller.record.save({ id: RECORD, title: "Backup policy", owner: "IT" });

    expect(logged[0]?.description).toBe("record.save");
    expect(logged[0]?.newValue).toEqual({
      id: RECORD,
      title: "Backup policy",
      owner: "IT",
    });
  });

  test("still redacts secrets", async () => {
    const { logged, caller } = harness();

    await caller.record.save({ id: RECORD, password: "placeholder-not-a-secret" });

    expect(logged[0]?.newValue).toEqual({ id: RECORD, password: "[REDACTED]" });
  });

  test("an input over the cap keeps its size and field names only", async () => {
    const { logged, caller } = harness();
    const pasted = "x".repeat(AUDIT_INPUT_MAX_BYTES);

    await caller.record.save({ id: RECORD, summary: pasted, owner: "IT" });

    const row = logged[0]?.newValue as {
      truncated: boolean;
      bytes: number;
      fields: string[];
    };
    expect(row.truncated).toBe(true);
    expect(row.bytes).toBeGreaterThan(AUDIT_INPUT_MAX_BYTES);
    expect(row.fields).toEqual(["id", "summary", "owner"]);
    expect(JSON.stringify(row)).not.toContain("xxxx");
  });

  test("an input at the cap is kept whole", async () => {
    const { logged, caller } = harness();
    const overhead = JSON.stringify({ summary: "" }).length;
    const exact = { summary: "y".repeat(AUDIT_INPUT_MAX_BYTES - overhead) };

    await caller.record.save(exact);

    expect(logged[0]?.newValue).toEqual(exact);
  });
});
