import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ClipboardCheck } from "lucide-react";
import { getSession, hasReviewAccess } from "@/lib/auth";
import { api } from "@/lib/trpc/server";
import {
  ReviewDashboard,
  type ReviewRow,
} from "@/components/review/ReviewDashboard";
import requirementsEn from "@/messages/requirements/en.json";
import complianceEn from "@/messages/compliance/en.json";

export default async function ReviewPage() {
  const session = await getSession();
  if (!session) redirect("/auth/signin");
  if (!hasReviewAccess(session.role)) {
    redirect("/dashboard");
  }

  const t = await getTranslations("review");
  const rawRows = await api.review.list();
  const rows = rawRows.map((r) => {
    const reqKey = r.requirementCode.replace(/\./g, "_") as keyof typeof requirementsEn.requirements;
    const catKey = r.categoryCode as keyof typeof complianceEn.compliance.categories;
    return {
      ...r,
      requirementTitle: requirementsEn.requirements[reqKey]?.title ?? r.requirementCode,
      categoryName: complianceEn.compliance.categories[catKey]?.name ?? r.categoryCode,
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
