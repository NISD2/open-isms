import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { api } from "@/lib/trpc/server";
import { CustomerInviteSection } from "@/components/supplier-portal/CustomerInviteSection";

/**
 * Customers index — invite a new customer + show the existing list.
 *
 * The sidebar already groups customers under their own "Customers" section,
 * so the only first-class action on this page is the invite form. After a
 * successful invite the new customer appears as a sidebar entry; clicking
 * it routes to /customers/[relationshipId]/assets where the supplier starts
 * declaring the assets they manage for that customer.
 *
 * If the supplier already has at least one customer AND lands here directly,
 * we route them to the first customer's assets page so the empty index
 * doesn't feel like a dead end.
 */
export default async function CustomersIndexPage() {
  const [nav, pages] = await Promise.all([
    getTranslations("supplierPortal.nav"),
    getTranslations("supplierPortal.pages"),
  ]);
  const customers = await api.supplierPortal.relationship.listMyCustomers();
  const active = customers.filter((c) => c.status !== "revoked");

  if (active.length > 0) {
    redirect(`/portal/supplier/customers/${active[0].id}/assets`);
  }

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
