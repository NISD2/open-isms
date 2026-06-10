import { redirect } from "next/navigation";

/**
 * Supplier portal root → redirect to the Profile sub-page.
 *
 * The supplier portal is multi-page now. The natural starting point after
 * onboarding is the Profile section (identity, marketing metadata, incident
 * contact) since those fields are the prerequisites for sharing the profile
 * with customers. From there the sidebar drives the rest of the flow.
 */
export default function SupplierPortalRoot() {
  redirect("/portal/supplier/profile");
}
