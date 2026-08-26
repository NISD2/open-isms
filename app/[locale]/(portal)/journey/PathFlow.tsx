"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Check,
  CheckCheck,
  Minus,
  AlertTriangle,
  CalendarClock,
  Scale,
  Repeat,
  Info,
  Users,
  X,
} from "lucide-react";
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
type StatusFilter = "open" | "overdue" | "duesoon" | "awaiting";
type DotState = "todo" | "started" | "awaiting" | "signed" | "na" | "rejected";

type Aggregate = {
  total: number;
  done: number;
  awaitingSignoff: number;
  overdue: number;
  dueSoon: number;
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
    en: "Defensible minimum",
    de: "Belastbares Minimum",
    sub_en: "Biggest risk and legal exposure first.",
    sub_de: "Groesstes Risiko und Haftung zuerst.",
  },
  {
    key: "chrono",
    en: "Chronological",
    de: "Chronologisch",
    sub_en: "Ordered by the natural process, category by category.",
    sub_de: "Sortiert nach dem natürlichen Prozess, Kategorie für Kategorie.",
  },
];

function dotStateOf(rawStatus: string): DotState {
  // "completed" = user sign-off done; "approved" adds legal review. Both done.
  if (rawStatus === "completed" || rawStatus === "approved") return "signed";
  if (rawStatus === "not_applicable") return "na";
  if (rawStatus === "needs_review") return "awaiting";
  if (rawStatus === "rejected") return "rejected";
  if (rawStatus === "in_progress") return "started";
  return "todo";
}

function isDoneStatus(rawStatus: string): boolean {
  return (
    rawStatus === "completed" ||
    rawStatus === "approved" ||
    rawStatus === "not_applicable"
  );
}

function statusLabel(rawStatus: string, de: boolean): string {
  switch (rawStatus) {
    case "completed":
      return de ? "Freigegeben" : "Signed off";
    case "approved":
      return de ? "Geprüft" : "Reviewed";
    case "not_applicable":
      return de ? "Nicht zutreffend" : "Not applicable";
    case "needs_review":
      return de ? "Wartet auf Freigabe" : "Awaiting sign-off";
    case "in_progress":
      return de ? "In Arbeit" : "In progress";
    case "rejected":
      return de ? "Abgelehnt" : "Rejected";
    default:
      return de ? "Offen" : "Open";
  }
}

