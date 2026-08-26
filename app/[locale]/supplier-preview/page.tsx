import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { SupplierAppSidebar } from "@/components/supplier-portal/SupplierAppSidebar";
import { SecurityProfileForm } from "@/components/supplier-portal/SecurityProfileForm";
import {
  PROFILE_PAGE_FIELDS,
  SERVICE_TYPE_PAGE_FIELDS,
} from "@/lib/forms/supplier-portal-sections";
import { SAMPLE_CUSTOMERS, SAMPLE_PROFILE, SAMPLE_USER } from "./sample-data";

/**
 * Public design route for the supplier portal, twin of /journey-preview.
 *
 * Renders the real sidebar and the real security-practices form against
 * sample data — no auth, no DB — so the landing hero image can be captured in
 * every locale. Generation only: `notFound()` in production keeps it off
 * nisd2.eu.
 */
export default async function SupplierPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const nav = await getTranslations("supplierPortal.nav");
  const pages = await getTranslations("supplierPortal.pages");

  return (
    <SidebarProvider defaultOpen>
      <SupplierAppSidebar user={SAMPLE_USER} customers={SAMPLE_CUSTOMERS} />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <span className="text-sm font-medium">{nav("practices")}</span>
        </header>
        <div className="flex-1 px-6 py-6">
          <div className="max-w-4xl space-y-6">
            <header className="space-y-2">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {nav("portalName")}
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {nav("practices")}
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                {pages("practicesIntro")}
              </p>
            </header>
            <SecurityProfileForm
              initialValues={SAMPLE_PROFILE}
              lastSavedAt={null}
              mode="edit"
              omit={[...PROFILE_PAGE_FIELDS, ...SERVICE_TYPE_PAGE_FIELDS]}
            />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
