/**
 * The people at a customer who hold a link to the supplier's security profile.
 *
 * A customer the supplier added itself has the address on its own row (the first contact, with the
 * row's token) and may have more people in supplier_contact, each with a token of their own. A
 * customer with an account of its own is reached at the address it keeps there and has only the
 * row's token. Everything that mails a customer, or opens a link, goes through here so the two
 * kinds of contact are never handled one-off.
 */
import { and, eq } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { supplier, supplierContact } from "@/schema";
import { customerAddressOf } from "./customer-contact";

/** The supplier's customer that has this address on its row, if any. */
export const findRelationshipId = (
  db: DbOrTx,
  supplierCompanyId: string,
  customerEmail: string,
): Promise<{ id: string } | undefined> =>
  db.query.supplier.findFirst({
    where: and(
      eq(supplier.supplierCompanyId, supplierCompanyId),
      eq(supplier.customerEmail, customerEmail),
    ),
    columns: { id: true },
  });

/** Who a mail goes to, and the link in it. `contactId` is null for the address on the row. */
export type Recipient = {
  readonly email: string;
  readonly token: string;
  readonly contactId: string | null;
};

type RelationshipRow = {
  readonly id: string;
  readonly customerCompanyId: string | null;
  readonly customerEmail: string | null;
  readonly unsubscribeToken: string | null;
};

/** Every address a notice for this customer goes to, with the link each person holds. */
export const recipientsOf = async (
  db: DbOrTx,
  rel: RelationshipRow,
): Promise<readonly Recipient[]> => {
  const [firstAddress, others] = await Promise.all([
    customerAddressOf(db, rel),
    rel.customerCompanyId
      ? Promise.resolve([])
      : db
          .select({
            id: supplierContact.id,
            email: supplierContact.email,
            token: supplierContact.accessToken,
          })
          .from(supplierContact)
          .where(eq(supplierContact.relationshipId, rel.id))
          .orderBy(supplierContact.createdAt),
  ]);
  const first: readonly Recipient[] =
    firstAddress && rel.unsubscribeToken
      ? [{ email: firstAddress, token: rel.unsubscribeToken, contactId: null }]
      : [];
  return [
    ...first,
    ...others.map((c) => ({ email: c.email, token: c.token, contactId: c.id })),
  ];
};

/** A link that was opened: the customer row it belongs to, and which person holds it. */
export type Access = {
  readonly rel: typeof supplier.$inferSelect;
  readonly via:
    | { readonly kind: "row" }
    | { readonly kind: "contact"; readonly contactId: string; readonly email: string };
};

/** The customer a link opens, whether it is the row's own token or one person's. Null if none. */
export const accessByToken = async (
  db: DbOrTx,
  token: string,
): Promise<Access | null> => {
  const own = await db.query.supplier.findFirst({
    where: eq(supplier.unsubscribeToken, token),
  });
  if (own) return { rel: own, via: { kind: "row" } };

  const contact = await db.query.supplierContact.findFirst({
    where: eq(supplierContact.accessToken, token),
  });
  if (!contact) return null;
  const rel = await db.query.supplier.findFirst({
    where: eq(supplier.id, contact.relationshipId),
  });
  return rel
    ? { rel, via: { kind: "contact", contactId: contact.id, email: contact.email } }
    : null;
};
