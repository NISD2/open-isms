/**
 * Erasure matched audit rows on the user id alone. A failed email stores the
 * recipient's address with no user id, and the course-reminder cron wrote the
 * address into the description, so both survived the erasure that was meant
 * to remove them.
 */
import { describe, expect, test } from "bun:test";
import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import type { DbOrTx } from "@/lib/db";
import { redactPiiInJson } from "./redact-pii";
import { scrubAuditTrail } from "./scrub-audit-log";

const SUBJECT = "11111111-1111-4111-8111-111111111111";
const OPERATOR = "22222222-2222-4222-8222-222222222222";
const EMAIL = "Anna.Muster@Kunde.de";

type Row = {
  id: string;
  userId: string | null;
  description: string;
  previousValue: unknown;
  newValue: unknown;
};

function fakeTx(rows: Row[]) {
  const wheres: SQL[] = [];
  const updates: Array<{ id: string; values: Record<string, unknown> }> = [];
  const tx = {
    select: () => ({
      from: () => ({
        where: async (where: SQL) => {
          wheres.push(where);
          return rows;
        },
      }),
    }),
    update: () => ({
      set: (values: Record<string, unknown>) => ({
        where: async (where: SQL) => {
          const [id] = new PgDialect().sqlToQuery(where).params;
          updates.push({ id: String(id), values });
        },
      }),
    }),
  } as unknown as DbOrTx;
  return { tx, wheres, updates };
}

const redact = <T>(value: T) => redactPiiInJson(value, [EMAIL, "Anna Muster"]);

function queryOf(wheres: readonly SQL[]) {
  const [where] = wheres;
  if (!where) throw new Error("the scrub never queried the audit log");
  return new PgDialect().sqlToQuery(where);
}

describe("scrubAuditTrail", () => {
  test("finds rows by the address as well as by the user id", async () => {
    const { tx, wheres } = fakeTx([]);
    await scrubAuditTrail(tx, { userId: SUBJECT, email: EMAIL }, redact);
    const { sql, params } = queryOf(wheres);
    expect(params).toContain(SUBJECT);
    expect(params).toContain("anna.muster@kunde.de");
    expect(sql).toContain("strpos(lower(");
    expect(sql).toContain("::text");
  });

  test("redacts a failed-email row and a cron description that carry no user id", async () => {
    const rows: Row[] = [
      {
        id: "failed-send",
        userId: null,
        description: "product.course_followup failed: 550 anna.muster@kunde.de unknown",
        previousValue: null,
        newValue: { recipient: "anna.muster@kunde.de" },
      },
      {
        id: "cron",
        userId: null,
        description: "Course follow-up to anna.muster@kunde.de failed",
        previousValue: null,
        newValue: null,
      },
    ];
    const { tx, updates } = fakeTx(rows);
    const count = await scrubAuditTrail(tx, { userId: SUBJECT, email: EMAIL }, redact);
    expect(count).toBe(2);
    expect(updates).toEqual([
      {
        id: "failed-send",
        values: {
          description: "product.course_followup failed: 550 [erased] unknown",
          previousValue: null,
          newValue: { recipient: "[erased]" },
        },
      },
      {
        id: "cron",
        values: {
          description: "Course follow-up to [erased] failed",
          previousValue: null,
          newValue: null,
        },
      },
    ]);
  });

  test("clears the user id only on the person's own rows", async () => {
    const rows: Row[] = [
      {
        id: "own",
        userId: SUBJECT,
        description: "Updated risk",
        previousValue: { owner: "Anna Muster" },
        newValue: null,
      },
      {
        id: "about",
        userId: OPERATOR,
        description: "Invited anna.muster@kunde.de",
        previousValue: null,
        newValue: null,
      },
    ];
    const { tx, updates } = fakeTx(rows);
    await scrubAuditTrail(tx, { userId: SUBJECT, email: EMAIL }, redact);
    expect(updates[0]?.values).toMatchObject({
      userId: null,
      previousValue: { owner: "[erased]" },
    });
    expect(updates[1]?.values).not.toHaveProperty("userId");
    expect(updates[1]?.values.description).toBe("Invited [erased]");
  });

  // SQL can only narrow by substring. Updating every row it returns rewrote
  // hanna@web.de and susanna@web.de when anna@web.de was erased.
  test("leaves rows that only contain the address inside another one", async () => {
    const rows: Row[] = [
      {
        id: "hanna",
        userId: OPERATOR,
        description: "Invited hanna.muster@kunde.de",
        previousValue: null,
        newValue: { recipient: "hanna.muster@kunde.de" },
      },
      {
        id: "longer-domain",
        userId: null,
        description: "product.course_followup failed",
        previousValue: null,
        newValue: { recipient: "anna.muster@kunde.de.example.org" },
      },
      {
        id: "anna",
        userId: null,
        description: "Invited anna.muster@kunde.de",
        previousValue: null,
        newValue: null,
      },
    ];
    const { tx, updates } = fakeTx(rows);
    const count = await scrubAuditTrail(tx, { userId: SUBJECT, email: EMAIL }, redact);
    expect(count).toBe(1);
    expect(updates.map((u) => u.id)).toEqual(["anna"]);
  });

  // strpos(x, '') is 1 for every row, which would rewrite the whole trail.
  test("matches on the user id alone when there is no address", async () => {
    const { tx, wheres } = fakeTx([]);
    await scrubAuditTrail(tx, { userId: SUBJECT, email: "  " }, redact);
    const { sql, params } = queryOf(wheres);
    expect(params).toEqual([SUBJECT]);
    expect(sql).not.toContain("strpos");
  });
});
