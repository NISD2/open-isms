"use client";

import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { usePortalPath } from "./use-portal-path";

/**
 * Always-visible switch between the journey surface (/journey) and the expert
 * statistics surface (/dashboard/stats). Same underlying data, two views.
 */
export function ViewToggle() {
  const stripped = usePortalPath();
  const params = useParams() as { locale?: string };

  const onJourney =
    stripped === "/journey" || stripped.startsWith("/journey/");
  const onStats =
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
        {de ? "Weg" : "Journey"}
      </Link>
      <Link
        href="/dashboard/stats"
        className={cn(base, onStats ? active : idle)}
        aria-current={onStats ? "page" : undefined}
      >
        {de ? "Statistik" : "Statistics"}
      </Link>
    </div>
  );
}
