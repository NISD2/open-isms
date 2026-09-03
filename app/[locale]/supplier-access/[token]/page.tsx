import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api } from "@/lib/trpc/server";
import { SecurityProfilePage } from "@/components/supplier-portal/SecurityProfilePage";
import { CustomerAccessShell } from "@/components/supplier-portal/CustomerAccessShell";
import { SharedServicesSection } from "@/components/supplier-portal/SharedServicesSection";
import { SharedIncidentsSection } from "@/components/supplier-portal/SharedIncidentsSection";

/**
 * Token-gated customer access page.
 *
 * The customer (an invited subscriber, may not be a Sorzel tenant) opens this
 * URL via a magic link they received in their email. The token IS the auth —
 * `public.getByToken` looks up the relationship row and returns the supplier's
 * full security profile + certifications + incident events for THIS customer.
 *
 * Renders the SAME `SecurityProfilePage` component the supplier sees on
 * /portal/supplier, with `mode="view"` — disabled form, read-only certs,
 * sharing section hidden.
 *
 * The page is `noindex` (the route is bearer-token-protected and accidentally
 * indexed tokens would leak access).
 */
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Supplier security data",
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
  // Map it onto the SecurityProfilePage props. Customers don't have a
  // supplier-side relationship list to render, so customers=[] is correct.
  const sc = data.supplierCompany;
  const profile = sc
    ? {
        // Profile metadata
        primaryDomain: sc.primaryDomain ?? null,
        tagline: sc.tagline ?? null,
        description: sc.description ?? null,
        incidentContactEmail: sc.incidentContactEmail ?? null,
        incidentContactPhone: sc.incidentContactPhone ?? null,
        // Identity
        legalName: sc.legalName ?? null,
        registeredAddress: sc.registeredAddress ?? null,
        country: sc.country ?? null,
        securityContactName: sc.securityContactName ?? null,
        bsiRegistrationId: sc.bsiRegistrationId ?? null,
        // CIR §5.1.4 universal facts about the company
        hasIsms: sc.hasIsms ?? null,
        hasIso27001OrEquivalent: sc.hasIso27001OrEquivalent ?? null,
        staffSecurityTraining: sc.staffSecurityTraining ?? null,
        backgroundChecks: sc.backgroundChecks ?? null,
        vulnerabilityHandling: sc.vulnerabilityHandling ?? null,
        // NIS2 Art 21(2) baseline practices
        securityPolicyReviewedAnnually:
          sc.securityPolicyReviewedAnnually ?? null,
        hasIncidentResponsePlan: sc.hasIncidentResponsePlan ?? null,
        hasBusinessContinuityPlan: sc.hasBusinessContinuityPlan ?? null,
        hasCryptographyPolicy: sc.hasCryptographyPolicy ?? null,
        hasPrivilegedAccessMgmt: sc.hasPrivilegedAccessMgmt ?? null,
        mfaEnforcedInternal: sc.mfaEnforcedInternal ?? null,
        hasAssetInventory: sc.hasAssetInventory ?? null,
        hasPenetrationTestingProgram: sc.hasPenetrationTestingProgram ?? null,
        // ENISA TIG §5 — universal company-wide
        cooperateWithAuthorities: sc.cooperateWithAuthorities ?? null,
        pastBreachesDisclosed: sc.pastBreachesDisclosed ?? null,
      }
    : ({} as Record<string, never>);

  return (
    <CustomerAccessShell
      token={token}
      customerEmail={data.relationship.customerEmail ?? ""}
    >
      <SecurityProfilePage
        profile={profile}
        certifications={data.certifications}
        customers={[]}
        mode="view"
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