function buildSections(reqNodes: FlowNode[], order: Order, de: boolean): Section[] {
  if (order === "chrono") {
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
  if (filter === "duesoon")
    return node.dueInDays !== null && node.dueInDays >= 0 && node.dueInDays <= 30;
  return node.rawStatus === "needs_review";
}

export function PathFlow({
  reqNodes,
  aggregate,
  locale,
  focusCategory = null,
}: {
  reqNodes: FlowNode[];
  aggregate: Aggregate;
  locale: Locale;
  /** Category code (e.g. "SUP") to scroll to and highlight, from ?focus=. */
  focusCategory?: string | null;
}) {
  const de = locale === "de";
  const [order, setOrder] = useState<Order>("defensible");
  const [filter, setFilter] = useState<StatusFilter | null>(null);
  const [highlightedCode, setHighlightedCode] = useState<string | null>(null);

  // Arriving from a course lesson via ?focus=<category>: scroll the category's
  // first step to center and spotlight it briefly, then let it fade.
  useEffect(() => {
    if (!focusCategory) return;
    const target = reqNodes.find((n) => n.categoryCode === focusCategory);
    if (!target) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const scrollTimer = setTimeout(() => {
      document
        .getElementById(`step-${target.code}`)
        ?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      setHighlightedCode(target.code);
    }, 300);
    const clearTimer = setTimeout(() => setHighlightedCode(null), 2300);
    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(clearTimer);
    };
  }, [focusCategory, reqNodes]);

  const swimlane = order === "defensible";
  const sections = buildSections(reqNodes, order, de);
  const rowCols = swimlane
    ? "grid-cols-[2.75rem_repeat(4,minmax(0,1fr))]"
    : "grid-cols-[2.75rem_minmax(0,1fr)]";
  const activeOrder = ORDER_OPTS.find((o) => o.key === order);
  // Only the very first row is toured, so it is the only one that needs the
  // marker (see components/onboarding/tour/steps.ts).
  const firstNodeId = sections[0]?.rows[0]?.node.id;

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold tracking-tight">
        {de ? "Die Reise" : "The Journey"}
      </h2>
      {/* Control bar: ordering (primary) on the left, filters on the right. */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <OrderToggle order={order} setOrder={setOrder} de={de} />
        <FilterGroup
          aggregate={aggregate}
          filter={filter}
          setFilter={setFilter}
          de={de}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p className="text-[11px] text-muted-foreground">
          {de ? activeOrder?.sub_de : activeOrder?.sub_en}
        </p>
        <Legend de={de} />
      </div>

      <div
        data-tour="journey-board"
        className="overflow-x-auto rounded-lg border bg-card"
      >
        <div className={cn(swimlane ? "min-w-[820px]" : "min-w-[460px]")}>
          <div className={cn("grid gap-2 border-b bg-muted/40 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:px-4", rowCols)}>
            <span className="text-center">#</span>
            {swimlane ? (
              COLUMNS.map((c) => <ColumnHeader key={c.key} col={c} de={de} />)
            ) : (
              <span>{de ? "Schritt" : "Step"}</span>
            )}
          </div>

          {sections.map((section) => (
            <section key={section.key}>
              <SectionHeader section={section} locale={locale} />
              <ol className="px-3 sm:px-4">
                {section.rows.map(({ node, index }, i) => (
                  <li
                    key={node.id}
                    id={`step-${node.code}`}
                    data-tour={
                      node.id === firstNodeId ? "journey-first-step" : undefined
                    }
                    className={cn("grid items-center gap-2 py-1.5", rowCols)}
                  >
                    <Rail
                      index={index}
                      state={dotStateOf(node.rawStatus)}
                      current={node.status === "current"}
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
                              highlighted={highlightedCode === node.code}
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
                        highlighted={highlightedCode === node.code}
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
    <div
      data-tour="journey-order"
      role="radiogroup"
      aria-label={de ? "Reihenfolge" : "Ordering"}
      className="inline-flex rounded-lg border bg-muted/60 p-0.5"
    >
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
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              on
                ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {opt.key === "defensible" ? (
              <Scale className="h-3.5 w-3.5" />
            ) : (
              <Repeat className="h-3.5 w-3.5" />
            )}
            {de ? opt.de : opt.en}
          </button>
        );
      })}
    </div>
  );
}

function FilterGroup({
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
  const toggle = (f: StatusFilter) => setFilter(filter === f ? null : f);
  return (
    <div data-tour="journey-filters" className="flex flex-wrap items-center gap-1.5">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {de ? "Filter" : "Filter"}
      </span>
      <FilterChip
        label={de ? "Offen" : "Open"}
        value={aggregate.open}
        active={filter === "open"}
        onClick={() => toggle("open")}
      />
      <FilterChip
        label={de ? "Prüfung überfällig" : "Review overdue"}
        value={aggregate.overdue}
        active={filter === "overdue"}
        tone={aggregate.overdue > 0 ? "destructive" : "default"}
        onClick={() => toggle("overdue")}
      />
      <FilterChip
        label={de ? "Prüfung bald" : "Review due"}
        value={aggregate.dueSoon}
        active={filter === "duesoon"}
        onClick={() => toggle("duesoon")}
      />
      <FilterChip
        label={de ? "Freigabe offen" : "Awaiting"}
        value={aggregate.awaitingSignoff}
        active={filter === "awaiting"}
        onClick={() => toggle("awaiting")}
      />
      {filter !== null ? (
        <button
          type="button"
          onClick={() => setFilter(null)}
          aria-label={de ? "Filter zurücksetzen" : "Clear filter"}
          className="inline-flex items-center text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
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
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "tabular-nums font-medium",
          active
            ? "text-primary-foreground"
            : tone === "destructive" && value > 0
              ? "text-destructive"
              : "text-foreground",
        )}
      >
        {value}
      </span>
    </button>
  );
}

/** Compact key for the rail dot states, including the sign-off distinction. */
function Legend({ de }: { de: boolean }) {
  const items: { state: DotState | "current"; label: string }[] = [
    { state: "current", label: de ? "Jetzt" : "Now" },
    { state: "started", label: de ? "In Arbeit" : "In progress" },
    { state: "awaiting", label: de ? "Wartet auf Freigabe" : "Awaiting sign-off" },
    { state: "signed", label: de ? "Freigegeben" : "Signed off" },
  ];
  return (
    <div data-tour="journey-legend" className="hidden items-center gap-3 sm:flex">
      {items.map((it) => (
        <span key={it.state} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <Dot
            state={it.state === "current" ? "todo" : it.state}
            current={it.state === "current"}
            size="sm"
          />
          {it.label}
        </span>
      ))}
    </div>
  );
}

function ColumnHeader({
  col,
  de,
}: {
  col: (typeof COLUMNS)[number];
  de: boolean;
}) {
  return (
    <HoverCard openDelay={120} closeDelay={60}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 truncate rounded text-left uppercase tracking-wide hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {de ? col.de : col.en}
          <Info className="h-3 w-3 shrink-0 opacity-50" />
        </button>
      </HoverCardTrigger>
      <HoverCardContent side="top" className="w-64 text-xs leading-relaxed">
        <p className="font-semibold text-foreground">{de ? col.de : col.en}</p>
        <p className="mt-1 text-muted-foreground">{de ? col.infoDe : col.infoEn}</p>
      </HoverCardContent>
    </HoverCard>
  );
}

function SectionHeader({ section, locale }: { section: Section; locale: Locale }) {
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
  state,
  current,
  isFirst,
  isLast,
}: {
  index: number;
  state: DotState;
  current: boolean;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div className="grid grid-cols-[1.1rem_1.4rem] items-center self-stretch">
      <span className="pr-1 text-right text-[10px] tabular-nums text-muted-foreground">
        {index}
      </span>
      <div className="relative flex justify-center self-stretch">
        <span
          aria-hidden
          className={cn(
            "absolute left-1/2 w-px -translate-x-1/2 bg-border",
            isFirst ? "top-1/2" : "-top-1.5",
            isLast ? "bottom-1/2" : "-bottom-1.5",
          )}
        />
        <span className="relative z-10 flex items-center">
          <Dot state={state} current={current} />
        </span>
      </div>
    </div>
  );
}

function Dot({
  state,
  current,
  size = "md",
}: {
  state: DotState;
  current: boolean;
  size?: "sm" | "md";
}) {
  const box = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const glyph = size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3";
  const inner = size === "sm" ? "h-1 w-1" : "h-1.5 w-1.5";

  const cls =
    state === "signed"
      ? "border-primary bg-primary text-primary-foreground"
      : state === "na"
        ? "border-muted-foreground/30 bg-muted text-muted-foreground"
        : state === "awaiting"
          ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
          : state === "rejected"
            ? "border-destructive bg-destructive/10 text-destructive"
            : current
              ? "border-primary bg-background text-primary"
              : state === "started"
                ? "border-primary/60 bg-background"
                : "border-border bg-background";

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border",
        box,
        cls,
        current && "ring-2 ring-primary/40",
      )}
    >
      {state === "signed" ? (
        <CheckCheck className={glyph} />
      ) : state === "awaiting" ? (
        <Check className={glyph} />
      ) : state === "na" ? (
        <Minus className={glyph} />
      ) : state === "rejected" ? (
        <span className="text-[10px] font-bold leading-none">!</span>
      ) : (
        <span
          className={cn(
            "rounded-full",
            inner,
            current || state === "started" ? "bg-primary" : "bg-muted-foreground/40",
          )}
        />
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
  highlighted = false,
}: {
  node: FlowNode;
  locale: Locale;
  dimmed: boolean;
  showOwner?: boolean;
  /** Transient spotlight when arrived at via a course ?focus= deep link. */
  highlighted?: boolean;
}) {
  const de = locale === "de";
  const owner = ROLE_LABEL[node.ownerRole] ?? { en: node.ownerRole, de: node.ownerRole };
  const ownerLabel = de ? owner.de : owner.en;
  const freq = node.frequency ? FREQUENCY_LABEL[node.frequency] : null;
  const freqLabel = freq ? (de ? freq.de : freq.en) : node.frequency;
  const state = dotStateOf(node.rawStatus);
  // Only the action-needing states get a card corner pip, so the at-a-glance
  // signal survives the horizontal distance to the rail dot without re-cluttering.
  const cornerTone =
    state === "awaiting" ? "bg-amber-500" : state === "rejected" ? "bg-destructive" : null;
  const href = hrefFor(node);
  const so = node.signOff;
  // A partial multi-signer sign-off (e.g. 2 of 3 management members signed).
  const partialSignoff = so.total >= 2 && so.signed < so.total;
  // Recurring-review cycle. dueInDays is set on items with a nextReviewDate.
  const due = node.dueInDays;
  const reviewState: "overdue" | "soon" | "later" | null =
    due === null ? null : due < 0 ? "overdue" : due <= 30 ? "soon" : "later";
  const reviewText =
    due === null
      ? null
      : due < 0
        ? de
          ? `Prüfung ${-due} ${-due === 1 ? "Tag" : "Tage"} überfällig`
          : `Review ${-due} ${-due === 1 ? "day" : "days"} overdue`
        : due === 0
          ? de
            ? "Prüfung heute fällig"
            : "Review due today"
          : de
            ? `Nächste Prüfung in ${due} ${due === 1 ? "Tag" : "Tagen"}`
            : `Next review in ${due} ${due === 1 ? "day" : "days"}`;

  const ring =
    node.status === "current"
      ? "border-primary shadow-sm ring-1 ring-primary/20"
      : node.status === "done"
        ? "border-border/60 bg-muted/30"
        : "border-border";

  const statusColor =
    state === "signed"
      ? "text-primary"
      : state === "awaiting"
        ? "text-amber-600 dark:text-amber-400"
        : state === "rejected"
          ? "text-destructive"
          : "text-muted-foreground";

  return (
    <HoverCard openDelay={140} closeDelay={60}>
      <HoverCardTrigger asChild>
        <Link
          href={href}
          data-testid={`journey-node-${node.code}`}
          className={cn(
            "relative block rounded-md border bg-background p-2 transition-all hover:border-primary/60 hover:bg-accent/40",
            ring,
            dimmed && "opacity-40 hover:opacity-100",
            highlighted &&
              "border-primary bg-primary/5 ring-2 ring-primary ring-offset-2 ring-offset-background",
          )}
        >
          {cornerTone ? (
            <span
              aria-hidden
              className={cn(
                "absolute -right-1 -top-1 h-2 w-2 rounded-full ring-2 ring-background",
                cornerTone,
              )}
            />
          ) : null}
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
              {partialSignoff ? (
                <span className="inline-flex items-center gap-0.5 rounded bg-amber-50 px-1 py-0 text-[10px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                  <Users className="h-2.5 w-2.5" />
                  {so.signed}/{so.total}
                </span>
              ) : null}
              {reviewState === "overdue" ? (
                <span className="inline-flex items-center gap-0.5 rounded bg-destructive/10 px-1 py-0 text-[10px] font-medium text-destructive">
                  <CalendarClock className="h-2.5 w-2.5" />
                  {de ? "überfällig" : "overdue"}
                </span>
              ) : reviewState === "soon" ? (
                <span className="inline-flex items-center gap-0.5 rounded bg-amber-50 px-1 py-0 text-[10px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                  <CalendarClock className="h-2.5 w-2.5" />
                  {due}d
                </span>
              ) : null}
              {node.priority === "P0" ? (
                <Badge variant="secondary" className="px-1 py-0 text-[10px]">
                  P0
                </Badge>
              ) : null}
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
        <p className={cn("mt-1.5 flex items-center gap-1 text-xs font-medium", statusColor)}>
          <Dot state={state} current={node.status === "current"} size="sm" />
          {statusLabel(node.rawStatus, de)}
        </p>
        {(so.total >= 2 || isDoneStatus(node.rawStatus)) &&
        node.rawStatus !== "rejected" &&
        node.rawStatus !== "needs_review" ? (
          <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
            <Users className="h-3 w-3" />
            {de
              ? `${so.signed} von ${so.total} Freigaben abgeschlossen`
              : `${so.signed} of ${so.total} sign-offs completed`}
          </p>
        ) : null}
        {reviewText ? (
          <p
            className={cn(
              "mt-1 flex items-center gap-1 text-[11px]",
              reviewState === "overdue"
                ? "text-destructive"
                : reviewState === "soon"
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground",
            )}
          >
            <CalendarClock className="h-3 w-3" />
            {reviewText}
          </p>
        ) : null}
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
