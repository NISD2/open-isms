/**
 * The people at a customer who hold a link to the supplier's security profile: list them, add
 * one, take one's access away. Each is sent a link of their own (supplier_contact), besides the
 * address on the customer's own row, which is the first contact and keeps the row's link.
 *
 * Rows owned by THIS supplier are identified by supplierCompanyId = ctx.companyId. A customer with
 * an account of its own is reached at the address it keeps there and takes no one.
 */
import { TRPCError } from "@trpc/server";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { supplier, supplierContact } from "@/schema";
import {
  supplierAddContactSchema,
  supplierRemoveContactSchema,
} from "@/schema/supplier-contact-validators";
import {
  requireInboxBudget,
  requireSupplierMailBudget,
} from "../../helpers/supplier-mail-budget";
import { accountProcedure, router } from "../../init";
import { updateRow } from "../../typed";
import { mailAccessLink, mailContactLink } from "./contact-mail";
import { findRelationshipId } from "./contacts";
import { generateOpaqueToken } from "./helpers";

/** How many people besides the first a supplier can add to one customer. */
const MAX_CONTACTS_PER_CUSTOMER = 50;

/**
 * A customer linked to an account of its own is reached at the address it keeps there and cannot
 * be given another by its supplier.
 */
function requireUnlinked(rel: { readonly customerCompanyId: string | null }): void {
  if (rel.customerCompanyId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "This customer has its own account and is reached at the address it keeps there.",
    });
  }
}

export const supplierContactRouter = router({
  /**
   * The people at a customer who hold a link: the address on the row first, then those added
   * after, oldest first. A customer with an account of its own lists no one.
   */
  list: accountProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const rel = await ctx.db.query.supplier.findFirst({
        where: and(
          eq(supplier.id, input.id),
          eq(supplier.supplierCompanyId, ctx.companyId),
        ),
        columns: { id: true, customerCompanyId: true, customerEmail: true },
      });
      if (!rel) throw new TRPCError({ code: "NOT_FOUND" });
      if (rel.customerCompanyId) return [];
      const added = await ctx.db
        .select({ contactId: supplierContact.id, email: supplierContact.email })
        .from(supplierContact)
        .where(eq(supplierContact.relationshipId, rel.id))
        .orderBy(supplierContact.createdAt);
      return [
        ...(rel.customerEmail ? [{ contactId: null, email: rel.customerEmail }] : []),
        ...added,
      ];
    }),

  /**
   * Add a person to a customer: they are sent a link of their own. A customer with no address yet
   * gets this one as its first. An address the customer already has is sent its link once more.
   */
  add: accountProcedure
    .input(supplierAddContactSchema)
    .mutation(async ({ ctx, input }) => {
      const email = input.customerEmail.toLowerCase();
      const rel = await ctx.db.query.supplier.findFirst({
        where: and(
          eq(supplier.id, input.id),
          eq(supplier.supplierCompanyId, ctx.companyId),
        ),
        columns: { id: true, customerCompanyId: true, customerEmail: true, status: true },
      });
      if (!rel || rel.status === "revoked") throw new TRPCError({ code: "NOT_FOUND" });
      requireUnlinked(rel);

      const added = await ctx.db.query.supplierContact.findMany({
        where: eq(supplierContact.relationshipId, rel.id),
        columns: { id: true, email: true },
      });
      const known = added.find((c) => c.email === email);
      const resend = rel.customerEmail === email || known !== undefined;
      if (
        !resend &&
        (await findRelationshipId(ctx.db, ctx.companyId, email)) !== undefined
      ) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You already have a customer with this email address.",
        });
      }
      if (!resend && added.length >= MAX_CONTACTS_PER_CUSTOMER) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `A customer can have at most ${MAX_CONTACTS_PER_CUSTOMER} people.`,
        });
      }
      await requireSupplierMailBudget("customerInvites", ctx.companyId);
      await requireInboxBudget(ctx.companyId, email);
      if (!resend) await requireSupplierMailBudget("newRecipients", ctx.companyId);

      if (rel.customerEmail === email) {
        mailAccessLink(ctx.companyId, email);
      } else if (known) {
        mailContactLink(known.id);
      } else if (rel.customerEmail === null) {
        // The customer's first address goes on its row.
        const [row] = await ctx.db
          .update(supplier)
          .set(
            updateRow(supplier, {
              customerEmail: email,
              unsubscribeToken: generateOpaqueToken(),
              status: "active" as const,
              unsubscribedAt: null,
              confirmedAt: new Date(),
              updatedAt: new Date(),
            }),
          )
          .where(
            and(
              eq(supplier.id, rel.id),
              eq(supplier.supplierCompanyId, ctx.companyId),
              isNull(supplier.customerCompanyId),
            ),
          )
          .returning({ id: supplier.id });
        if (!row) throw new TRPCError({ code: "NOT_FOUND" });
        mailAccessLink(ctx.companyId, email);
      } else {
        const [contact] = await ctx.db
          .insert(supplierContact)
          .values({
            relationshipId: rel.id,
            email,
            accessToken: generateOpaqueToken(),
          })
          .onConflictDoNothing({
            target: [supplierContact.relationshipId, supplierContact.email],
          })
          .returning({ id: supplierContact.id });
        // A concurrent call added the same person first, and mailed them.
        if (contact) mailContactLink(contact.id);
      }
      return { id: rel.id };
    }),

  /**
   * Take one person's access away: the contact named, or, with none named, the address on the
   * row. Their link stops working and nothing is mailed to them any more; the customer and its
   * other people stay. Removing the address on the row needs a company name on the customer, or
   * it would be left with no name at all.
   */
  remove: accountProcedure
    .input(supplierRemoveContactSchema)
    .mutation(async ({ ctx, input }) => {
      const rel = await ctx.db.query.supplier.findFirst({
        where: and(
          eq(supplier.id, input.id),
          eq(supplier.supplierCompanyId, ctx.companyId),
        ),
        columns: {
          id: true,
          customerCompanyId: true,
          customerOrgName: true,
          status: true,
        },
      });
      if (!rel || rel.status === "revoked") throw new TRPCError({ code: "NOT_FOUND" });
      requireUnlinked(rel);

      if (input.contactId) {
        const [gone] = await ctx.db
          .delete(supplierContact)
          .where(
            and(
              eq(supplierContact.id, input.contactId),
              eq(supplierContact.relationshipId, rel.id),
            ),
          )
          .returning({ id: supplierContact.id });
        if (!gone) throw new TRPCError({ code: "NOT_FOUND" });
        return { id: rel.id };
      }

      if (!rel.customerOrgName?.trim()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Give this customer a company name before removing its email, or remove the customer.",
        });
      }
      const [row] = await ctx.db
        .update(supplier)
        .set(
          updateRow(supplier, {
            customerEmail: null,
            unsubscribeToken: generateOpaqueToken(),
            updatedAt: new Date(),
          }),
        )
        .where(
          and(
            eq(supplier.id, rel.id),
            eq(supplier.supplierCompanyId, ctx.companyId),
            isNull(supplier.customerCompanyId),
          ),
        )
        .returning({ id: supplier.id });
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      return row;
    }),
});
