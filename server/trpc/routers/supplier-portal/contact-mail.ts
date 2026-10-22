/**
 * The mail that carries a person their link to the supplier's security profile. Best effort: the
 * row (or the contact) is what counts, and a failed send is logged, not raised.
 */
import { notifyContactAdded, notifyCustomerAdded } from "./broadcast";

/** The mail for the address on the customer's row, with the row's link. */
export function mailAccessLink(supplierCompanyId: string, email: string): void {
  notifyCustomerAdded(supplierCompanyId, email).catch((err) => {
    console.error("[supplier-portal] customer added email failed:", err);
  });
}

/** The same mail for a person added after the first, with their own link. */
export function mailContactLink(contactId: string): void {
  notifyContactAdded(contactId).catch((err) => {
    console.error("[supplier-portal] contact added email failed:", err);
  });
}
