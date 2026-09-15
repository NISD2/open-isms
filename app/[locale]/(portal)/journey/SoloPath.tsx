"use client";

import {
  BookOpen,
  CalendarClock,
  Check,
  CheckCheck,
  ClipboardCheck,
  Fingerprint,
  Gauge,
  GraduationCap,
  KeyRound,
  Landmark,
  LifeBuoy,
  Lock,
  type LucideIcon,
  Minus,
  Repeat,
  Scale,
  ShieldAlert,
  Siren,
  Truck,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  type DotState,
  dotStateOf,
  type FlowNode,
  FREQUENCY_LABEL,
  requirementHref,
  statusLabel,
} from "./path-nodes";
import {
  buildSoloSections,
  type SoloSection,
  type SoloStep,
  STAGE_COUNT,
} from "./solo-path";

type Locale = "en" | "de" | "nl";

/**
 * One landmark per category, so a long path stays navigable by recognition:
 * you learn where the training node and the supplier node sit and stop
 * re-reading captions to find them.
 */
const CATEGORY_ICON: Record<string, LucideIcon> = {
  GOV: Landmark,
  RSK: ShieldAlert,
  INC: Siren,
  BCP: LifeBuoy,
  SUP: Truck,
  PRO: Wrench,
  EFF: Gauge,
  TRN: GraduationCap,
  CRY: Lock,
  ACC: KeyRound,
  AUT: Fingerprint,
  REG: ClipboardCheck,
};

function categoryHref(categorySlug: string) {
  return {
    pathname: "/compliance/[categorySlug]" as const,
    params: { categorySlug },
  };
}

/**
 * The guided layout: one winding line of steps, exactly one of them live.
 *
 * Deliberately missing next to the team view: role columns, the ordering
 * toggle, status filter chips and the state legend. All of it describes how
 * work is divided, which is the one thing a single implementer never needs.
 */
export function SoloPath({ reqNodes, locale }: { reqNodes: FlowNode[]; locale: Locale }) {
  const de = locale === "de";
  const sections = useMemo(() => buildSoloSections(reqNodes, de), [reqNodes, de]);

  const currentKey = useMemo(
    () =>
      sections.find((s) => s.steps.some((st) => st.node.status === "current"))?.key ??
      sections[0]?.key,
    [sections],
  );
  const [activeKey, setActiveKey] = useState(currentKey);
  useEffect(() => setActiveKey(currentKey), [currentKey]);

  // The sticky header names the section you are actually looking at, which is
  // the only thing that keeps a 49-step scroll oriented.
  const sectionEls = useRef(new Map<string, HTMLElement>());
  useEffect(() => {
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const key = (entry.target as HTMLElement).dataset.section;
          if (!key) continue;
          if (entry.isIntersecting) visible.add(key);
          else visible.delete(key);
        }
        // Last in document order, not first: while a stage card is on screen
        // the section that contains it is still intersecting, and naming the
        // one you just left is exactly the lag the header exists to prevent.
        const current = [...sections].reverse().find((s) => visible.has(s.key));
        if (current) setActiveKey(current.key);
      },
      // A thin strip just below the app header, so the label names what is
      // directly under it. Sections are contiguous, so something almost always
      // crosses the strip; when nothing does, the last answer stands.
      { rootMargin: "-80px 0px -82% 0px" },
    );
    for (const el of sectionEls.current.values()) observer.observe(el);
    return () => observer.disconnect();
  }, [sections]);

  const active = sections.find((s) => s.key === activeKey) ?? sections[0];
  const total = reqNodes.length;
  if (!active) return null;

  return (
    <div className="mx-auto w-full max-w-2xl">
      <StickySectionHeader section={active} de={de} />

      {sections.map((section) => (
        <section
          key={section.key}
          data-section={section.key}
          ref={(el) => {
            if (el) sectionEls.current.set(section.key, el);
            else sectionEls.current.delete(section.key);
          }}
        >
          <SectionDivider title={section.title} />
          <ol className="flex flex-col items-center gap-3">
            {section.steps.map((step) => (
              <StepNode key={step.node.id} step={step} total={total} de={de} />
            ))}
          </ol>
          {section.nextStage ? <NextStageCard stage={section.nextStage} de={de} /> : null}
        </section>
      ))}

      <p className="mt-10 pb-4 text-center text-xs text-muted-foreground">
        {de
          ? `Das ist der ganze Weg: ${total} Schritte.`
          : `That is the whole path: ${total} steps.`}
      </p>
    </div>
  );
}

