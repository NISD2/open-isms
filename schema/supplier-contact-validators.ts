/**
 * Supplier-side validators for a customer and its security contact. Kept out of validators.ts,
 * which is over the size limit and may not grow.
 */
import { z } from "zod";

/**
 * Add a customer. Either field may be left out, but not both (checked by the router and the form,
 * since SchemaForm renders a plain object): with an email the customer gets the link to your
 * security profile at once, without one you add the email later.
 */
export const supplierInviteCustomerSchema = z.object({
  customerEmail: z.string().email().max(255).optional(),
  customerOrgName: z.string().max(500).optional(),
});

/** A person to send a customer's link to. */
export const supplierAddContactSchema = z.object({
  id: z.string().uuid(),
  customerEmail: z.string().email().max(255),
});

/** One person's access to take away: `contactId` names an added person, none means the row's own. */
export const supplierRemoveContactSchema = z.object({
  id: z.string().uuid(),
  contactId: z.string().uuid().optional(),
});
