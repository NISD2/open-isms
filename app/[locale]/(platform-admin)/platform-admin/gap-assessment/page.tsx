import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { api } from "@/lib/trpc/server";
import { AdminGapAssessmentList } from "@/components/platform-admin/gap-assessment/AdminGapAssessmentList";

export const dynamic = "force-dynamic";

export default async function AdminGapAssessmentRoute() {
  await requirePlatformAdmin();
  const rows = await api.platformAdmin.gapAssessmentList();
  return <AdminGapAssessmentList rows={rows} />;
}