function StickySectionHeader({ section, de }: { section: SoloSection; de: boolean }) {
  return (
    <div className="sticky top-12 z-10 mb-2 flex items-center justify-between gap-3 rounded-lg bg-primary px-4 py-2.5 text-primary-foreground shadow-sm">
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-primary-foreground/70">
          {de ? "Stufe" : "Stage"} {section.stage.index} {de ? "von" : "of"} {STAGE_COUNT}{" "}
          · {section.stage.label}
        </p>
        <h2 className="truncate text-sm font-semibold">{section.title}</h2>
      </div>
      <Link
        href={categoryHref(section.categorySlug)}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-primary-foreground/30 px-2.5 py-1 text-xs font-medium transition-colors hover:bg-primary-foreground/10"
      >
        <BookOpen className="h-3.5 w-3.5" />
        {de ? "Hinweise" : "Guide"}
      </Link>
    </div>
  );
}

function SectionDivider({ title }: { title: string }) {
  return (
    <div className="my-6 flex items-center gap-3">
      <hr className="flex-1 border-border" />
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </span>
      <hr className="flex-1 border-border" />
    </div>
  );
}

function StepNode({ step, total, de }: { step: SoloStep; total: number; de: boolean }) {
  const { node } = step;
  const state = dotStateOf(node.rawStatus);
  const current = node.status === "current";
  const Icon = CATEGORY_ICON[node.categoryCode] ?? Scale;

  return (
    <li
      className="flex flex-col items-center"
      style={{ transform: `translateX(${step.offsetPx}px)` }}
    >
      {current ? <StartPill started={node.rawStatus === "in_progress"} de={de} /> : null}
      <HoverCard openDelay={120} closeDelay={60}>
        <HoverCardTrigger asChild>
          <Link
            href={requirementHref(node)}
            aria-label={`${de ? "Schritt" : "Step"} ${step.step}: ${node.label}`}
            className={cn(
              "relative flex items-center justify-center rounded-full border-2 transition-transform hover:-translate-y-0.5",
              current ? "h-[72px] w-[72px]" : "h-16 w-16",
              circleClass(state, current),
            )}
          >
            {state === "na" ? (
              <Minus className="h-6 w-6" />
            ) : (
              <Icon className={current ? "h-7 w-7" : "h-6 w-6"} />
            )}
            <StateBadge state={state} />
            {step.isMinimum ? <MinimumBadge de={de} /> : null}
          </Link>
        </HoverCardTrigger>
        <HoverCardContent align="center" className="w-80 space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-xs text-muted-foreground">{node.code}</span>
            <span className="text-sm font-medium leading-tight">{node.label}</span>
          </div>
          {node.description ? (
            <p className="text-xs leading-relaxed text-muted-foreground">
              {node.description}
            </p>
          ) : null}
          <div className="space-y-1 border-t pt-2 text-xs text-muted-foreground">
            <p>
              {de ? "Schritt" : "Step"} {step.step} {de ? "von" : "of"} {total} ·{" "}
              <span className={statusColor(state)}>
                {statusLabel(node.rawStatus, de)}
              </span>
            </p>
            {node.legalRef ? (
              <p className="flex items-center gap-1.5">
                <Scale className="h-3 w-3 shrink-0" />
                {node.legalRef}
              </p>
            ) : null}
            {node.frequency ? (
              <p className="flex items-center gap-1.5">
                <Repeat className="h-3 w-3 shrink-0" />
                {frequencyLabel(node.frequency, de)}
              </p>
            ) : null}
            {node.dueInDays !== null ? (
              <p className="flex items-center gap-1.5">
                <CalendarClock className="h-3 w-3 shrink-0" />
                {reviewText(node.dueInDays, de)}
              </p>
            ) : null}
          </div>
        </HoverCardContent>
      </HoverCard>
      {/* Fixed height so the wave keeps an even rhythm whether a title wraps
          to one line or two. */}
      <span
        className={cn(
          "mt-2 line-clamp-2 h-8 w-[172px] text-center text-[11px] leading-snug",
          current ? "font-medium text-foreground" : "text-muted-foreground",
        )}
      >
        {node.label}
      </span>
      {current ? (
        <span className="mt-0.5 text-[10px] text-muted-foreground">
          {de ? "Schritt" : "Step"} {step.step} {de ? "von" : "of"} {total}
        </span>
      ) : null}
    </li>
  );
}

