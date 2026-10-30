/**
 * A handover is accepted only by the person it is addressed to, while it is open, and only if the
 * company still has the owner who asked. Anything else would let a stale or foreign request move a
 * company.
 */
import { describe, expect, test } from "bun:test";
import { getTableName } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import {
  acceptRefusal,
  isOpen,
  makeOwner,
  mayCancel,
  TRANSFER_DAYS,
  type TransferRow,
  transferExpiry,
} from "./ownership-transfer";

const OWNER = "owner";
const RECIPIENT = "recipient";
const NOW = new Date("2026-10-30T10:00:00Z");

const transfer = (overrides: Partial<TransferRow> = {}): TransferRow => ({
  companyId: "company",
  fromUserId: OWNER,
  toUserId: RECIPIENT,
  status: "pending",
  expiresAt: transferExpiry(NOW),
  ...overrides,
});

const asRecipient = {
  userId: RECIPIENT,
  now: NOW,
  currentOwnerId: OWNER,
  recipientIsMember: true,
};

describe("acceptRefusal", () => {
  test("the recipient accepts an open handover from the current owner", () => {
    expect(acceptRefusal(transfer(), asRecipient)).toBeNull();
  });

  test("an expired handover cannot be accepted", () => {
    const lapsed = transfer({ expiresAt: new Date(NOW.getTime() - 1) });
    expect(acceptRefusal(lapsed, asRecipient)).toBe("not_open");
  });

  test("a cancelled or accepted handover cannot be accepted", () => {
    expect(acceptRefusal(transfer({ status: "cancelled" }), asRecipient)).toBe(
      "not_open",
    );
    expect(acceptRefusal(transfer({ status: "accepted" }), asRecipient)).toBe("not_open");
  });

  test("nobody but the recipient accepts it, the owner included", () => {
    expect(acceptRefusal(transfer(), { ...asRecipient, userId: "someone-else" })).toBe(
      "not_recipient",
    );
    expect(acceptRefusal(transfer(), { ...asRecipient, userId: OWNER })).toBe(
      "not_recipient",
    );
  });

  test("a request made by a former owner cannot move the company", () => {
    expect(
      acceptRefusal(transfer(), { ...asRecipient, currentOwnerId: "new-owner" }),
    ).toBe("owner_changed");
  });

  test("a recipient who was removed from the company cannot accept", () => {
    expect(acceptRefusal(transfer(), { ...asRecipient, recipientIsMember: false })).toBe(
      "not_member",
    );
  });
});

describe("mayCancel", () => {
  test("the owner withdraws and the recipient declines while it is open", () => {
    expect(mayCancel(transfer(), OWNER, NOW)).toBe(true);
    expect(mayCancel(transfer(), RECIPIENT, NOW)).toBe(true);
  });

  test("a third member cannot call it off, and nobody can once it is closed", () => {
    expect(mayCancel(transfer(), "admin", NOW)).toBe(false);
    expect(mayCancel(transfer({ status: "accepted" }), OWNER, NOW)).toBe(false);
  });
});

describe("makeOwner", () => {
  /** Records the tables updated; the membership update hits `memberships` rows. */
  const fakeDb = (memberships: number) => {
    const updated: string[] = [];
    const db = {
      update: (table: Parameters<typeof getTableName>[0]) => ({
        set: () => ({
          where: () => {
            updated.push(getTableName(table));
            return Object.assign(Promise.resolve(), {
              returning: async () =>
                Array.from({ length: memberships }, () => ({ userId: "u" })),
            });
          },
        }),
      }),
    };
    return { db: db as unknown as DbOrTx, updated };
  };

  test("makes a member owner and admin", async () => {
    const { db, updated } = fakeDb(1);
    await makeOwner(db, { companyId: "company", userId: RECIPIENT });
    expect(updated).toEqual(["company_membership", "company"]);
  });

  // The person left the company between the checks and the write: the transaction must roll
  // back rather than hand the company to someone outside it.
  test("throws, and never moves the owner, when the person is not a member", async () => {
    const { db, updated } = fakeDb(0);
    await expect(
      makeOwner(db, { companyId: "company", userId: RECIPIENT }),
    ).rejects.toThrow("not a member");
    expect(updated).toEqual(["company_membership"]);
  });
});

test("a handover is open for TRANSFER_DAYS and not a moment longer", () => {
  const end = transferExpiry(NOW);
  expect(end.getTime() - NOW.getTime()).toBe(TRANSFER_DAYS * 24 * 60 * 60 * 1000);
  expect(isOpen(transfer(), new Date(end.getTime() - 1))).toBe(true);
  expect(isOpen(transfer(), end)).toBe(false);
});
