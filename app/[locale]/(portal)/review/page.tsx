import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ClipboardCheck } from "lucide-react";
import { getSession, hasReviewAccess } from "@/lib/auth";
import { api } from "@/lib/trpc/server";
import {
  ReviewDashboard,
  type ReviewRow,
} from "@/components/review/ReviewDashboard";
import {
  getComplianceMessages,
  getRequirementsMessages,
  type ComplianceMessages,
  type RequirementsMessages,
} from "@/lib/messages";

export default async function ReviewPage() {
  const session = await getSession();
  if (!session) redirect("/auth/signin");
  if (!hasReviewAccess(session.role)) {
    redirect("/dashboard");
  }

  const t = await getTranslations("review");
  const locale = await getLocale();
  const [compliance, requirements] = await Promise.all([
    getComplianceMessages(locale),
    getRequirementsMessages(locale),
  ]);
  const rawRows = await api.review.list();
  const rows = rawRows.map((r) => {
    const reqKey = r.requirementCode.replace(/\./g, "_") as keyof RequirementsMessages["requirements"];
    const catKey = r.categoryCode as keyof ComplianceMessages["compliance"]["categories"];
    return {
      ...r,
      requirementTitle: requirements.requirements[reqKey]?.title ?? r.requirementCode,
      categoryName: compliance.compliance.categories[catKey]?.name ?? r.categoryCode,
    };
  }) as ReviewRow[];

  const pendingCount = rows.filter((r) => r.status === "completed").length;
  const approvedCount = rows.filter((r) => r.status === "approved").length;
  const rejectedCount = rows.filter((r) => r.status === "rejected").length;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <ClipboardCheck className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("stats", {
              pending: pendingCount,
              approved: approvedCount,
              rejected: rejectedCount,
            })}
          </p>
        </div>
      </div>

      <ReviewDashboard rows={rows} />
    </div>
  );
}
