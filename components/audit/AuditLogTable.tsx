"use client";

import {
  Activity,
  BadgeCheck,
  Bell,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Footprints,
  Gauge,
  GraduationCap,
  ListChecks,
  type LucideIcon,
  Paperclip,
  Server,
  Settings2,
  Truck,
  Users,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { AuditDiffView } from "./AuditDiffView";

interface AuditRow {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string;
  previousValue: unknown;
  newValue: unknown;
  userName: string | null;
  createdAt: Date;
}

interface AuditLogTableProps {
  rows: AuditRow[];
}

/** The sign of the area an action belongs to, by the first part of its name. */
const AREA_ICON: Readonly<Record<string, LucideIcon>> = {
  durchgang: Footprints,
  requirement: BadgeCheck,
  review: BadgeCheck,
  policy: FileText,
  managementReview: ClipboardCheck,
  training: GraduationCap,
  asset: Server,
  supplier: Truck,
  risk: Gauge,
  evidence: Paperclip,
  intake: ListChecks,
  notification: Bell,
  team: Users,
  user: Settings2,
  journey: Settings2,
  company: Settings2,
};

const BERLIN = "Europe/Berlin";

/** The calendar day in Berlin, as an ISO date that compares and groups as text. */
const dayOf = (date: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: BERLIN }).format(date);

/** A stored description says something only when it is a sentence, not the action's own name. */
const isSentence = (row: AuditRow) =>
  row.description !== row.action && row.description.includes(" ");

/** The rows, newest first as they come, in one group per Berlin day. */
const byDay = (rows: readonly AuditRow[]) => {
  const dayOfRow = (row: AuditRow) => dayOf(new Date(row.createdAt));
  return [...new Set(rows.map(dayOfRow))].map((day) => ({
    day,
    rows: rows.filter((row) => dayOfRow(row) === day),
  }));
};

/**
 * The company's activity, day by day: each entry says what happened in the reader's words, with
 * the sign of its area, who did it and when; what changed opens beneath it.
 */
export function AuditLogTable({ rows }: AuditLogTableProps) {
  const t = useTranslations("audit");
  const locale = useLocale();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-8 text-center">
        <p className="text-muted-foreground">{t("noEntries")}</p>
      </div>
    );
  }

  const today = dayOf(new Date());
  const yesterday = dayOf(new Date(Date.now() - 86_400_000));
  const dateLabel = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: BERLIN,
  });
  const timeLabel = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: BERLIN,
  });

  const labelOf = (row: AuditRow) =>
    t.has(`actions.${row.action}`)
      ? t(`actions.${row.action}`)
      : isSentence(row)
        ? row.description
        : row.action;
  const detailOf = (row: AuditRow) =>
    t.has(`actions.${row.action}`) && isSentence(row) ? row.description : null;

  return (
    <div className="space-y-8">
      {byDay(rows).map((group) => (
        <section key={group.day}>
          <h2 className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {group.day === today
              ? t("today")
              : group.day === yesterday
                ? t("yesterday")
                : dateLabel.format(new Date(group.rows[0]?.createdAt ?? group.day))}
          </h2>
          <ol className="divide-y overflow-hidden rounded-2xl border bg-card">
            {group.rows.map((row) => {
              const Icon = AREA_ICON[row.action.split(".")[0] ?? ""] ?? Activity;
              const hasDiff = !!(row.previousValue || row.newValue);
              const open = expandedId === row.id;
              const detail = detailOf(row);
              const body = (
                <>
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/[0.08] text-primary">
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{labelOf(row)}</span>
                    {detail && (
                      <span className="block truncate text-muted-foreground">
                        {detail}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-right text-xs text-muted-foreground">
                    <span className="block">{row.userName ?? t("system")}</span>
                    <span className="block tabular-nums">
                      {timeLabel.format(new Date(row.createdAt))}
                    </span>
                  </span>
                  {hasDiff &&
                    (open ? (
                      <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    ))}
                </>
              );
              return (
                <li key={row.id}>
                  {hasDiff ? (
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setExpandedId(open ? null : row.id)}
                      className="flex w-full cursor-pointer items-center gap-4 px-4 py-3 text-left text-sm transition-colors hover:bg-accent/50 focus-visible:bg-accent/50 focus-visible:outline-none"
                    >
                      {body}
                    </button>
                  ) : (
                    <div className="flex items-center gap-4 px-4 py-3 text-sm">
                      {body}
                    </div>
                  )}
                  {open && hasDiff && (
                    <div className="border-t bg-muted/30 px-4 py-3 pl-16">
                      <AuditDiffView
                        previousValue={row.previousValue}
                        newValue={row.newValue}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
