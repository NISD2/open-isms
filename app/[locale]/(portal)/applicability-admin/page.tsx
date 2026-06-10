import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { AdminClassifier } from "@/components/applicability/AdminClassifier";

export default async function ApplicabilityAdminPage() {
  const session = await getSession();
  if (!session?.companyId) redirect("/dashboard");
  if (session.role !== "admin") redirect("/dashboard");

  return (
    <>
      <PageHeader
        icon={<ShieldCheck className="h-8 w-8 text-primary" />}
        title="NIS2 Classifier"
        description="Manually classify a company's NIS2 status with full control over all inputs."
      />
      <AdminClassifier />
    </>
  );
}
