import { getTranslations } from "next-intl/server";
import { CustomerInviteSection } from "@/components/supplier-portal/CustomerInviteSection";

/**
 * Customers index: the invite form, which the sidebar's "Add customer" opens.
 *
 * The sidebar already groups customers under their own "Customers" section,
 * so the only first-class action on this page is the invite form. After a
 * successful invite the new customer appears as a sidebar entry; clicking
 * it routes to /customers/[relationshipId]/assets where the supplier starts
 * declaring the assets they manage for that customer.
 *
 * It shows the form whether or not the supplier has customers already: it used to send a supplier
 * with one on to that customer's page, which left no way to invite a second.
 */
export default async function CustomersIndexPage() {
  const [nav, pages] = await Promise.all([
    getTranslations("supplierPortal.nav"),
    getTranslations("supplierPortal.pages"),
  ]);

  return (
    <div className="space-y-6 max-w-4xl">
      <header className="space-y-2">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          {nav("portalName")}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {pages("customersTitle")}
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          {pages("customersIntro")}
        </p>
      </header>
      <CustomerInviteSection />
    </div>
  );
}
