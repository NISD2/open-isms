"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clock,
  HelpCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  ListOrdered,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { FlowNode, Band, Aggregate } from "../(portal)/journey/path-nodes";

type View = "critical" | "chrono";

/** Link target for a single requirement — its own detail page, not the group. */
function reqHref(n: FlowNode): string {
  return `/compliance/${n.categorySlug}/${n.code}`;
}

/* Chronological (natural process) order by category, matching the platform's
   phase sequence: REG -> GOV RSK SUP -> CRY ACC AUT -> PRO INC BCP -> TRN EFF.
   Keyed by the numeric code prefix. */
const CHRONO_RANK: Record<string, number> = {
  "12": 0, "1": 1, "2": 2, "8": 3, "4": 4, "5": 5, "11": 6, "7": 7, "3": 8, "6": 9, "10": 10, "9": 11,
};
function chronoKey(n: FlowNode): number {
  const [cat, sub] = n.code.split(".");
  return (CHRONO_RANK[cat] ?? 99) * 100 + Number(sub ?? 0);
}

/* ------------------------------------------------------------------ */
/* Coverage — the requirement's real status as a position on a scale.  */
/* `prepared` is the real `needs_review` state (auto-drafted, waiting   */
/* for the user's sign-off); text comes from the `journeyBoard` i18n.   */
/* ------------------------------------------------------------------ */
type Coverage = "done" | "current" | "prepared" | "open" | "overdue";

function coverageOf(n: FlowNode): Coverage {
  if (n.status === "current") return "current";
  if (n.isOverdue) return "overdue";
  if (n.status === "done") return "done";
  if (n.rawStatus === "needs_review") return "prepared";
  return "open";
}

const COVERAGE_STYLE: Record<
  Coverage,
  { dot: string; chip: string; Icon: typeof Check }
> = {
  done: {
    dot: "bg-emerald-500 text-white",
    chip: "text-emerald-700 bg-emerald-50 ring-emerald-600/20 dark:text-emerald-300 dark:bg-emerald-500/10",
    Icon: Check,
  },
  current: {
    dot: "bg-primary text-primary-foreground ring-4 ring-primary/15",
    chip: "text-primary bg-primary/10 ring-primary/25",
    Icon: ArrowRight,
  },
  prepared: {
    dot: "bg-violet-500 text-white",
    chip: "text-violet-700 bg-violet-50 ring-violet-600/20 dark:text-violet-300 dark:bg-violet-500/10",
    Icon: Sparkles,
  },
  open: {
    dot: "bg-muted-foreground/20 text-muted-foreground",
    chip: "text-muted-foreground bg-muted ring-border",
    Icon: ChevronDown,
  },
  overdue: {
    dot: "bg-amber-500 text-white",
    chip: "text-amber-700 bg-amber-50 ring-amber-600/20 dark:text-amber-300 dark:bg-amber-500/10",
    Icon: AlertTriangle,
  },
};

/* Owner — team as a calm, brand-cohesive chip (no alarm red/green). The short
   code (GF/SEC/IT/OPS) is a fixed abbreviation; name + responsibility are i18n. */
const OWNER_STYLE: Record<FlowNode["column"], { short: string; color: string }> = {
  leadership: {
    short: "GF",
    color: "bg-indigo-50 text-indigo-700 ring-indigo-600/15 dark:bg-indigo-500/10 dark:text-indigo-300",
  },
  security: {
    short: "SEC",
    color: "bg-slate-100 text-slate-600 ring-slate-500/15 dark:bg-slate-500/10 dark:text-slate-300",
  },
  it: {
    short: "IT",
    color: "bg-sky-50 text-sky-700 ring-sky-600/15 dark:bg-sky-500/10 dark:text-sky-300",
  },
  operations: {
    short: "OPS",
    color: "bg-teal-50 text-teal-700 ring-teal-600/15 dark:bg-teal-500/10 dark:text-teal-300",
  },
};

const BANDS: Band[] = ["minimum", "year", "later"];

/* ------------------------------------------------------------------ */
function ReadinessRing({ pct }: { pct: number }) {
  const t = useTranslations("portal");
  const r = 46;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct / 100);
  return (
    <div className="relative grid size-28 shrink-0 place-items-center">
      <svg viewBox="0 0 110 110" className="size-28 -rotate-90">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="#6b8ba4" />
          </linearGradient>
        </defs>
        <circle cx="55" cy="55" r={r} className="fill-none stroke-muted/70" strokeWidth="8" />
        <circle
          cx="55"
          cy="55"
          r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-2xl font-bold tracking-tight tabular-nums">{pct}%</div>
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {t("journeyBoard.hero.unit")}
        </div>
      </div>
    </div>
  );
}

