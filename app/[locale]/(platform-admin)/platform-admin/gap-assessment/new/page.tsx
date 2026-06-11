import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { AdminGapAssessmentNewForm } from "@/components/platform-admin/gap-assessment/AdminGapAssessmentNewForm";

export const dynamic = "force-dynamic";

export default async function AdminGapAssessmentNewRoute() {
  await requirePlatformAdmin();
  return <AdminGapAssessmentNewForm />;
}
