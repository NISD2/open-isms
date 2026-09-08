"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

/** A neighbouring requirement. `categoryName` is set only when it sits in a
 *  different category, so the label can say the reader is changing section. */
export interface NavLink {
  code: string;
  categorySlug: string;
  categoryName: string | null;
}

interface RequirementFooterNavProps {
  prev: NavLink | null;
  next: NavLink | null;
  categorySlug: string;
  categoryName: string;
  /**
   * Persist unsaved form input before leaving, and resolve false to abort the
   * navigation if that fails.
   *
   * Navigation used to be plain links, so pressing Next with a dirty form
   * discarded whatever had been typed. Saving is the page's job, not this
   * component's, so the behaviour is injected rather than reimplemented here.
   */
  onBeforeNavigate?: () => Promise<boolean>;
  /** Terminal actions (sign off / not applicable / reopen) for the centre slot. */
  children?: React.ReactNode;
}

/**
 * The sticky action bar: back, the requirement's terminal actions, forward.
 *
 * Neighbours cross category boundaries, so the last requirement of a section
 * links to the first of the next one instead of dead-ending.
 */
export function RequirementFooterNav({
  prev,
  next,
  categorySlug,
  categoryName,
  onBeforeNavigate,
  children,
}: RequirementFooterNavProps) {
  const t = useTranslations("compliance");
  const router = useRouter();
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  async function go(target: string, href: Parameters<typeof router.push>[0]) {
    if (navigatingTo) return;
    setNavigatingTo(target);
    try {
      if (onBeforeNavigate && !(await onBeforeNavigate())) return;
      router.push(href);
    } finally {
      setNavigatingTo(null);
    }
  }

  const requirementHref = (link: NavLink) =>
    ({
      pathname: "/compliance/[categorySlug]/[requirementCode]",
      params: { categorySlug: link.categorySlug, requirementCode: link.code },
    }) as const;

  return (
    <div
      data-tour="requirement-nav"
      className="sticky bottom-0 z-30 -mx-6 mt-8 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
    >
      <div className="flex items-center justify-between px-6 py-3">
        <div>
          {prev ? (
            <Button
              variant="outline"
              size="sm"
              data-testid="requirement-prev"
              disabled={navigatingTo !== null}
              onClick={() => go("prev", requirementHref(prev))}
            >
              {navigatingTo === "prev" ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <ChevronLeft className="mr-1 h-4 w-4" />
              )}
              {prev.categoryName ?? t("requirement.prevRequirement")}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              data-testid="requirement-back-to-category"
              disabled={navigatingTo !== null}
              onClick={() =>
                go("category", {
                  pathname: "/compliance/[categorySlug]",
                  params: { categorySlug },
                })
              }
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              {t("requirement.backToCategory", { category: categoryName })}
            </Button>
          )}
        </div>

        {children}

        <div>
          {next && (
            <Button
              size="sm"
              data-testid="requirement-next"
              disabled={navigatingTo !== null}
              onClick={() => go("next", requirementHref(next))}
            >
              {next.categoryName ?? t("requirement.nextRequirement")}
              {navigatingTo === "next" ? (
                <Loader2 className="ml-1 h-4 w-4 animate-spin" />
              ) : (
                <ChevronRight className="ml-1 h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