function Hint({ text, className }: { text: string; className?: string }) {
  const t = useTranslations("portal");
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-grid place-items-center text-muted-foreground/40 transition-colors hover:text-muted-foreground",
            className,
          )}
          role="img"
          aria-label={t("journeyBoard.row.explain")}
        >
          <HelpCircle className="size-3.5" />
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">{text}</TooltipContent>
    </Tooltip>
  );
}

function CoverageDot({ cov }: { cov: Coverage }) {
  const t = useTranslations("portal");
  const c = COVERAGE_STYLE[cov];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn("grid size-6 shrink-0 place-items-center rounded-full", c.dot)}>
          <c.Icon className="size-3.5" />
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <span className="font-medium">{t(`journeyBoard.coverage.${cov}Label`)}.</span>{" "}
        {t(`journeyBoard.coverage.${cov}Tip`)}
      </TooltipContent>
    </Tooltip>
  );
}

function OwnerChip({ column }: { column: FlowNode["column"] }) {
  const t = useTranslations("portal");
  const o = OWNER_STYLE[column];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "hidden shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset sm:inline-block",
            o.color,
          )}
        >
          {o.short}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <span className="font-medium">{t(`journeyBoard.owner.${column}Name`)}.</span>{" "}
        {t(`journeyBoard.owner.${column}Resp`)}
      </TooltipContent>
    </Tooltip>
  );
}

/* A single control row. The title is a link to the requirement's own page;
   the trailing action links there too. Tooltip chips stay as spans so the
   row never nests interactive elements inside an anchor. */
function ControlRow({ node }: { node: FlowNode }) {
  const t = useTranslations("portal");
  const cov = coverageOf(node);
  const c = COVERAGE_STYLE[cov];
  const isCurrent = cov === "current";
  const href = reqHref(node);
  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
        isCurrent ? "bg-primary/[0.04] ring-1 ring-primary/20" : "hover:bg-muted/50",
      )}
    >
      <CoverageDot cov={cov} />
      <span className="w-9 shrink-0 font-mono text-[11px] text-muted-foreground tabular-nums">
        {node.code}
      </span>
      <Link
        href={href as never}
        prefetch={false}
        className={cn(
          "min-w-0 flex-1 truncate text-sm hover:underline",
          cov === "done" ? "text-muted-foreground" : "font-medium",
        )}
      >
        {node.label}
      </Link>

      {node.frequency ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="hidden text-muted-foreground md:inline-flex">
              <RefreshCw className="size-3" />
            </span>
          </TooltipTrigger>
          <TooltipContent>{t("journeyBoard.row.recurring")}</TooltipContent>
        </Tooltip>
      ) : null}
      {node.legalRef ? (
        <span className="hidden font-mono text-[10px] text-muted-foreground/70 lg:inline">
          {node.legalRef}
        </span>
      ) : null}

      <OwnerChip column={node.column} />

      <span
        className={cn(
          "hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset sm:inline-block",
          c.chip,
        )}
      >
        {t(`journeyBoard.coverage.${cov}Label`)}
      </span>

      {isCurrent ? (
        <Button asChild size="sm" className="h-7 gap-1 px-2.5 text-xs">
          <Link href={href as never} prefetch={false}>
            {t("journeyBoard.next.eta")} <ArrowRight className="size-3" />
          </Link>
        </Button>
      ) : (
        <Link
          href={href as never}
          prefetch={false}
          className="shrink-0 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/60"
          aria-label={t("journeyBoard.row.open")}
        >
          <ArrowRight className="size-3.5" />
        </Link>
      )}
    </div>
  );
}

