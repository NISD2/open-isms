/**
 * Reasons an operator typed about a person: free text that can name them, so an erasure replaces
 * it. The rows stay, because they are the record of who owned a company and why it changed; the
 * people on them are already set to null by their foreign keys when the account goes. Its own
 * module because erase-user.ts pulls in environment validation and this deserves tests.
 */
import { and, eq, isNotNull, or } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { ownershipTransfer } from "@/schema";

/**
 * What an erased reason reads afterwards. At least 20 characters, because an operator's ownership
 * assignment must carry a reason that long (CHECK ownership_transfer_operator_reasoned).
 */
export const ERASED_REASON = "[erased with an account it was about]";

/**
 * The operator's reason on every ownership transfer from or to the person (the platform admin's
 * owner assignment, server/trpc/routers/platform-admin-users.ts). Run before the account row is
 * deleted: afterwards the foreign keys are null and the rows can no longer be found.
 */
export const eraseOwnershipReasons = (tx: DbOrTx, userId: string) =>
  tx
    .update(ownershipTransfer)
    .set({ reason: ERASED_REASON })
    .where(
      and(
        isNotNull(ownershipTransfer.reason),
        or(
          eq(ownershipTransfer.fromUserId, userId),
          eq(ownershipTransfer.toUserId, userId),
        ),
      ),
    )
    .returning({ id: ownershipTransfer.id });
