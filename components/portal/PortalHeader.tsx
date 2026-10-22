"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Fragment } from "react";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { PortalGuide } from "@/components/onboarding/PortalGuide";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { WALK_ROUTES } from "@/lib/durchgang/routes";
import type { Hint } from "@/lib/onboarding/hints";
import { isLabelledSegment, SEGMENT_LABELS } from "./segment-labels";
import { usePortalPath } from "./use-portal-path";

function titleCase(slug: string) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * `guide` is optional because this header is reused by two surfaces that
 * should not carry the product tour: the external supplier portal, whose
 * visitors are not our users at all, and the courses, where a tour would open
 * over the lesson. Leaving it off renders no trigger.
 */
export function PortalHeader({
  guide,
  home,
  courseTitles,
}: {
  guide?: { hints: Record<Hint, boolean> };
  /**
   * The courses' names in the reader's language, by course id. Only the training portal passes
   * them, so its trail can read "Training / <course> / Lesson 0.1" instead of
   * stopping at "Training" on every page.
   */
  courseTitles?: Readonly<Record<string, string>>;
  /**
   * Root the trail at the portal's home, the NIS 2 walkthrough. Only the entity
   * portal has one. The supplier portal's visitors are external and have no
   * walk to be sent to, and many who take a course have not set up a company,
   * so both keep a trail that starts where they are.
   */
  home?: "walkthrough";
}) {
  const t = useTranslations("portal");
  const tCompliance = useTranslations("compliance");
  const tTraining = useTranslations("trainingPortal");
  const params = useParams() as {
    locale?: string;
    categorySlug?: string;
    requirementCode?: string;
    /** A walk item's code, on its page: shown as written ("G-DPO.1"), never title-cased. */
    code?: string;
  };
  const segments = usePortalPath().split("/").filter(Boolean);

  /**
   * In the entity portal every trail starts at its home, the walkthrough: the
   * first item in the sidebar, and where /dashboard redirects.
   *
   * Before this, a requirement page read "NIS2 Compliance / Registration /
   * 12.1" — a trail through the framework tree, which is the alternative
   * index rather than the way anyone actually arrived. With two journey
   * layouts and a framework tree all leading to the same pages, a breadcrumb
   * that names only the densest of them tells a new user the product is
   * bigger and more tangled than it is.
   */
  function buildBreadcrumbs() {
    if (segments.length === 0) {
      return [{ label: t("overview"), href: undefined }];
    }
    const root =
      home === "walkthrough"
        ? {
            label: t("durchgang"),
            href: WALK_ROUTES.nis2.home,
            at: ["durchgang", "walkthrough"],
          }
        : null;
    if (root && segments[0] !== undefined && root.at.includes(segments[0])) {
      // Below a walk's home (/durchgang/<walk>/<item>, its approval page): back to that walk's
      // home, and where you are. The GDPR walk's slug is "dsgvo" in German, "gdpr" in English.
      const walk =
        segments[1] === "dsgvo" || segments[1] === "gdpr"
          ? { label: t("durchgangGdpr"), href: WALK_ROUTES.gdpr.home }
          : root;
      const below = segments.slice(2).at(-1);
      return below === undefined
        ? [{ label: walk.label, href: undefined }]
        : [
            { label: walk.label, href: walk.href },
            { label: params.code ?? titleCase(below), href: undefined },
          ];
    }

    const crumbs: { label: string; href?: string }[] = root
      ? [{ label: root.label, href: root.href }]
      : [];

    // /training/courses/<course>/<lesson>: the course by its name, then the lesson by its number.
    const [, coursesSegment, courseId, lessonId] = segments;
    if (
      segments[0] === "training" &&
      courseTitles &&
      coursesSegment === "courses" &&
      courseId
    ) {
      return [
        { label: t(SEGMENT_LABELS.training), href: "/training/courses" },
        {
          label: courseTitles[courseId] ?? titleCase(courseId),
          href: lessonId ? `/training/courses/${courseId}` : undefined,
        },
        ...(lessonId
          ? [{ label: `${tTraining("lesson")} ${lessonId}`, href: undefined }]
          : []),
      ];
    }

    if (segments[0] === "compliance") {
      crumbs.push({ label: tCompliance("title"), href: "/compliance" });
      const categorySlug = params.categorySlug;
      const requirementCode = params.requirementCode;
      if (categorySlug) {
        const hasRequirement = !!requirementCode;
        crumbs.push({
          label: titleCase(categorySlug),
          href: hasRequirement ? `/compliance/${categorySlug}` : undefined,
        });
        if (requirementCode) {
          crumbs.push({ label: requirementCode, href: undefined });
        }
      }
    } else {
      const segment = segments[0];
      crumbs.push({
        label: isLabelledSegment(segment)
          ? t(SEGMENT_LABELS[segment])
          : titleCase(segment),
        href: undefined,
      });
    }

    return crumbs;
  }

  const crumbs = buildBreadcrumbs();

  return (
    <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center gap-2 border-b border-border/60 bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 !h-4" />
      <Breadcrumb className="min-w-0">
        <BreadcrumbList className="flex-nowrap">
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1;
            // A phone keeps the last two crumbs on one line; the header is one row high and a
            // three-part trail wrapped out of it.
            // The last crumb (where you are) never truncates; the one before it gives way.
            const phone =
              i < crumbs.length - 2
                ? "hidden sm:inline-flex"
                : isLast
                  ? "shrink-0"
                  : "min-w-0";
            return (
              // Keyed by label: a trail never repeats one, and the position a
              // crumb sits at changes whenever the root does.
              <Fragment key={crumb.label}>
                {i > 0 && (
                  // The separator after a hidden crumb goes with it.
                  <BreadcrumbSeparator
                    className={
                      i <= crumbs.length - 2 ? "hidden sm:inline-flex" : undefined
                    }
                  />
                )}
                <BreadcrumbItem className={phone}>
                  {isLast || !crumb.href ? (
                    <BreadcrumbPage className="truncate">{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={crumb.href} className="truncate">
                      {crumb.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
      {/* The language sits here in every portal, beside the help, not at the foot of the sidebar
          (Simon, 05.10.2026); the profile menu keeps its own. */}
      <div className="ml-auto flex items-center gap-1">
        <LocaleSwitcher />
        {guide && <PortalGuide hints={guide.hints} />}
      </div>
    </header>
  );
}
