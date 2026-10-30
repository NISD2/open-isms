/**
 * What the automatic audit row keeps of a mutation's input: a failed call keeps
 * none, a successful one keeps it scrubbed and bounded. Built with a recording
 * logAudit, as in audit-scope.test.ts, so module order cannot change the result.
 */
import { describe, expect, spyOn, test } from "bun:test";
import { type AuditDb, type AuditEntry, createLogAudit } from "@nisd2/isms-trpc/audit";
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
      fieldCount: number;
      fields: string[];
    };
    expect(row.truncated).toBe(true);
    expect(row.bytes).toBeGreaterThan(AUDIT_INPUT_MAX_BYTES);
    expect(row.fieldCount).toBe(3);
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

  test("huge field names and many fields stay within the names budget", async () => {
    const { logged, caller } = harness();
    const input: Record<string, number> = { ["k".repeat(1_000_000)]: 1 };
    for (let i = 0; i < 50_000; i++) input[`f${i}`] = i;

    await caller.record.save(input);

    const row = logged[0]?.newValue as { fieldCount: number; fields: string[] };
    expect(row.fieldCount).toBe(50_001);
    expect(row.fields).toHaveLength(50);
    expect(row.fields[0]).toHaveLength(64);
    expect(JSON.stringify(row).length).toBeLessThan(5_000);
  });

  test("names that would still exceed the budget are dropped, the count kept", async () => {
    const { logged, caller } = harness();
    // 64 four-byte characters per name: 50 of them are over 4 KB.
    const input = Object.fromEntries(
      Array.from({ length: 60 }, (_, i) => [`${i}${"😀".repeat(70)}`, i]),
    );
    input.filler = "z".repeat(AUDIT_INPUT_MAX_BYTES);

    await caller.record.save(input);

    const row = logged[0]?.newValue as Record<string, unknown>;
    expect(row.fieldCount).toBe(61);
    expect(row.fields).toBeUndefined();
  });

  test("a BigInt input leaves a row with its field names", async () => {
    const { logged, caller } = harness();

    await caller.record.save({ id: RECORD, amount: 10n });

    expect(logged).toHaveLength(1);
    expect(logged[0]?.newValue).toEqual({
      truncated: true,
      bytes: null,
      fieldCount: 2,
      fields: ["id", "amount"],
    });
  });

  test("a circular input leaves a row, the cycle marked", async () => {
    const { logged, caller } = harness();
    const node: Record<string, unknown> = { id: RECORD, title: "Loop" };
    node.self = node;
    node.list = [node];

    await caller.record.save(node);

    expect(logged).toHaveLength(1);
    expect(logged[0]?.newValue).toEqual({
      id: RECORD,
      title: "Loop",
      self: "[CIRCULAR]",
      list: ["[CIRCULAR]"],
    });
  });

  test("a shared object deep in a chain is walked once, not doubled per level", async () => {
    const { logged, caller } = harness();
    let level: Record<string, unknown> = { leaf: true };
    for (let i = 0; i < 64; i++) level = { a: level, b: level };

    await caller.record.save(level);

    expect(logged).toHaveLength(1);
    expect(JSON.stringify(logged[0]?.newValue)).toContain("[REPEATED]");
  });

  test("an input the log cannot walk still leaves a marked row", async () => {
    const { logged, caller } = harness();
    const input = { id: RECORD };
    Object.defineProperty(input, "boom", {
      enumerable: true,
      get() {
        throw new Error("getter refused");
      },
    });

    await caller.record.save(input);

    expect(logged).toHaveLength(1);
    expect(logged[0]?.description).toBe("record.save");
    expect(logged[0]?.newValue).toEqual({ unloggable: true });
  });
});

describe("a non-uuid record id on a failed call", () => {
  test("is dropped from the row and its text never reaches the warning", async () => {
    const rows: Record<string, unknown>[] = [];
    // A stand-in for drizzle: logAudit only calls insert(table).values(row).
    const fakeDb = {
      insert: () => ({
        values: async (row: Record<string, unknown>) => {
          rows.push(row);
        },
      }),
    } as unknown as AuditDb;
    const t = createTRPCSetup<BaseContext>({
      logAudit: createLogAudit(fakeDb),
      hasReviewAccess: () => true,
    });
    const router = t.router({
      refuse: t.protectedProcedure.input(z.unknown()).mutation(() => {
        throw new TRPCError({ code: "FORBIDDEN" });
      }),
    });
    const caller = t.createCallerFactory(router)({
      session: { user: { id: MEMBER }, role: "member", companyId: COMPANY },
      userId: MEMBER,
      companyId: COMPANY,
      ip: "unknown",
      userAgent: null,
    });
    const warn = spyOn(console, "warn").mockImplementation(() => {});
    const sent = "caller text that must not be logged";

    try {
      await expect(caller.refuse({ id: sent })).rejects.toThrow();
      await Bun.sleep(0);

      expect(rows).toHaveLength(1);
      expect(rows[0]?.entityId).toBeNull();
      expect(rows[0]?.description).toBe("refuse failed (FORBIDDEN)");
      expect(warn).toHaveBeenCalledTimes(1);
      expect(JSON.stringify(warn.mock.calls)).not.toContain(sent);
      expect(JSON.stringify(warn.mock.calls)).toContain(
        `"entityIdLength":${sent.length}`,
      );
    } finally {
      warn.mockRestore();
    }
  });
});
