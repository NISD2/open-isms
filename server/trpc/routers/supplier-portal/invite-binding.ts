/**
 * Turning a customer's supplier invite into the relationship row both sides see.
 *
 * Two doors lead here: a new account accepting the invite link (onboarding.acceptInvite), and an
 * existing company that opens the supplier portal under the invited address
 * (relationship.bindInvitedCustomers). Both bind the same way, so a customer sees one row however
 * its supplier arrived.
 */
import { and, eq, gt, isNull, ne } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { supplier, supplierInvite } from "@/schema";
import { customerContactEmails } from "./customer-contact";
import { generateOpaqueToken } from "./helpers";

export type PendingInvite = typeof supplierInvite.$inferSelect;

/** Whether an invite can still be bound: not accepted, not expired (a revoke sets expiry to now). */
export const livePendingInvite = (now: Date) =>
  and(isNull(supplierInvite.acceptedAt), gt(supplierInvite.expiresAt, now));

/**
 * The invites addressed to one email that are still open, optionally leaving out one customer.
 * `skipCompanyId` is the caller's own company: it cannot be its own customer.
 */
export const pendingInvitesTo = (db: DbOrTx, email: string, skipCompanyId?: string) =>
  db.query.supplierInvite.findMany({
    where: and(
      eq(supplierInvite.toEmail, email.toLowerCase()),
      livePendingInvite(new Date()),
      skipCompanyId ? ne(supplierInvite.fromCompanyId, skipCompanyId) : undefined,
    ),
  });

/** Links the customer's own listed row, unless the pair is held already; the rows it updated. */
const linkListed = async (
  tx: DbOrTx,
  listedSupplierId: string,
  input: {
    readonly supplierCompanyId: string;
    readonly customerCompanyId: string;
    readonly customerEmail: string | null;
  },
  link: Partial<typeof supplier.$inferInsert>,
): Promise<ReadonlyArray<{ readonly id: string }>> => {
  const held =
    input.customerEmail !== null &&
    (await tx.query.supplier.findFirst({
      where: and(
        eq(supplier.supplierCompanyId, input.supplierCompanyId),
        eq(supplier.customerEmail, input.customerEmail),
      ),
      columns: { id: true },
    })) !== undefined;
  if (held) return [];
  return tx
    .update(supplier)
    .set(link)
    .where(
      and(
        eq(supplier.id, listedSupplierId),
        eq(supplier.customerCompanyId, input.customerCompanyId),
        isNull(supplier.supplierCompanyId),
      ),
    )
    .returning({ id: supplier.id });
};

/**
 * Create the relationship one invite describes, then mark the invite accepted, so an accepted invite
 * always has its row. The address stored here keys uq_supplier_portal_share and is what the row
 * keeps if the customer later unlinks it; while linked, mail goes to the customer's current address
 * (./customer-contact). The index allows one row per (supplier company, customer email):
 * a second inviting company reached at an address already bound collides, and its invite stays
 * pending rather than being accepted with no relationship. Returns whether the invite was bound.
 */
const bindInvite = async (
  tx: DbOrTx,
  input: {
    readonly inviteId: string;
    /** The row on the customer's list the invite was sent for, if any. */
    readonly listedSupplierId: string | null;
    readonly supplierCompanyId: string;
    readonly supplierName: string;
    readonly customerCompanyId: string;
    readonly customerEmail: string | null;
  },
): Promise<boolean> => {
  const link = {
    supplierCompanyId: input.supplierCompanyId,
    customerEmail: input.customerEmail,
    status: "active" as const,
    unsubscribeToken: generateOpaqueToken(),
    source: "claim_token" as const,
    confirmedAt: new Date(),
  };
  // Sent for a row the customer already lists: that row becomes the link, with everything already
  // recorded on it, so the supplier does not stand twice. A row deleted, linked meanwhile or not
  // the customer's own falls back to a new row, as does a pair an earlier invite in this signup
  // already holds (uq_supplier_portal_share), which the update would otherwise break on.
  const [listed] = input.listedSupplierId
    ? await linkListed(tx, input.listedSupplierId, input, link)
    : [];
  const [row] = listed
    ? [listed]
    : await tx
        .insert(supplier)
        .values({
          ...link,
          name: input.supplierName,
          customerCompanyId: input.customerCompanyId,
        })
        .onConflictDoNothing({
          target: [supplier.supplierCompanyId, supplier.customerEmail],
        })
        .returning({ id: supplier.id });
  if (!row) return false;
  await tx
    .update(supplierInvite)
    .set({ acceptedAt: new Date(), acceptedByCompanyId: input.supplierCompanyId })
    .where(eq(supplierInvite.id, input.inviteId));
  return true;
};

/**
 * Bind each invite to the supplier company, in order: the first of two customers sharing a contact
 * address keeps it, so the caller puts the invite the person clicked first. Sequential on purpose.
 */
export const bindInvites = async (
  tx: DbOrTx,
  input: {
    readonly invites: readonly PendingInvite[];
    readonly supplierCompanyId: string;
    readonly supplierName: string;
  },
): Promise<ReadonlyArray<{ readonly inviteId: string; readonly bound: boolean }>> => {
  const contacts = await customerContactEmails(
    tx,
    input.invites.map((pending) => pending.fromCompanyId),
  );
  const outcomes: { readonly inviteId: string; readonly bound: boolean }[] = [];
  for (const pending of input.invites) {
    const bound = await bindInvite(tx, {
      inviteId: pending.id,
      listedSupplierId: pending.supplierId,
      supplierCompanyId: input.supplierCompanyId,
      supplierName: input.supplierName,
      customerCompanyId: pending.fromCompanyId,
      customerEmail: contacts.get(pending.fromCompanyId) ?? null,
    });
    outcomes.push({ inviteId: pending.id, bound });
  }
  return outcomes;
};