/* A collapsible phase group — header carries its own progress. */
function PhaseSection({
  band,
  nodes,
  defaultOpen,
}: {
  band: Band;
  nodes: FlowNode[];
  defaultOpen: boolean;
}) {
  const t = useTranslations("portal");
  const [open, setOpen] = useState(defaultOpen);
  const total = nodes.length;
  const done = nodes.filter((n) => n.status === "done").length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
      <div className="group/hdr flex w-full items-center gap-2 pr-4 transition-colors hover:bg-muted/40">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left"
        >
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              open ? "" : "-rotate-90",
            )}
          />
          <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">
            {t(`journeyBoard.band.${band}Phase`)}
          </span>
          <span className="text-muted-foreground/40">·</span>
          <span className="truncate text-sm font-semibold">
            {t(`journeyBoard.band.${band}Name`)}
          </span>
        </button>
        <Hint
          text={t(`journeyBoard.band.${band}Hint`)}
          className="opacity-0 transition-opacity group-hover/hdr:opacity-100"
        />
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {done}/{total}
        </span>
        <div className="hidden h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-muted sm:block">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
      {open ? (
        <div className="space-y-0.5 border-t p-2">
          {nodes.map((n) => (
            <ControlRow key={n.id} node={n} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ViewToggle({ view, setView }: { view: View; setView: (v: View) => void }) {
  const t = useTranslations("portal");
  const opts: { key: View; label: string; Icon: typeof Flame; tip: string }[] = [
    { key: "critical", label: t("journeyBoard.view.critical"), Icon: Flame, tip: t("journeyBoard.view.criticalTip") },
    { key: "chrono", label: t("journeyBoard.view.chrono"), Icon: ListOrdered, tip: t("journeyBoard.view.chronoTip") },
  ];
  return (
    <div className="inline-flex rounded-lg border bg-muted/50 p-0.5">
      {opts.map((o) => {
        const on = o.key === view;
        return (
          <Tooltip key={o.key}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setView(o.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  on ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <o.Icon className="size-3.5" /> {o.label}
              </button>
            </TooltipTrigger>
            <TooltipContent>{o.tip}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

/* ================================================================== */
export function JourneyBoard({
  reqNodes,
  aggregate,
}: {
  reqNodes: FlowNode[];
  aggregate: Aggregate;
}) {
  const t = useTranslations("portal");
  const [view, setView] = useState<View>("critical");
  const pct = aggregate.total ? Math.round((aggregate.done / aggregate.total) * 100) : 0;
  // Mirror the real journey: nodes come in global order (category sortOrder,
  // so REG/registration is first), and each band preserves that order.
  const ordered = [...reqNodes].sort((a, b) => chronoKey(a) - chronoKey(b));
  const current = ordered.find((n) => n.status === "current");
  const prepared = aggregate.awaitingSignoff;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="w-full space-y-6 p-6 lg:px-10 lg:py-8">
        {/* Hero: readiness + reassurance (scope as achievement, not backlog) */}
        <div className="flex flex-col gap-6 rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-muted/40 p-6 shadow-sm sm:flex-row sm:items-center sm:p-8">
          <ReadinessRing pct={pct} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              <h1 className="text-lg font-semibold tracking-tight">
                {t("journeyBoard.hero.title")}
              </h1>
            </div>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {t("journeyBoard.hero.subtitle", { done: aggregate.done, total: aggregate.total })}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 ring-1 ring-inset ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-300">
                <Sparkles className="size-3.5" />
                {t("journeyBoard.hero.chipPrepared", { count: prepared })}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                <Check className="size-3.5" />
                {t("journeyBoard.hero.chipDone", { count: aggregate.done })}
              </span>
              {aggregate.overdue > 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300">
                  <AlertTriangle className="size-3.5" />
                  {t("journeyBoard.hero.chipOverdue", { count: aggregate.overdue })}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* The single glowing next step */}
        {current ? (
          <Link
            href={reqHref(current) as never}
            prefetch={false}
            className="flex items-center gap-4 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/[0.07] to-primary/[0.015] p-4 shadow-sm ring-1 ring-primary/5 transition-colors hover:from-primary/[0.1] sm:p-5"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground ring-4 ring-primary/10">
              <ArrowRight className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-primary">
                {t("journeyBoard.next.kicker")}
                <span className="font-mono text-muted-foreground">{current.code}</span>
              </div>
              <p className="truncate text-sm font-semibold">{current.label}</p>
            </div>
            <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
              <Clock className="size-3.5" /> {t("journeyBoard.next.eta")}
            </span>
            <span className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
              {t("journeyBoard.next.cta")} <ArrowRight className="size-4" />
            </span>
          </Link>
        ) : null}

        {/* Section header + view toggle */}
        <div className="flex items-center gap-2 px-1">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {t("journeyBoard.path.title")}
          </h2>
          <Hint text={t("journeyBoard.path.hint")} />
          <div className="ml-auto">
            <ViewToggle view={view} setView={setView} />
          </div>
        </div>

        {view === "critical" ? (
          <div className="space-y-3">
            {BANDS.map((b, i) => {
              const nodes = ordered.filter((n) => n.band === b);
              if (!nodes.length) return null;
              return <PhaseSection key={b} band={b} nodes={nodes} defaultOpen={i === 0} />;
            })}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
            <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              <ListOrdered className="size-3.5" /> {t("journeyBoard.path.chronoHeader")}
            </div>
            <div className="space-y-0.5 p-2">
              {ordered.map((n) => (
                <ControlRow key={n.id} node={n} />
              ))}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
