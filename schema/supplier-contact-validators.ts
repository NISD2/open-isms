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

/** The address a customer's security contact is reached at (add, or replace). */
export const supplierSetContactSchema = z.object({
  id: z.string().uuid(),
  customerEmail: z.string().email().max(255),
});
