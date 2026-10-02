"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Fragment } from "react";
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
 * visitors are not our users at all, and the courses, where the offer of help
 * would open over the lesson. Leaving it off renders no trigger.
 */
export function PortalHeader({
  guide,
  home,
}: {
  guide?: {
    hints: Record<Hint, boolean>;
    /** Cal.com handle from CAL_LINK, "" where the instance sets no calendar. */
    calLink: string;
    /** Support address from SUPPORT_EMAIL, "" where the instance sets none. */
    supportEmail: string;
  };
  /**
   * Root the trail at the portal's home: the journey, or the NIS 2 walkthrough
   * once it is the portal's front. Only the entity portal has one. The supplier
   * portal's visitors are external and have no journey to be sent to, and many
   * who take a course have not set up a company, so both keep a trail that
   * starts where they are.
   */
  home?: "journey" | "walkthrough";
}) {
  const t = useTranslations("portal");
  const tCompliance = useTranslations("compliance");
  const params = useParams() as {
    locale?: string;
    categorySlug?: string;
    requirementCode?: string;
  };
  const segments = usePortalPath().split("/").filter(Boolean);

  /**
   * In the entity portal every trail starts at its home, the journey, or the
   * walkthrough once that is the portal's front: the first item in the
   * sidebar, where /dashboard redirects, and where a requirement page is
   * reached from by opening a node.
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
            href: "/durchgang/nis2",
            at: ["durchgang", "walkthrough"],
          }
        : home === "journey"
          ? { label: t("journey"), href: "/journey", at: ["journey"] }
          : null;
    if (root && segments[0] !== undefined && root.at.includes(segments[0])) {
      return [{ label: root.label, href: undefined }];
    }

    const crumbs: { label: string; href?: string }[] = root
      ? [{ label: root.label, href: root.href }]
      : [];

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
      <Breadcrumb>
        <BreadcrumbList>
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1;
            return (
              // Keyed by label: a trail never repeats one, and the position a
              // crumb sits at changes whenever the root does.
              <Fragment key={crumb.label}>
                {i > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {isLast || !crumb.href ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto flex items-center gap-1">
        {guide && (
          <PortalGuide
            hints={guide.hints}
            calLink={guide.calLink}
            supportEmail={guide.supportEmail}
          />
        )}
      </div>
    </header>
  );
}
