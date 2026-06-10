"use client";

import { Fragment } from "react";
import { usePathname, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

function titleCase(slug: string) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function PortalHeader() {
  const t = useTranslations("portal");
  const tCompliance = useTranslations("compliance");
  const pathname = usePathname();
  const params = useParams() as {
    locale?: string;
    categorySlug?: string;
    requirementCode?: string;
  };

  // next-intl with pathnames returns the canonical template ("[categorySlug]")
  // from its usePathname. Native next/navigation gives us the resolved URL.
  // Strip a leading locale prefix if present so segment[0] is the section.
  const stripped = params.locale
    ? pathname.replace(new RegExp(`^/${params.locale}(?=/|$)`), "")
    : pathname;
  const segments = stripped.split("/").filter(Boolean);

  function buildBreadcrumbs() {
    if (segments.length === 0) {
      return [{ label: t("overview"), href: undefined }];
    }

    const crumbs: { label: string; href?: string }[] = [];

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
    } else if (segments[0] === "audit") {
      crumbs.push({ label: t("auditTrail"), href: undefined });
    } else {
      crumbs.push({ label: titleCase(segments[0]), href: undefined });
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
              <Fragment key={i}>
                {i > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {isLast || !crumb.href ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={crumb.href}>
                      {crumb.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
