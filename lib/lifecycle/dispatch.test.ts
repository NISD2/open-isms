/**
 * The claim/release protocol is the one part of this subsystem no other
 * environment can execute: the dev suppression gate returns `skipped` before
 * any claim in dev AND e2e, so without these mocks its first-ever execution
 * would be against production users. This file pins the delivery contract:
 * claim before send, conflict means skip, suppressed means release, failure
 * keeps the claim (marked), opt-out re-check wins, cap defers.
 */
import { describe, expect, mock, test } from "bun:test";
import type { DbOrTx } from "@/lib/db";
import type { LifecycleEmailType, PreparedLifecycleEmail } from "./types";

// ---------------------------------------------------------------------------
// Module mocks — registered before dispatch is imported.
// ---------------------------------------------------------------------------

type SendResult =
  | { success: true; id: string | undefined }
  | { success: false; error: unknown };

/** Shared call sequence so ordering (claim before send) is assertable. */
const sequence: string[] = [];
let sendResult: SendResult = { success: true, id: "resend-id" };
let suppression: "dev-blocked" | "disabled" | "no-api-key" | null = null;

const sendMail = mock(async (opts: { idempotencyKey?: string }) => {
  sequence.push(`send:${opts.idempotencyKey ?? "no-key"}`);
  return sendResult;
});

// Relative specifiers on purpose: they resolve to the same files dispatch.ts
// imports via "@/...", and a mock registered under a specifier that fails to
// resolve would silently not apply.
const SUPPRESSED = new Set(["dev-blocked", "disabled", "no-api-key", "dev-stub"]);
mock.module("../mail/send", () => ({
  sendMail,
  sendWelcomeEmail: async () => ({ success: true, id: "unused" }),
  mailSuppressionReason: () => suppression,
  isSuppressedSendId: (id: string | undefined) => id !== undefined && SUPPRESSED.has(id),
}));

const logAudit = mock((_row: { action: string; userId: string | null }) => {});
mock.module("../audit", () => ({ logAudit }));

// dispatch.ts imports mailSupportEmail from @/lib/env, and lib/env.ts
// validates process.env at module load. CI runs the unit suite with no .env
// (main's tests never evaluate lib/env — that is the invariant this mock
// preserves). Full export shape: env + mailSupportEmail.
mock.module("../env", () => ({
  env: {
    DATABASE_URL: "postgres://unused:unused@localhost:5432/unused",
    AUTH_SECRET: "test-secret-test-secret-test-secret",
  },
  mailSupportEmail: () => "support@example.com",
}));

// One stable array the mocked module hands out; tests swap its CONTENTS so
// dispatch's imported binding always sees the current fixture.
const registryTypes: LifecycleEmailType[] = [];
function setTypes(...types: LifecycleEmailType[]) {
  registryTypes.splice(0, registryTypes.length, ...types);
}
mock.module("./registry", () => ({ LIFECYCLE_EMAIL_TYPES: registryTypes }));

const { runLifecycleEmails } = await import("./dispatch");

// ---------------------------------------------------------------------------
// Fake db — the narrow surface deliverOne touches, with call recording.
// ---------------------------------------------------------------------------

function makeDb(opts: { conflict?: boolean; followupsDisabled?: boolean } = {}) {
  const inserted: Array<Record<string, unknown>> = [];
  const updated: Array<Record<string, unknown>> = [];
  let deletes = 0;
  let claimCounter = 0;

  const db = {
    query: {
      user: {
        findFirst: async () => ({
          emailFollowupsDisabled: opts.followupsDisabled ?? false,
        }),
      },
    },
    insert: () => ({
      values: (values: Record<string, unknown>) => ({
        onConflictDoNothing: () => ({
          returning: async () => {
            if (opts.conflict) return [];
            inserted.push(values);
            claimCounter++;
            sequence.push(`claim:${claimCounter}`);
            return [{ id: `claim-${claimCounter}` }];
          },
        }),
      }),
    }),
    update: () => ({
      set: (values: Record<string, unknown>) => ({
        where: () => {
          updated.push(values);
          return Promise.resolve([]);
        },
      }),
    }),
    delete: () => ({
      where: () => {
        deletes++;
        sequence.push("release");
        return Promise.resolve([]);
      },
    }),
  };

  return {
    db: db as unknown as DbOrTx,
    inserted,
    updated,
    deletes: () => deletes,
  };
}

