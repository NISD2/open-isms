import { getTranslations } from "next-intl/server";
import { AuditReadinessPage } from "@/components/audit-readiness/AuditReadinessPage";

export async function generateMetadata() {
  const t = await getTranslations("audit-readiness");
  return { title: t("title") };
}

export default function AuditReadiness() {
  return <AuditReadinessPage />;
}
