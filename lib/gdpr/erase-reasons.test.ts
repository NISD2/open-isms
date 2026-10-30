/**
 * An operator's owner assignment keeps the operator's reason, free text about the old and new
 * owner. Erasing either of them left it in place, because the people on the row are only set to
 * null when the account goes. The row must stay valid: an operator's assignment needs a reason of
 * 20 characters or more.
 */
import { describe, expect, test } from "bun:test";
import { getTableName, type SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import type { DbOrTx } from "@/lib/db";
import { ERASED_REASON, eraseOwnershipReasons } from "./erase-reasons";

const SUBJECT = "11111111-1111-4111-8111-111111111111";

function fakeTx() {
  const writes: Array<{ table: string; set: Record<string, unknown>; where: SQL }> = [];
  const tx = {
    update: (table: Parameters<typeof getTableName>[0]) => ({
      set: (set: Record<string, unknown>) => ({
        where: (where: SQL) => ({
          returning: async () => {
            writes.push({ table: getTableName(table), set, where });
            return [{ id: "transfer" }];
          },
        }),
      }),
    }),
  } as unknown as DbOrTx;
  return { tx, writes };
}

describe("eraseOwnershipReasons", () => {
  test("replaces the reason on transfers from or to the person, and only where there is one", async () => {
    const { tx, writes } = fakeTx();
    expect(await eraseOwnershipReasons(tx, SUBJECT)).toEqual([{ id: "transfer" }]);
    const [write] = writes;
    if (!write) throw new Error("nothing was written");
    expect(write.table).toBe("ownership_transfer");
    expect(write.set).toEqual({ reason: ERASED_REASON });
    const { sql, params } = new PgDialect().sqlToQuery(write.where);
    expect(sql).toContain('"reason" is not null');
    expect(sql).toContain('"from_user_id" = ');
    expect(sql).toContain('"to_user_id" = ');
    expect(sql).toContain(" or ");
    expect(params).toEqual([SUBJECT, SUBJECT]);
  });

  test("the replacement still satisfies the operator's reason check", () => {
    expect(ERASED_REASON.trim().length).toBeGreaterThanOrEqual(20);
  });
});
