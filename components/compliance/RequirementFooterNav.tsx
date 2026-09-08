"use client";

import { useState } from "react";
import { useRouter, Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** A neighbouring requirement. `categoryName` is set only when it sits in a
 *  different category, so the label can say the reader is changing section. */
export interface NavLink {
  code: string;
  categorySlug: string;
  categoryName: string | null;
}

/**
 * The typed-route href shape this bar navigates to.
 *
 * Taken from `router.push`, the narrower of the two: Link additionally accepts
 * a raw UrlObject whose `query` may be null, which push rejects. Narrower
 * satisfies both, so one value can drive the anchor and the programmatic
 * navigation without a cast.
 */
type NavHref = Parameters<ReturnType<typeof useRouter>["push"]>[0];

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
 * A modified click is the browser's own "open this somewhere else" gesture.
 * Let it through untouched: the new tab gets the requirement, and this tab
 * keeps its unsaved input, which is what the reader asked for either way.
 */
function isModifiedClick(e: React.MouseEvent): boolean {
  return e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;
}

/**
 * The sticky action bar: back, the requirement's terminal actions, forward.
 *
 * Neighbours cross category boundaries, so the last requirement of a section
 * links to the first of the next one instead of dead-ending.
 *
 * These stay real anchors. An earlier revision made them buttons to get the
 * save-before-leaving hook in, which silently cost middle-click and
 * cmd-click-to-new-tab on the one control people page through the whole
 * assessment with. Intercepting a plain left click gets the same hook without
 * taking the affordance away.
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

  function handleNavigate(
    e: React.MouseEvent,
    target: string,
    href: NavHref,
  ): void {
    if (isModifiedClick(e)) return;
    e.preventDefault();
    if (navigatingTo) return;
    setNavigatingTo(target);
    void (async () => {
      try {
        if (onBeforeNavigate && !(await onBeforeNavigate())) return;
        router.push(href);
      } catch (err) {
        // The hook owns reporting its own failure. Catching here only keeps a
        // contract violation from becoming an unhandled rejection inside a
        // click handler, and stays put rather than navigating past it.
        console.error("[requirement-nav] save before navigate:", err);
      } finally {
        setNavigatingTo(null);
      }
    })();
  }

  const requirementHref = (link: NavLink) =>
    ({
      pathname: "/compliance/[categorySlug]/[requirementCode]",
      params: { categorySlug: link.categorySlug, requirementCode: link.code },
    }) as const;

  const busyClass = (target: string) =>
    cn(navigatingTo && navigatingTo !== target && "pointer-events-none opacity-60");

  return (
    <div
      data-tour="requirement-nav"
      className="sticky bottom-0 z-30 -mx-6 mt-8 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
    >
      <div className="flex items-center justify-between px-6 py-3">
        <div>
          {prev ? (
            <Button variant="outline" size="sm" asChild className={busyClass("prev")}>
              <Link
                href={requirementHref(prev)}
                data-testid="requirement-prev"
                onClick={(e) => handleNavigate(e, "prev", requirementHref(prev))}
              >
                {navigatingTo === "prev" ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <ChevronLeft className="mr-1 h-4 w-4" />
                )}
                {prev.categoryName ?? t("requirement.prevRequirement")}
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" asChild className={busyClass("category")}>
              <Link
                href={{
                  pathname: "/compliance/[categorySlug]",
                  params: { categorySlug },
                }}
                data-testid="requirement-back-to-category"
                onClick={(e) =>
                  handleNavigate(e, "category", {
                    pathname: "/compliance/[categorySlug]",
                    params: { categorySlug },
                  })
                }
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                {t("requirement.backToCategory", { category: categoryName })}
              </Link>
            </Button>
          )}
        </div>

        {children}

        <div>
          {next && (
            <Button size="sm" asChild className={busyClass("next")}>
              <Link
                href={requirementHref(next)}
                data-testid="requirement-next"
                onClick={(e) => handleNavigate(e, "next", requirementHref(next))}
              >
                {next.categoryName ?? t("requirement.nextRequirement")}
                {navigatingTo === "next" ? (
                  <Loader2 className="ml-1 h-4 w-4 animate-spin" />
                ) : (
                  <ChevronRight className="ml-1 h-4 w-4" />
                )}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
