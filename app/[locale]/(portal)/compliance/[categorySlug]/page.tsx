import { Link } from "@/i18n/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { api } from "@/lib/trpc/server";
import { getSession } from "@/lib/auth";
import {
  getAllActiveCategories,
  getUserAccess,
  canSeeCategory,
} from "@/lib/compliance/access";
import { GuidedBanner } from "@/components/compliance/GuidedBanner";
import { CategoryHeader } from "@/components/compliance/CategoryHeader";
import { CategoryContent } from "@/components/compliance/CategoryContent";
import { ExportPolicyButton } from "@/components/compliance/ExportPolicyButton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getNextCategory, getPrevCategory } from "@/lib/compliance/helpers";
import { REQUIREMENT_FIELD_MAP } from "@/lib/compliance/requirement-fields";

export default async function CategoryStepPage({
  params,
  searchParams,
}: {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ categorySlug }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const guided = resolvedSearchParams?.guided === "true";

  const [
    t,
    { category, requirements },
    session,
    allFrameworks,
    assessment,
    operationalCounts,
    assignableUsers,
  ] = await Promise.all([
    getTranslations(),
    api.requirement.listByCategorySlug({ slug: categorySlug }),
    getSession(),
    getAllActiveCategories(),
    api.assessment.getActiveAssessment(),
    api.dashboard.operationalCounts(),
    api.assignment.listAssignableUsers(),
  ]);

  if (!category) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {t("compliance.categoryNotFound")}
        </p>
      </div>
    );
  }

  const frameworkCode = category.framework.code;

  // When assessment exists, check access; otherwise show everything
  const access = assessment
    ? await getUserAccess(
        assessment.id,
        session?.user.id ?? "",
        session?.role ?? "member",
      )
    : { isAdmin: true, categoryIds: new Set<string>() };

  if (assessment && !canSeeCategory(access, category.id)) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {t("compliance.categoryNotFound")}
        </p>
      </div>
    );
  }

  const isAdmin = access.isAdmin;

  const [rawStatuses, intakeData] = assessment
    ? await Promise.all([
        api.assessment.getStatusesByCategory({
          assessmentId: assessment.id,
          categoryId: category.id,
        }),
        api.intake.getForm({
          assessmentId: assessment.id,
          categoryId: category.id,
          categoryCode: category.code,
        }).catch(() => ({ answers: {} as Record<string, unknown>, signedOffAt: null as string | null })),
      ])
    : [
        [] as Awaited<ReturnType<typeof api.assessment.getStatusesByCategory>>,
        { answers: {} as Record<string, unknown>, signedOffAt: null as string | null },
      ];

  const userNameMap = new Map(assignableUsers.map((u) => [u.id, u.name]));

  // Build segments for CategoryHeader progress ring
  const segments = requirements.map((req) => {
    const s = rawStatuses.find((rs) => rs.requirementId === req.id);
    const status = s?.status?.status ?? "not_started";
    return {
      code: req.code,
      status,
      frequency: req.frequency,
      nextReviewDate: s?.status?.nextReviewDate ?? null,
      isSatisfiable: !!req.moduleRef && (operationalCounts[req.moduleRef] ?? 0) > 0 && status !== "completed" && status !== "approved",
    };
  });

  // Compute per-requirement completion from intake answers
  const answers = intakeData.answers as Record<string, unknown>;
  function getRequirementCompletionPct(reqCode: string, status: string): number {
    if (status === "completed" || status === "approved") return 100;
    if (status === "not_applicable") return 100;

    const fieldInfo = REQUIREMENT_FIELD_MAP[reqCode];
    if (!fieldInfo || fieldInfo.fieldKeys.length === 0) {
      return status === "in_progress" ? 50 : 0;
    }

    const filled = fieldInfo.fieldKeys.filter((key) => {
      const val = answers[key];
      return val !== undefined && val !== null && val !== "";
    }).length;

    return Math.round((filled / fieldInfo.fieldKeys.length) * 100);
  }

  // Serializable statuses for CategoryContent
  const statuses = requirements.map((req) => {
    const s = rawStatuses.find((rs) => rs.requirementId === req.id);
    const assignedTo = s?.status?.assignedTo ?? null;
    const currentStatus = s?.status?.status ?? "not_started";
    return {
      requirementId: req.id,
      currentStatus,
      nextReviewDate: s?.status?.nextReviewDate ?? null,
      assigneeName: assignedTo ? (userNameMap.get(assignedTo) ?? null) : null,
      completionPct: getRequirementCompletionPct(req.code, currentStatus),
    };
  });

  // Augment requirements with i18n titles/descriptions
  const tReq = await getTranslations("requirements");
  const tc = await getTranslations("compliance");
  const requirementRows = requirements.map((req) => {
    const reqKey = req.code.replace(/\./g, "_");
    return {
      id: req.id,
      code: req.code,
      title: tReq(`${reqKey}.title`),
      description: tReq(`${reqKey}.description`),
      priority: req.priority,
      frequency: req.frequency,
      legalRef: req.legalRef,
      moduleRef: req.moduleRef,
    };
  });

  const fwData = allFrameworks.get(frameworkCode);
  const frameworkCategorySlugs = fwData
    ? fwData.categories.map((cat) => cat.slug)
    : [];

  const visibleSlugs = isAdmin
    ? undefined
    : new Set(
        (fwData?.categories ?? [])
          .filter((cat) => canSeeCategory(access, cat.id))
          .map((cat) => cat.slug),
      );

  const nextSlug = getNextCategory(categorySlug, frameworkCategorySlugs, visibleSlugs);
  const prevSlug = getPrevCategory(categorySlug, frameworkCategorySlugs, visibleSlugs);

  const categoryIndex = frameworkCategorySlugs.indexOf(categorySlug);

  return (
    <div className="space-y-6">
      {guided && (
        <GuidedBanner
          currentIndex={categoryIndex}
          totalCategories={frameworkCategorySlugs.length}
        />
      )}
      <div className="flex items-start justify-between gap-4">
        <CategoryHeader
          name={tc(`categories.${category.code}.name`)}
          slug={category.slug}
          segments={segments}
          legalBasis={tc(`categories.${category.code}.legalBasis`)}
          referenceUrl={category.referenceUrl}
          nationalUrl={category.nationalUrl}
        />
        {assessment && (
          <ExportPolicyButton
            assessmentId={assessment.id}
            categoryCode={category.code}
            disabled={!statuses.every((s) =>
              ["completed", "approved", "not_applicable"].includes(s.currentStatus),
            )}
          />
        )}
      </div>

      <CategoryContent
        requirements={requirementRows}
        statuses={statuses}
        categorySlug={categorySlug}
      />

      <div className="flex items-center justify-between pt-6 border-t">
        {prevSlug ? (
          <Button variant="outline" asChild>
            <Link
              href={{
                pathname: "/compliance/[categorySlug]",
                params: { categorySlug: prevSlug },
                query: guided ? { guided: "true" } : undefined,
              }}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              {t("common.back")}
            </Link>
          </Button>
        ) : (
          <div />
        )}
        {nextSlug ? (
          <Button asChild>
            <Link
              href={{
                pathname: "/compliance/[categorySlug]",
                params: { categorySlug: nextSlug },
                query: guided ? { guided: "true" } : undefined,
              }}
            >
              {t("common.next")}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        ) : guided ? (
          <Button asChild>
            <Link href="/dashboard">
              {t("compliance.guided.finish")}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button disabled>{t("compliance.completeAssessment")}</Button>
        )}
      </div>
    </div>
  );
}
