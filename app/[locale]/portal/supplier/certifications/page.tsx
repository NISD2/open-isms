import { getTranslations } from "next-intl/server";
import { api } from "@/lib/trpc/server";
import { CertificationsSection } from "@/components/supplier-portal/CertificationsSection";

export default async function SupplierCertificationsPage() {
  const [nav, pages] = await Promise.all([
    getTranslations("supplierPortal.nav"),
    getTranslations("supplierPortal.pages"),
  ]);
  const certifications = await api.supplierPortal.certification.list();
  return (
    <div className="space-y-6 max-w-4xl">
      <header className="space-y-2">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          {nav("portalName")}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {nav("certifications")}
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          {pages("certificationsIntro")}
        </p>
      </header>
      <CertificationsSection certifications={certifications} />
    </div>
  );
}