/** Speech-bubble call-out over the one live step. */
function StartPill({ started, de }: { started: boolean; de: boolean }) {
  const label = started ? (de ? "Weiter" : "Continue") : de ? "Anfangen" : "Start";
  return (
    <div className="relative mb-2">
      <div className="rounded-lg border-2 border-primary bg-background px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary shadow-sm">
        {label}
      </div>
      <div className="absolute left-1/2 top-full h-2.5 w-2.5 -translate-x-1/2 -translate-y-[60%] rotate-45 border-b-2 border-r-2 border-primary bg-background" />
    </div>
  );
}

/**
 * The eight P0 steps. Marked, not reordered: the path stays chronological.
 *
 * The word is "zuerst", never "Pflicht". All 49 requirements are mandatory —
 * the bands rank what to do early, and a badge reading "mandatory" would say
 * the other 41 are not, contradicting the disclaimer at the foot of the page.
 */
function MinimumBadge({ de }: { de: boolean }) {
  return (
    <span
      title={de ? "Belastbares Minimum" : "Defensible minimum"}
      className="absolute -left-1 -top-1 rounded bg-background px-1 text-[9px] font-semibold uppercase leading-4 tracking-wide text-primary ring-1 ring-primary/40"
    >
      {de ? "Zuerst" : "First"}
    </span>
  );
}

/** Corner pip carrying the sign-off state: two checks = signed off. */
function StateBadge({ state }: { state: DotState }) {
  if (state !== "signed" && state !== "awaiting" && state !== "rejected") {
    return null;
  }
  return (
    <span
      className={cn(
        "absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background",
        state === "signed"
          ? "bg-primary text-primary-foreground"
          : state === "awaiting"
            ? "bg-amber-500 text-white"
            : "bg-destructive text-destructive-foreground",
      )}
    >
      {state === "signed" ? (
        <CheckCheck className="h-3 w-3" />
      ) : state === "awaiting" ? (
        <Check className="h-3 w-3" />
      ) : (
        <span className="text-[10px] font-bold leading-none">!</span>
      )}
    </span>
  );
}

function NextStageCard({
  stage,
  de,
}: {
  stage: { index: number; label: string; hint: string; steps: number };
  de: boolean;
}) {
  return (
    <div className="my-8 rounded-xl border bg-muted/30 px-4 py-4 text-center">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {de ? "Anschließend" : "Next"}
      </p>
      <h3 className="mt-1 text-base font-semibold">
        {de ? "Stufe" : "Stage"} {stage.index} · {stage.label}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{stage.hint}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        {stage.steps} {de ? "Schritte" : "steps"}
      </p>
    </div>
  );
}

function circleClass(state: DotState, current: boolean): string {
  if (state === "signed") {
    return "border-primary bg-primary text-primary-foreground shadow-sm";
  }
  if (state === "na") {
    return "border-muted-foreground/25 bg-muted text-muted-foreground";
  }
  if (state === "awaiting") {
    return "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400";
  }
  if (state === "rejected") {
    return "border-destructive bg-destructive/10 text-destructive";
  }
  if (current) {
    return "border-primary bg-background text-primary shadow-sm ring-4 ring-primary/20";
  }
  if (state === "started") return "border-primary/60 bg-background text-primary";
  return "border-border bg-muted/40 text-muted-foreground/70";
}

function statusColor(state: DotState): string {
  if (state === "signed") return "text-primary";
  if (state === "awaiting") return "text-amber-600 dark:text-amber-400";
  if (state === "rejected") return "text-destructive";
  return "";
}

function frequencyLabel(frequency: string, de: boolean): string {
  const label = FREQUENCY_LABEL[frequency];
  if (!label) return frequency;
  return de ? label.de : label.en;
}

function reviewText(dueInDays: number, de: boolean): string {
  if (dueInDays < 0) {
    const days = -dueInDays;
    return de
      ? `Prüfung ${days} ${days === 1 ? "Tag" : "Tage"} überfällig`
      : `Review ${days} ${days === 1 ? "day" : "days"} overdue`;
  }
  if (dueInDays === 0) return de ? "Prüfung heute fällig" : "Review due today";
  return de
    ? `Nächste Prüfung in ${dueInDays} ${dueInDays === 1 ? "Tag" : "Tagen"}`
    : `Next review in ${dueInDays} ${dueInDays === 1 ? "day" : "days"}`;
}
