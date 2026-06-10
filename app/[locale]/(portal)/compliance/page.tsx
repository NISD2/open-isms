import { getTranslations } from "next-intl/server";
import { api } from "@/lib/trpc/server";
import { getSession, hasReviewAccess } from "@/lib/auth";
import { getAllActiveCategories } from "@/lib/compliance/access";
import { ComplianceOverview } from "@/components/compliance/ComplianceOverview";

export default async function ComplianceIndexPage() {
  const [session, allFrameworks, t, assessment] = await Promise.all([
    getSession(),
    getAllActiveCategories(),
    getTranslations("compliance"),
    api.assessment.getActiveAssessment(),
  ]);

  const fwData = allFrameworks.get("nis2");
  if (!fwData) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t("noFrameworkData")}</p>
      </div>
    );
  }

  const [progress, assignments] = assessment
    ? await Promise.all([
        api.assessment.getProgressByCategory({ assessmentId: assessment.id }),
        api.assignment.list({ assessmentId: assessment.id }),
      ])
    : [{} as Record<string, { completed: number; total: number }>, [] as Awaited<ReturnType<typeof api.assignment.list>>];

  const ownerByCategoryId = new Map(
    assignments.map((a) => [
      a.category.id,
      { userId: a.user.id, userName: a.user.name },
    ]),
  );

  const isAdmin = hasReviewAccess(session?.role ?? "member");

  const categories = fwData.categories.map((cat) => {
    const prog = progress[cat.id] ?? { completed: 0, total: cat.requirementCount };
    const catKey = cat.code as "GOV" | "RSK" | "INC" | "BCP" | "SUP" | "PRO" | "EFF" | "TRN" | "CRY" | "ACC" | "AUT" | "REG";
    return {
      id: cat.id,
      code: cat.code,
      name: t(`categories.${catKey}.name`),
      slug: cat.slug,
      description: t(`categories.${catKey}.description`),
      legalBasis: t(`categories.${catKey}.legalBasis`),
      sortOrder: cat.sortOrder,
      requirementCount: cat.requirementCount,
      completed: prog.completed,
      total: prog.total,
      owner: ownerByCategoryId.get(cat.id) ?? null,
    };
  });

  return (
    <ComplianceOverview
      categories={categories}
      assessmentId={assessment?.id ?? null}
      isAdmin={isAdmin}
    />
  );
}
