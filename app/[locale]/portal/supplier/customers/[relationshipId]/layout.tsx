import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
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

  let rel;
  try {
    rel = await api.supplierPortal.relationship.get({ id: relationshipId });
  } catch {
    notFound();
  }

  const label =
    rel.customerOrgName?.trim() ||
    (rel.customerEmail
      ? rel.customerEmail.includes("@")
        ? rel.customerEmail.slice(rel.customerEmail.indexOf("@") + 1)
        : rel.customerEmail
      : pages("unknownCustomer"));

  return (
    <div className="space-y-6 max-w-5xl">
      <header className="space-y-2">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          {`${nav("portalName")} · ${pages("customer")}`}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{label}</h1>
        {rel.customerEmail && (
          <p className="text-sm text-muted-foreground">{rel.customerEmail}</p>
        )}
      </header>
      {children}
    </div>
  );
}
