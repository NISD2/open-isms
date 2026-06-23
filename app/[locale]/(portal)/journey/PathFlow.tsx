"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Check, Lock, AlertTriangle, Scale, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BANDS,
  BAND_RANK,
  COLUMNS,
  FREQUENCY_LABEL,
  ORDERED_CATEGORIES,
  ROLE_LABEL,
  type Band,
  type FlowNode,
  type Order,
} from "./path-nodes";
import { journeyDisclaimer, journeyDisclaimerLabel } from "./disclaimer";

type Locale = "en" | "de" | "nl";
type StatusFilter = "open" | "overdue" | "awaiting";

type Aggregate = {
  total: number;
  done: number;
  awaitingSignoff: number;
  overdue: number;
  open: number;
};

type Section = {
  key: string;
  title: string;
  subtitle: string | null;
  phase: string | null;
  band: Band | null;
  rows: { node: FlowNode; index: number }[];
};

const ORDER_OPTS: { key: Order; en: string; de: string; sub_en: string; sub_de: string }[] = [
  {
    key: "defensible",
    en: "Defensible minimum first",
    de: "Belastbares Minimum zuerst",
    sub_en: "What an auditor checks first",
    sub_de: "Was ein Auditor zuerst prüft",
  },
  {
    key: "chrono",
    en: "Chronological order",
    de: "Chronologische Reihenfolge",
    sub_en: "The natural process order",
    sub_de: "Die natürliche Prozessreihenfolge",
  },
];

function buildSections(reqNodes: FlowNode[], order: Order, de: boolean): Section[] {
  if (order === "chrono") {
    // reqNodes already arrive in chronological (process) order.
    const withIdx = reqNodes.map((node, i) => ({ node, index: i + 1 }));
    return ORDERED_CATEGORIES.map((cat) => ({
      key: cat.code,
      title: de ? cat.nameDe : cat.name,
      subtitle: null,
      phase: null,
      band: null,
      rows: withIdx.filter((r) => r.node.categoryCode === cat.code),
    })).filter((s) => s.rows.length > 0);
  }
  // Defensible: stable-sort by band rank (preserves process order within band).
  const ordered = [...reqNodes].sort((a, b) => BAND_RANK[a.band] - BAND_RANK[b.band]);
  const withIdx = ordered.map((node, i) => ({ node, index: i + 1 }));
  return BANDS.map((b) => ({
    key: b.key,
    title: de ? b.de : b.en,
    subtitle: de ? b.hintDe : b.hintEn,
    phase: de ? b.phaseDe : b.phaseEn,
    band: b.key,
    rows: withIdx.filter((r) => r.node.band === b.key),
  })).filter((s) => s.rows.length > 0);
}

function matchesFilter(node: FlowNode, filter: StatusFilter): boolean {
  if (filter === "open") return node.status !== "done";
  if (filter === "overdue") return node.isOverdue;
  return node.rawStatus === "needs_review"; // awaiting
}

