import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DeleteCustomerButton } from "@/components/supplier-portal/DeleteCustomerButton";
import { api } from "@/lib/trpc/server";

/**
 * Per-customer sub-layout — fetches the relationship once and renders a
 * shared heading above the assets / incidents / access tabs.
 */
export default async function PerCustomerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ relationshipId: string }>;
}) {
  const { relationshipId } = await params;
  const [nav, pages] = await Promise.all([
    getTranslations("supplierPortal.nav"),
    getTranslations("supplierPortal.pages"),
  ]);

  const rel = await api.supplierPortal.relationship
    .get({ id: relationshipId })
    .catch(() => notFound());

  // The company name, else the full address; never the part after the @, which for a customer on
  // a mail provider reads as "gmail.com".
  const label =
    rel.customerOrgName?.trim() || rel.customerEmail || pages("unknownCustomer");

  return (
    <div className="space-y-6 max-w-5xl">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {`${nav("portalName")} · ${pages("customer")}`}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{label}</h1>
          {rel.customerEmail && rel.customerEmail !== label && (
            <p className="text-sm text-muted-foreground">{rel.customerEmail}</p>
          )}
        </div>
        <DeleteCustomerButton
          relationshipId={relationshipId}
          customerName={label}
          customerHasAccount={rel.customerHasAccount}
        />
      </header>
      {children}
    </div>
  );
}
