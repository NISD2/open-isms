import { api } from "@/lib/trpc/server";
import { CertificationsSection } from "@/components/supplier-portal/CertificationsSection";

export default async function SupplierCertificationsPage() {
  const certifications = await api.supplierPortal.certification.list();
  return (
    <div className="space-y-6 max-w-4xl">
      <header className="space-y-2">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          Supplier portal
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Certifications</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Upload your security attestations (ISO 27001, BSI Grundschutz, BSI C5,
          TISAX, SOC 2). PDFs and metadata are visible to customers you have
          invited via the supplier-access link.
        </p>
      </header>
      <CertificationsSection certifications={certifications} />
    </div>
  );
}
