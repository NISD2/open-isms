"use client";

/**
 * Compliance overview — category grid with per-category progress.
 *
 * Pre-translated approach: consumer-side server component pre-formats
 * all strings (category name, description, label, etc.) and passes
 * concrete values. No `t` function props (can't cross server/client
 * boundary), no coupling to next-intl.
 *
 * SaaS-specific UI (assignment popovers, ownership badges) is opted in
 * via `categoryActions` — a map of category.id → ReactNode. The OSS
 * app leaves this empty; the private app pre-renders its
 * AssignmentPopover instances into the map.
 *
 * Navigation is via `getCategoryHref(slug)` — defaults to
 * `/compliance/{slug}` (works for OSS); private overrides with the
 * locale-prefixed path.
 */

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@nisd2/isms-ui/components/badge";
import { ComplianceProgress } from "./compliance-progress";

export interface CategoryCard {
  id: string;
  code: string;
  /** Pre-translated category name. */
  name: string;
  slug: string;
  /** Pre-translated category description, or null to omit. */
  description: string | null;
  /** Legal basis badge text, or null to omit. */
  legalBasis: string | null;
  sortOrder: number;
  requirementCount: number;
  completed: number;
  total: number;
  /** Pre-formatted label like "12 requirements". */
  requirementsLabel: string;
  /** Pre-formatted label like "5 of 12 complete". */
  progressLabel: string;
}

export interface ComplianceOverviewProps {
  categories: CategoryCard[];
  /** Pre-translated page title. Defaults to "Compliance". */
  title?: string;
  /** Pre-translated page subtitle. */
  subtitle?: string;
  /**
   * Optional href builder for category links. Defaults to
   * `/compliance/{slug}`. The private app overrides this to inject
   * the locale prefix.
   */
  getCategoryHref?: (slug: string) => string;
  /**
   * Optional per-category render slots. Rendered in the bottom-right
   * of each card alongside the requirement count. The private app
   * uses this for the AssignmentPopover; the OSS app leaves it empty
   * (no multi-user assignments today).
   *
   * Keyed by `category.id`.
   */
  categoryActions?: Record<string, ReactNode>;
}

export function ComplianceOverview({
  categories,
  title = "Compliance",
  subtitle = "Track requirements across the loaded frameworks.",
  getCategoryHref,
  categoryActions,
}: ComplianceOverviewProps) {
  const hrefBuilder = getCategoryHref ?? ((slug) => `/compliance/${slug}`);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat, i) => {
          const action = categoryActions?.[cat.id];

          return (
            <Link
              key={cat.id}
              href={hrefBuilder(cat.slug)}
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

              {cat.description && (
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                  {cat.description}
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
                label={cat.progressLabel}
                className="mb-3"
              />

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {cat.requirementsLabel}
                </span>
                {action ? (
                  <div onClick={(e) => e.preventDefault()}>{action}</div>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
