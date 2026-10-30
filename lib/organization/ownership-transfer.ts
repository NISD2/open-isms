/**
 * Handing a company to a new owner. The owner asks with a fresh email code, the recipient accepts
 * while signed in as themselves, and either can call it off before then; the platform operator can
 * assign an owner when the old one is gone. The decisions are pure functions here so the router
 * and its tests ask the same question; `makeOwner` is the one write both paths end in.
 */
import { and, eq, lte } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { company, ownershipTransfer } from "@/schema";
import { setMembershipRole } from "./membership";

/** How long a recipient has to accept before the request lapses. */
export const TRANSFER_DAYS = 7;

export const transferExpiry = (now: Date): Date =>
  new Date(now.getTime() + TRANSFER_DAYS * 24 * 60 * 60 * 1000);

export type TransferRow = {
  readonly companyId: string;
  readonly fromUserId: string | null;
  readonly toUserId: string | null;
  readonly status: "pending" | "accepted" | "cancelled";
  readonly expiresAt: Date;
};

/** Open means it can still be accepted or cancelled: pending and not past its end. */
export const isOpen = (transfer: TransferRow, now: Date): boolean =>
  transfer.status === "pending" && transfer.expiresAt > now;

export type AcceptRefusal = "not_open" | "not_recipient" | "owner_changed" | "not_member";

/**
 * Why the person cannot accept this transfer, or null when they can. `currentOwnerId` is read in
 * the same transaction, so a company that changed hands meanwhile is never handed on by a stale
 * request.
 */
export function acceptRefusal(
  transfer: TransferRow,
  input: {
    readonly userId: string;
    readonly now: Date;
    readonly currentOwnerId: string | null;
    readonly recipientIsMember: boolean;
  },
): AcceptRefusal | null {
  if (!isOpen(transfer, input.now)) return "not_open";
  if (transfer.toUserId !== input.userId) return "not_recipient";
  if (transfer.fromUserId !== input.currentOwnerId) return "owner_changed";
  if (!input.recipientIsMember) return "not_member";
  return null;
}

/** The owner who asked can withdraw it, and the recipient can decline it, while it is open. */
export const mayCancel = (transfer: TransferRow, userId: string, now: Date): boolean =>
  isOpen(transfer, now) &&
  (transfer.fromUserId === userId || transfer.toUserId === userId);

/**
 * A pending row past its end still holds the company's one pending slot, so it is closed before a
 * new request takes the slot. It closes as cancelled with nobody deciding, which is how a lapsed
 * request reads in the record.
 */
export async function closeLapsedTransfers(
  db: DbOrTx,
  input: { readonly companyId: string; readonly now: Date },
): Promise<void> {
  await db
    .update(ownershipTransfer)
    .set({ status: "cancelled", decidedAt: input.now })
    .where(
      and(
        eq(ownershipTransfer.companyId, input.companyId),
        eq(ownershipTransfer.status, "pending"),
        lte(ownershipTransfer.expiresAt, input.now),
      ),
    );
}

/**
 * Make the person the company's owner. The owner is always an admin, so the new one becomes one;
 * the old owner keeps the admin role they had and can be changed or removed like any admin from
 * now on. The payer of the billing account (`billing_account.ownerUserId`) is a separate role and
 * does not move with ownership.
 */
export async function makeOwner(
  db: DbOrTx,
  input: { readonly companyId: string; readonly userId: string },
): Promise<void> {
  await db
    .update(company)
    .set({ ownerId: input.userId, updatedAt: new Date() })
    .where(eq(company.id, input.companyId));
  await setMembershipRole(db, {
    userId: input.userId,
    companyId: input.companyId,
    role: "admin",
  });
}