export function PathFlow({
  reqNodes,
  aggregate,
  locale,
}: {
  reqNodes: FlowNode[];
  aggregate: Aggregate;
  locale: Locale;
}) {
  const de = locale === "de";
  const [order, setOrder] = useState<Order>("defensible");
  const [filter, setFilter] = useState<StatusFilter | null>(null);

  // The role swimlane only adds value when a section mixes roles (defensible
  // bands do). Chronological sections are one-category, hence single-role, so
  // they render as a single numbered column instead of 3 empty gutters.
  const swimlane = order === "defensible";
  const sections = buildSections(reqNodes, order, de);
  const rowCols = swimlane
    ? "grid-cols-[2.75rem_repeat(4,minmax(0,1fr))]"
    : "grid-cols-[2.75rem_minmax(0,1fr)]";

  return (
    <div className="space-y-3">
      <AggregateBar
        aggregate={aggregate}
        filter={filter}
        setFilter={setFilter}
        de={de}
      />
      <OrderToggle order={order} setOrder={setOrder} de={de} />

      <div className="overflow-x-auto rounded-lg border bg-card">
        <div className={cn(swimlane ? "min-w-[820px]" : "min-w-[460px]")}>
          {swimlane ? (
            <>
              <div className="px-3 pt-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:px-4">
                {de ? "Verantwortliche Rolle" : "Responsible role"}
              </div>
              <div className={cn("grid gap-2 border-b bg-muted/40 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:px-4", rowCols)}>
                <span className="text-center">#</span>
                {COLUMNS.map((c) => (
                  <span key={c.key} className="truncate">
                    {de ? c.de : c.en}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className={cn("grid gap-2 border-b bg-muted/40 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:px-4", rowCols)}>
              <span className="text-center">#</span>
              <span>{de ? "Schritt" : "Step"}</span>
            </div>
          )}

          {sections.map((section) => (
            <section key={section.key}>
              <SectionHeader section={section} locale={locale} />
              <ol className="px-3 sm:px-4">
                {section.rows.map(({ node, index }, i) => (
                  <li
                    key={node.id}
                    className={cn("grid items-center gap-2 py-1.5", rowCols)}
                  >
                    <Rail
                      index={index}
                      status={node.status}
                      isFirst={i === 0}
                      isLast={i === section.rows.length - 1}
                    />
                    {swimlane ? (
                      COLUMNS.map((c) => (
                        <div key={c.key}>
                          {node.column === c.key ? (
                            <NodeCard
                              node={node}
                              locale={locale}
                              dimmed={filter !== null && !matchesFilter(node, filter)}
                            />
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <NodeCard
                        node={node}
                        locale={locale}
                        showOwner
                        dimmed={filter !== null && !matchesFilter(node, filter)}
                      />
                    )}
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function AggregateBar({
  aggregate,
  filter,
  setFilter,
  de,
}: {
  aggregate: Aggregate;
  filter: StatusFilter | null;
  setFilter: (f: StatusFilter | null) => void;
  de: boolean;
}) {
  const pct =
    aggregate.total > 0 ? Math.round((aggregate.done / aggregate.total) * 100) : 0;
  const toggle = (f: StatusFilter) => setFilter(filter === f ? null : f);

  return (
    <div className="rounded-lg border bg-card p-3 sm:p-4">
      <div className="flex items-center gap-3">
        <Progress value={pct} className="h-2 flex-1" />
        <span className="shrink-0 text-sm font-semibold tabular-nums">{pct}%</span>
        <span className="shrink-0 text-xs text-muted-foreground">
          {aggregate.done}/{aggregate.total} {de ? "erledigt" : "done"}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <FilterChip
          label={de ? "Offen" : "Open"}
          value={aggregate.open}
          active={filter === "open"}
          onClick={() => toggle("open")}
        />
        <FilterChip
          label={de ? "Überfällig" : "Overdue"}
          value={aggregate.overdue}
          active={filter === "overdue"}
          tone={aggregate.overdue > 0 ? "destructive" : "default"}
          onClick={() => toggle("overdue")}
        />
        <FilterChip
          label={de ? "Warten auf Freigabe" : "Awaiting sign-off"}
          value={aggregate.awaitingSignoff}
          active={filter === "awaiting"}
          onClick={() => toggle("awaiting")}
        />
        {filter !== null ? (
          <button
            type="button"
            onClick={() => setFilter(null)}
            className="rounded-full px-2.5 py-1 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            {de ? "Filter zurücksetzen" : "Clear filter"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function FilterChip({
  label,
  value,
  active,
  tone = "default",
  onClick,
}: {
  label: string;
  value: number;
  active: boolean;
  tone?: "default" | "destructive";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-accent/40",
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "tabular-nums",
          active
            ? "text-primary-foreground"
            : tone === "destructive" && value > 0
              ? "text-destructive"
              : "text-muted-foreground",
        )}
      >
        {value}
      </span>
    </button>
  );
}

function OrderToggle({
  order,
  setOrder,
  de,
}: {
  order: Order;
  setOrder: (o: Order) => void;
  de: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={de ? "Reihenfolge" : "Ordering"} className="grid grid-cols-2 gap-2">
      {ORDER_OPTS.map((opt) => {
        const on = opt.key === order;
        return (
          <button
            key={opt.key}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => setOrder(opt.key)}
            className={cn(
              "rounded-lg border px-3 py-2 text-left transition-colors",
              on
                ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                : "border-border bg-card hover:border-primary/40 hover:bg-accent/30",
            )}
          >
            <div className="flex items-center gap-1.5">
              {opt.key === "defensible" ? (
                <Scale className="h-3.5 w-3.5 text-primary" />
              ) : (
                <Repeat className="h-3.5 w-3.5 text-primary" />
              )}
              <span
                className={cn(
                  "text-sm font-semibold",
                  on ? "text-foreground" : "text-foreground/80",
                )}
              >
                {de ? opt.de : opt.en}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {de ? opt.sub_de : opt.sub_en}
            </p>
          </button>
        );
      })}
    </div>
  );
}

function SectionHeader({
  section,
  locale,
}: {
  section: Section;
  locale: Locale;
}) {
  return (
    <div className="flex items-center gap-2 border-b bg-muted/20 px-3 py-1.5 sm:px-4">
      <h3 className="text-xs font-semibold tracking-wide text-foreground">
        {section.title}
      </h3>
      {section.subtitle ? (
        <span className="hidden text-[11px] text-muted-foreground sm:inline">
          {section.subtitle}
        </span>
      ) : null}
      {section.band ? <DisclaimerIcon locale={locale} /> : null}
      <span className="ml-auto flex items-center gap-2">
        {section.phase ? (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            {section.phase}
          </span>
        ) : null}
        <span className="text-[11px] tabular-nums text-muted-foreground">
          {section.rows.length}
        </span>
      </span>
    </div>
  );
}

/** Yellow info affordance reusing the one canonical disclaimer string. */
function DisclaimerIcon({ locale }: { locale: Locale }) {
  return (
    <HoverCard openDelay={120} closeDelay={60}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          aria-label={journeyDisclaimerLabel(locale)}
          className="inline-flex text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        side="top"
        className="w-72 text-xs leading-relaxed text-muted-foreground"
      >
        {journeyDisclaimer(locale)}
      </HoverCardContent>
    </HoverCard>
  );
}

function Rail({
  index,
  status,
  isFirst,
  isLast,
}: {
  index: number;
  status: FlowNode["status"];
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div className="grid grid-cols-[1.1rem_1.4rem] items-center self-stretch">
      <span className="pr-1 text-right text-[10px] tabular-nums text-muted-foreground">
        {index}
      </span>
      <div className="relative flex justify-center self-stretch">
        {/* Continuous timeline spine. Negative offsets bridge the row's
            vertical padding so consecutive segments touch (no gaps). */}
        <span
          aria-hidden
          className={cn(
            "absolute left-1/2 w-px -translate-x-1/2 bg-border",
            isFirst ? "top-1/2" : "-top-1.5",
            isLast ? "bottom-1/2" : "-bottom-1.5",
          )}
        />
        <span className="relative z-10 flex items-center">
          <StepDot status={status} />
        </span>
      </div>
    </div>
  );
}

function StepDot({ status }: { status: FlowNode["status"] }) {
  const cls =
    status === "done"
      ? "border-primary bg-primary text-primary-foreground"
      : status === "current"
        ? "border-primary bg-background text-primary ring-2 ring-primary/30"
        : "border-border bg-background text-muted-foreground";
  return (
    <div className={cn("flex h-5 w-5 items-center justify-center rounded-full border", cls)}>
      {status === "done" ? (
        <Check className="h-3 w-3" />
      ) : status === "current" ? (
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
      )}
    </div>
  );
}

function hrefFor(node: FlowNode) {
  return {
    pathname: "/compliance/[categorySlug]/[requirementCode]" as const,
    params: { categorySlug: node.categorySlug, requirementCode: node.code },
  };
}

function NodeCard({
  node,
  locale,
  dimmed,
  showOwner = false,
}: {
  node: FlowNode;
  locale: Locale;
  dimmed: boolean;
  showOwner?: boolean;
}) {
  const de = locale === "de";
  const owner = ROLE_LABEL[node.ownerRole] ?? { en: node.ownerRole, de: node.ownerRole };
  const ownerLabel = de ? owner.de : owner.en;
  const freq = node.frequency ? FREQUENCY_LABEL[node.frequency] : null;
  const freqLabel = freq ? (de ? freq.de : freq.en) : node.frequency;
  const href = hrefFor(node);

  const ring =
    node.status === "current"
      ? "border-primary shadow-sm ring-1 ring-primary/20"
      : node.status === "done"
        ? "border-border/60 bg-muted/30"
        : "border-border";

  return (
    <HoverCard openDelay={140} closeDelay={60}>
      <HoverCardTrigger asChild>
        <Link
          href={href}
          className={cn(
            "block rounded-md border bg-background p-2 transition-all hover:border-primary/60 hover:bg-accent/40",
            ring,
            dimmed && "opacity-40 hover:opacity-100",
          )}
        >
          <div className="flex items-center gap-1.5">
            <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
              {node.code}
            </span>
            <span className="truncate text-sm font-medium">{node.label}</span>
            <span className="ml-auto flex shrink-0 items-center gap-1.5">
              {showOwner ? (
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {ownerLabel}
                </span>
              ) : null}
              {node.priority === "P0" ? (
                <Badge variant="secondary" className="px-1 py-0 text-[10px]">
                  P0
                </Badge>
              ) : null}
              {node.status === "current" ? (
                <Badge className="px-1 py-0 text-[10px]">{de ? "Jetzt" : "Now"}</Badge>
              ) : node.status === "upcoming" ? (
                <Lock className="h-3 w-3 text-muted-foreground" />
              ) : (
                <Check className="h-3 w-3 text-primary" />
              )}
            </span>
          </div>
        </Link>
      </HoverCardTrigger>
      <HoverCardContent side="top" className="w-80">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-snug">
            <span className="font-mono text-xs text-muted-foreground">{node.code}</span>{" "}
            {node.label}
          </p>
          <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {ownerLabel}
          </span>
        </div>
        {node.description ? (
          <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
            {node.description}
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
          {node.priority ? (
            <span className="rounded bg-muted px-1.5 py-0.5 font-medium">{node.priority}</span>
          ) : null}
          {freqLabel ? (
            <span className="inline-flex items-center gap-0.5">
              <Repeat className="h-3 w-3" />
              {freqLabel}
            </span>
          ) : null}
          {node.legalRef ? <span className="font-mono">{node.legalRef}</span> : null}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