function prepared(n: number): PreparedLifecycleEmail[] {
  return Array.from({ length: n }, (_, i) => ({
    userId: `user-${i}`,
    companyId: `company-${i}`,
    to: `user-${i}@example.com`,
    subject: `Subject ${i}`,
    html: "<p>x</p>",
    text: "x",
    linkUrl: "https://example.com/journey",
    note: "GOV-1",
    unsubscribeUrl: "https://example.com/unsub",
  }));
}

function stubType(emails: PreparedLifecycleEmail[]): LifecycleEmailType {
  return {
    key: "test_type_v1",
    description: "test",
    prepare: async () => emails,
  };
}

function reset() {
  sequence.length = 0;
  sendMail.mockClear();
  logAudit.mockClear();
  sendResult = { success: true, id: "resend-id" };
  suppression = null;
  registryTypes.length = 0;
}

const FAST = { sendIntervalMs: 0 };

describe("runLifecycleEmails", () => {
  test("suppressed transport skips the whole run and claims nothing", async () => {
    reset();
    suppression = "no-api-key";
    setTypes(stubType(prepared(2)));
    const { db } = makeDb();

    const result = await runLifecycleEmails(db, FAST);

    expect("skipped" in result && result.skipped).toContain("no-api-key");
    expect(sequence).toEqual([]);
  });

  test("claims BEFORE sending, one claim per recipient, idempotency key from the claim", async () => {
    reset();
    setTypes(stubType(prepared(2)));
    const { db, inserted } = makeDb();

    const result = await runLifecycleEmails(db, FAST);

    expect(sequence).toEqual([
      "claim:1",
      "send:lifecycle/claim-1",
      "claim:2",
      "send:lifecycle/claim-2",
    ]);
    if (result.skipped !== undefined) throw new Error("unexpected skip");
    expect(result.types.test_type_v1).toMatchObject({ prepared: 2, sent: 2, failed: 0 });
    expect(inserted[0]).toMatchObject({
      entityType: "lifecycle_email",
      triggerField: "test_type_v1",
      channel: "email",
      status: "sent",
      recipientId: "user-0",
      entityId: "user-0",
    });
  });

  test("a conflicting claim means someone else sent: no email goes out", async () => {
    reset();
    setTypes(stubType(prepared(1)));
    const { db } = makeDb({ conflict: true });

    const result = await runLifecycleEmails(db, FAST);

    if (result.skipped !== undefined) throw new Error("unexpected skip");
    expect(result.types.test_type_v1).toMatchObject({ alreadyClaimed: 1, sent: 0 });
    expect(sendMail).toHaveBeenCalledTimes(0);
  });

  test("opt-out re-check at claim time wins over the prepare() snapshot", async () => {
    reset();
    setTypes(stubType(prepared(1)));
    const { db, inserted } = makeDb({ followupsDisabled: true });

    const result = await runLifecycleEmails(db, FAST);

    if (result.skipped !== undefined) throw new Error("unexpected skip");
    expect(result.types.test_type_v1).toMatchObject({ optedOut: 1, sent: 0 });
    expect(inserted).toHaveLength(0);
    expect(sendMail).toHaveBeenCalledTimes(0);
  });

  test("a suppressed send id releases the claim (provably nothing left the box)", async () => {
    reset();
    sendResult = { success: true, id: "no-api-key" };
    setTypes(stubType(prepared(1)));
    const { db, deletes } = makeDb();

    const result = await runLifecycleEmails(db, FAST);

    if (result.skipped !== undefined) throw new Error("unexpected skip");
    expect(result.types.test_type_v1).toMatchObject({ released: 1, sent: 0 });
    expect(deletes()).toBe(1);
  });

  test("a failed send keeps the claim, marks it, audits with a null userId", async () => {
    reset();
    sendResult = { success: false, error: "boom" };
    setTypes(stubType(prepared(1)));
    const { db, deletes, updated } = makeDb();

    const result = await runLifecycleEmails(db, FAST);

    if (result.skipped !== undefined) throw new Error("unexpected skip");
    expect(result.types.test_type_v1).toMatchObject({ failed: 1, sent: 0 });
    expect(deletes()).toBe(0);
    expect(updated).toContainEqual({ urgency: "warning" });
    expect(logAudit).toHaveBeenCalledTimes(1);
    const audit = logAudit.mock.calls[0][0];
    expect(audit.action).toBe("email.lifecycle_failed");
    expect(audit.userId).toBeNull();
  });

  test("dryRun renders the batch but claims nothing and sends nothing", async () => {
    reset();
    setTypes(stubType(prepared(3)));
    const { db, inserted } = makeDb();

    const result = await runLifecycleEmails(db, { ...FAST, dryRun: true });

    if (result.skipped !== undefined) throw new Error("unexpected skip");
    const stats = result.types.test_type_v1;
    expect(stats).toMatchObject({ prepared: 3, sent: 0, failed: 0 });
    expect(stats.wouldSend).toEqual([
      { userId: "user-0", to: "user-0@example.com", subject: "Subject 0" },
      { userId: "user-1", to: "user-1@example.com", subject: "Subject 1" },
      { userId: "user-2", to: "user-2@example.com", subject: "Subject 2" },
    ]);
    expect(inserted).toHaveLength(0);
    expect(sendMail).toHaveBeenCalledTimes(0);
  });

  test("onlyUserId narrows the run to that one recipient and sends nobody else", async () => {
    reset();
    setTypes(stubType(prepared(3)));
    const { db } = makeDb();

    const result = await runLifecycleEmails(db, { ...FAST, onlyUserId: "user-1" });

    if (result.skipped !== undefined) throw new Error("unexpected skip");
    expect(result.types.test_type_v1).toMatchObject({
      prepared: 1,
      sent: 1,
      deferred: 0,
    });
    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(sendMail.mock.calls[0][0].to).toBe("user-1@example.com");
  });

  test("onlyUserId with a user outside the prepared batch sends nothing", async () => {
    reset();
    setTypes(stubType(prepared(2)));
    const { db } = makeDb();

    const result = await runLifecycleEmails(db, { ...FAST, onlyUserId: "stranger" });

    if (result.skipped !== undefined) throw new Error("unexpected skip");
    expect(result.types.test_type_v1).toMatchObject({ prepared: 0, sent: 0 });
    expect(sendMail).toHaveBeenCalledTimes(0);
  });

  test("maxPerType lowers the batch for a manual ramp and cannot raise it", async () => {
    reset();
    setTypes(stubType(prepared(5)));
    const { db } = makeDb();

    const result = await runLifecycleEmails(db, { ...FAST, maxPerType: 2 });

    if (result.skipped !== undefined) throw new Error("unexpected skip");
    expect(result.types.test_type_v1).toMatchObject({
      prepared: 5,
      sent: 2,
      deferred: 3,
    });

    reset();
    setTypes(stubType(prepared(105)));
    const big = makeDb();
    const capped = await runLifecycleEmails(big.db, { ...FAST, maxPerType: 5000 });
    if (capped.skipped !== undefined) throw new Error("unexpected skip");
    expect(capped.types.test_type_v1).toMatchObject({ sent: 100, deferred: 5 });
  });

  test("the per-run cap sends 100 and reports the rest as deferred", async () => {
    reset();
    setTypes(stubType(prepared(105)));
    const { db } = makeDb();

    const result = await runLifecycleEmails(db, FAST);

    if (result.skipped !== undefined) throw new Error("unexpected skip");
    expect(result.types.test_type_v1).toMatchObject({
      prepared: 105,
      sent: 100,
      deferred: 5,
    });
  });

  test("a type whose prepare throws is reported, not thrown", async () => {
    reset();
    setTypes({
      key: "broken_type_v1",
      description: "broken",
      prepare: async () => {
        throw new Error("schema changed");
      },
    });
    const { db } = makeDb();

    const result = await runLifecycleEmails(db, FAST);

    if (result.skipped !== undefined) throw new Error("unexpected skip");
    expect(result.types.broken_type_v1.error).toBe("schema changed");
    expect(result.types.broken_type_v1.sent).toBe(0);
  });

  test("overlapping invocations: the second run is skipped, not interleaved", async () => {
    reset();
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    setTypes({
      key: "slow_type_v1",
      description: "slow",
      prepare: async () => {
        await gate;
        return prepared(1);
      },
    });
    const { db } = makeDb();

    const first = runLifecycleEmails(db, FAST);
    const second = await runLifecycleEmails(db, FAST);
    expect("skipped" in second && second.skipped).toContain("already in progress");

    release?.();
    const firstResult = await first;
    if (firstResult.skipped !== undefined) throw new Error("unexpected skip");
    expect(firstResult.types.slow_type_v1.sent).toBe(1);

    // The guard clears after completion: a follow-up run proceeds.
    setTypes(stubType(prepared(0)));
    const third = await runLifecycleEmails(db, FAST);
    expect(third.skipped).toBeUndefined();
  });
});
