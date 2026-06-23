"use client";

import { usePathname, useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Always-visible switch between the novice journey surface (/journey) and the
 * expert surface (/dashboard plus the role-views). Same underlying data, two
 * projections. Uses native next/navigation usePathname for the resolved URL
 * (next-intl's usePathname returns the route template, not the concrete path).
 */
export function ViewToggle() {
  const pathname = usePathname();
  const params = useParams() as { locale?: string };
  const stripped = params.locale
    ? pathname.replace(new RegExp(`^/${params.locale}(?=/|$)`), "")
    : pathname;

  const onJourney =
    stripped === "/journey" || stripped.startsWith("/journey/");
  const onExpert =
    stripped === "/dashboard" || stripped.startsWith("/dashboard/");
  const de = params.locale === "de";

  const base = "rounded-sm px-2.5 py-1 text-xs font-medium transition-colors";
  const active = "bg-background text-foreground shadow-sm";
  const idle = "text-muted-foreground hover:text-foreground";

  return (
    <div className="flex items-center rounded-md border bg-muted/50 p-0.5">
      <Link
        href="/journey"
        className={cn(base, onJourney ? active : idle)}
        aria-current={onJourney ? "page" : undefined}
      >
        Journey
      </Link>
      <Link
        href="/dashboard"
        className={cn(base, onExpert ? active : idle)}
        aria-current={onExpert ? "page" : undefined}
      >
        {de ? "Experte" : "Expert"}
      </Link>
    </div>
  );
}
