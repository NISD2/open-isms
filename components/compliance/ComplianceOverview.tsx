"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ComplianceProgress } from "./ComplianceProgress";
import { AssignmentPopover, type CategoryOwner } from "./AssignmentPopover";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";

interface CategoryCard {
  id: string;
  code: string;
  name: string;
  slug: string;
  description: string | null;
  legalBasis: string | null;
  sortOrder: number;
  requirementCount: number;
  completed: number;
  total: number;
  owner: CategoryOwner | null;
}

interface ComplianceOverviewProps {
  categories: CategoryCard[];
  assessmentId: string | null;
  isAdmin: boolean;
}

export function ComplianceOverview({
  categories,
  assessmentId,
  isAdmin,
}: ComplianceOverviewProps) {
  const t = useTranslations("compliance");
  const tc = useTranslations("categories");

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          {t("overview.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("overview.subtitle")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat, i) => (
          <Link
            key={cat.id}
            href={{ pathname: "/compliance/[categorySlug]", params: { categorySlug: cat.slug } }}
            className="group rounded-lg border bg-card p-5 transition-colors hover:border-foreground/20 hover:bg-accent/50"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <h2 className="font-semibold text-sm leading-tight">
                  {cat.name}
                </h2>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
            </div>

            {tc.has(cat.slug) && (
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                {tc(cat.slug)}
              </p>
            )}

            {cat.legalBasis && (
              <Badge variant="outline" className="text-[10px] mb-3">
                {cat.legalBasis}
              </Badge>
            )}

            <ComplianceProgress
              completed={cat.completed}
              total={cat.total}
              className="mb-3"
            />

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {t("overview.requirements", { count: cat.requirementCount })}
              </span>
              {isAdmin && assessmentId && (
                <div onClick={(e) => e.preventDefault()}>
                  <AssignmentPopover
                    assessmentId={assessmentId}
                    categoryId={cat.id}
                    owner={cat.owner}
                  />
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
