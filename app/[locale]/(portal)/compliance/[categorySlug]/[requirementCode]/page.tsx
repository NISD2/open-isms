import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { RequirementDetail } from "@/components/compliance/RequirementDetail";
import type { NavLink } from "@/components/compliance/RequirementFooterNav";
import { loadRequirementDetail } from "@/lib/compliance/requirement-detail-data";
import { api } from "@/lib/trpc/server";

export default async function RequirementDetailPage({
  params,
}: {
  params: Promise<{ categorySlug: string; requirementCode: string }>;
}) {
  const { categorySlug, requirementCode } = await params;

  const data = await loadRequirementDetail(requirementCode);
  if (!data || data.categorySlug !== categorySlug) notFound();

  // Prev/next span the whole framework in journey order, not just this
  // category, so the last requirement of a category still offers the first
  // of the next one.
  const [adjacent, t] = await Promise.all([
    api.requirement.getAdjacent({ code: requirementCode }),
    getTranslations("compliance"),
  ]);

  // A neighbour in another category is worth naming: crossing from 9.3 to
  // 10.1 is a section change, and an unlabelled arrow hides that.
  const toNavLink = (
    link: typeof adjacent.prev,
    sameCategoryLabel: string,
  ): NavLink | null =>
    link
      ? {
          href: {
            pathname: "/compliance/[categorySlug]/[requirementCode]",
            params: { categorySlug: link.categorySlug, requirementCode: link.code },
          },
          label:
            link.categorySlug === categorySlug
              ? sameCategoryLabel
              : t(`categories.${link.categoryCode}.name`),
        }
      : null;

  // The first requirement of the framework has nothing before it; the way
  // back is its category page.
  const backToCategory: NavLink = {
    href: { pathname: "/compliance/[categorySlug]", params: { categorySlug } },
    label: t("requirement.backToCategory", { category: data.categoryName }),
  };

  return (
    <RequirementDetail
      {...data}
      prev={toNavLink(adjacent.prev, t("requirement.prevRequirement")) ?? backToCategory}
      next={toNavLink(adjacent.next, t("requirement.nextRequirement"))}
    />
  );
}
