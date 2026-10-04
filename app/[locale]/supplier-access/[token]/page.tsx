import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CustomerAccessShell } from "@/components/supplier-portal/CustomerAccessShell";
import { SecurityProfilePage } from "@/components/supplier-portal/SecurityProfilePage";
import { SharedIncidentsSection } from "@/components/supplier-portal/SharedIncidentsSection";
import { SharedServicesSection } from "@/components/supplier-portal/SharedServicesSection";
import { api } from "@/lib/trpc/server";

/**
 * Token-gated customer access page.
 *
 * The customer (an invited subscriber, may not be a Sorzel tenant) opens this
 * URL via a magic link they received in their email. The token IS the auth —
 * `public.getByToken` looks up the relationship row and returns the supplier's
 * full security profile + certifications + incident events for THIS customer.
 *
 * Renders `SecurityProfilePage`: the supplier's questionnaire as a sheet of answers in the same
 * groups the supplier fills in, and the certificates, read-only.
 *
 * The page is `noindex` (the route is bearer-token-protected and accidentally
 * indexed tokens would leak access).
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("supplierPortal.customerView");
  return {
    title: t("securityProfile"),
    robots: { index: false, follow: false },
  };
}

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function SupplierAccessPage({ params }: PageProps) {
  const { token } = await params;
  const data = await api.supplierPortal.public.getByToken({ token });

  if (!data) {
    notFound();
  }

  // The public.getByToken response shape:
  //   - supplierCompany: company-level identity + universal practices
  //   - relationship:    per-customer contract clauses (live on supplier row)
  //   - managedAssets:   per-asset technical declarations (SaaS hosting,
  //                      on-prem SBOM, managed PAM, etc.)
  //
  return (
    <CustomerAccessShell
      token={token}
      customerEmail={data.relationship.customerEmail ?? ""}
    >
      <SecurityProfilePage
        profile={data.supplierCompany ?? {}}
        certifications={data.certifications}
        supplierName={data.supplierCompany?.name ?? null}
      />

      {/*
        The two per-customer halves of the payload. getByToken has always
        returned them, scoped to this relationship, and nothing rendered
        them: `managedAssets` was destructured and dropped, `recentEvents`
        had no renderer anywhere. That left the customer view showing only
        the company-wide questionnaire, while the portal's own marketing
        page promises "die Systeme, die Sie für ihn betreuen" and a per
        customer incident feed.
      */}
      <div className="space-y-10 max-w-4xl mx-auto">
        <hr className="border-muted" />
        <SharedServicesSection services={data.managedAssets} />
        <hr className="border-muted" />
        <SharedIncidentsSection incidents={data.recentEvents} />
      </div>
    </CustomerAccessShell>
  );
}
