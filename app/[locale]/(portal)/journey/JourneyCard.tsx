"use client";

import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import type { JourneyItem } from "./views";

/**
 * Single-open accordion. Parent owns the openId so opening one card closes
 * the previously open one. Read-only preview: description + metadata; the
 * "Open full detail" link routes to the existing
 * /compliance/[categorySlug]/[requirementCode] page where the v4.1
 * hand-holding (intake form, sign-off mechanic, wiki link, workshop,
 * evidence upload) already lives.
 */
export function JourneyCard({
  item,
  isOpen,
  onToggle,
}: {
  item: JourneyItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-md border bg-card">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50"
      >
        <div className="flex min-w-0 items-center gap-3">
          {isOpen ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <span className="font-mono text-xs text-muted-foreground shrink-0">
            {item.code}
          </span>
          <h3 className="truncate text-sm font-medium">{item.title}</h3>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <StatusPill status={item.status} />
          <CompactDue value={item.dueAt} />
        </div>
      </button>

      {isOpen ? (
        <ExpandedPanel item={item} />
      ) : null}
    </div>
  );
}

function ExpandedPanel({ item }: { item: JourneyItem }) {
  return (
    <div className="border-t bg-muted/20 px-4 py-3 space-y-3">
      {item.description ? (
        <p className="text-sm text-foreground/80 leading-relaxed">
          {item.description}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        {item.priority ? (
          <Badge variant={item.priority === "P0" ? "destructive" : "secondary"}>
            Priority {item.priority}
          </Badge>
        ) : null}
        {item.requiredSignOffRole ? (
          <Badge variant="outline">
            Sign-off: {item.requiredSignOffRole.toUpperCase()}
          </Badge>
        ) : null}
        {item.frequency ? (
          <Badge variant="outline" className="capitalize">
            {item.frequency.replace(/-/g, " ")}
          </Badge>
        ) : null}
        {item.legalRef ? (
          <Badge variant="outline" className="font-mono">
            {item.legalRef.split(",")[0]?.trim()}
          </Badge>
        ) : null}
        {item.blocksCount > 0 ? (
          <Badge variant="destructive">
            Blocks {item.blocksCount}
          </Badge>
        ) : null}
      </div>

      <Link
        href={{
          pathname: "/compliance/[categorySlug]/[requirementCode]" as const,
          params: {
            categorySlug: item.categorySlug,
            requirementCode: item.code,
          },
        }}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        Open detail page <ExternalLink className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

/**
 * Map item_status enum to a friendly label + Badge variant.
 * Enum values: not_started / in_progress / completed / not_applicable /
 * needs_review / approved / rejected.
 */
function StatusPill({ status }: { status: string }) {
  const config: Record<
    string,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
  > = {
    approved: { label: "Signed", variant: "default" },
    needs_review: { label: "Awaiting sign-off", variant: "secondary" },
    completed: { label: "Done — pending review", variant: "secondary" },
    in_progress: { label: "In progress", variant: "outline" },
    not_started: { label: "Not started", variant: "outline" },
    not_applicable: { label: "N/A", variant: "outline" },
    rejected: { label: "Rejected", variant: "destructive" },
  };
  const { label, variant } = config[status] ?? {
    label: status.replace(/_/g, " "),
    variant: "outline" as const,
  };
  return <Badge variant={variant}>{label}</Badge>;
}

/**
 * Show due date only when meaningful — overdue (red) or within 14 days
 * (muted). Hide everything else; the metadata moves into the expanded
 * panel. Reduces visual noise on the collapsed list.
 */
function CompactDue({ value }: { value: Date | string | null }) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  const days = Math.floor((date.getTime() - Date.now()) / 86_400_000);
  if (days > 14) return null; // hide far-future due dates from the list

  const label =
    days < 0
      ? `${Math.abs(days)}d overdue`
      : days === 0
        ? "today"
        : days < 7
          ? `${days}d`
          : `${days}d`;
  return (
    <span
      className={`text-xs tabular-nums ${days < 0 ? "text-destructive" : "text-muted-foreground"}`}
    >
      {label}
    </span>
  );
}
