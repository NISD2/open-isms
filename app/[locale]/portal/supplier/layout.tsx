import { redirect } from "next/navigation";
import { LegalNotice } from "@/components/legal/LegalNotice";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { SupplierAppSidebar } from "@/components/supplier-portal/SupplierAppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getSession } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { api } from "@/lib/trpc/server";

/**
 * Supplier portal layout — coequal entry point with the entity portal.
 *
 * Sidebar has two groups:
 *   - General   → Profile, Security practices, Certifications
 *   - Customers → one collapsible entry per invited customer (grouped by
 *                 email domain), each with Assets / Incidents / Access
 *                 sub-pages. "+ Add customer" when empty.
 *
 * The customer list is server-fetched here so the sidebar is fully rendered
 * on first paint. Sub-page route segments under /customers/[relationshipId]/
 * own their own data fetching.
 *
 * Auth flow:
 *   1. Require a session
 *   2. If no company yet, redirect to /portal/supplier-onboarding (NOT to
 *      the entity-side /onboarding — most suppliers are not NIS2 entities)
 */
export default async function SupplierPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/auth/signin");
  // A draft entity shell (companyId set, not activated) is not a supplier
  // company — funnel it through supplier onboarding, which creates one and
  // discards the draft.
  if (!session.companyActivated) redirect("/portal/supplier-onboarding");

  // Customers that invited this address become this company's customers before the list is read,
  // so a company that existed before the invite still sees them. The count is a query because a
  // mutation is audited on every call; the bind runs only when an invite is waiting.
  if ((await api.supplierPortal.relationship.pendingInvitedCount()) > 0) {
    await api.supplierPortal.relationship.bindInvitedCustomers();
  }

  // Fetch the customer list once at layout level so the sidebar always knows
  // which customer entries to render. The query is filtered by the caller's
  // companyId via companyProcedure middleware — no leakage risk.
  const customers = await api.supplierPortal.relationship.listMyCustomers();
  const sidebarCustomers = customers.map((c) => ({
    id: c.id,
    customerEmail: c.customerEmail,
    customerOrgName: c.customerOrgName,
    status: c.status,
  }));

  return (
    <SidebarProvider defaultOpen>
      <SupplierAppSidebar
        user={{
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          isPlatformAdmin: isPlatformAdmin(session.user.email),
        }}
        customers={sidebarCustomers}
      />
      <SidebarInset>
        <PortalHeader />
        <div className="flex-1 px-6 py-6">{children}</div>
        <LegalNotice className="border-t px-6 py-3" />
      </SidebarInset>
    </SidebarProvider>
  );
}
