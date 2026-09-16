"use client";

import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  Check,
  CheckCheck,
  Minus,
  Repeat,
  Scale,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { PathTimeline } from "./PathTimeline";
import {
  type DotState,
  dotStateOf,
  type FlowNode,
  frequencyLabel,
  requirementHref,
  reviewLabel,
  statusLabel,
  statusTone,
} from "./path-nodes";
import { iconFor } from "./solo-icons";
import {
  buildSoloSections,
  buildStageProgress,
  type SoloSection,
  type SoloStep,
  STAGE_COUNT,
} from "./solo-path";

type Locale = "en" | "de" | "nl";

/**
 * The call to action on the live step: whether work has already begun on it.
 * Used by the pinned bar and by the pill over the node, which must agree.
 */
function startLabel(rawStatus: string, de: boolean): string {
  if (rawStatus === "in_progress") return de ? "Weiter" : "Continue";
  return de ? "Anfangen" : "Start";
}

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
export function SoloPath({
  reqNodes,
  locale,
  tourAnchored = true,
}: {
  reqNodes: FlowNode[];
  locale: Locale;
  /** Advertise this path to the guided tour. False while the mode question is
   *  open, so the walkthrough cannot start underneath the dialog. */
  tourAnchored?: boolean;
}) {
  const de = locale === "de";
  const sections = useMemo(() => buildSoloSections(reqNodes, de), [reqNodes, de]);
  const stages = useMemo(() => buildStageProgress(sections), [sections]);

  // Starts on the first section, not on the one holding the live step. At
  // scroll zero no section reaches the observer's band under the header, so
  // whatever this starts as is what gets displayed — and naming a section
  // hundreds of pixels below the one on screen is just wrong. Where the live
  // step sits is already the banner's job.
  const firstKey = sections[0]?.key;
  const [activeKey, setActiveKey] = useState(firstKey);
  useEffect(() => setActiveKey(firstKey), [firstKey]);

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
      // A thin strip just below the pinned bar (which ends around 112px), so
      // the label names what is directly under it. Sections are contiguous, so
      // something almost always crosses the strip; when nothing does, the last
      // answer stands.
      { rootMargin: "-112px 0px -80% 0px" },
    );
    for (const el of sectionEls.current.values()) observer.observe(el);
    return () => observer.disconnect();
  }, [sections]);

  const liveNode = useMemo(
    () => reqNodes.find((n) => n.status === "current") ?? null,
    [reqNodes],
  );
  const active = sections.find((s) => s.key === activeKey) ?? sections[0];
  const total = reqNodes.length;
  if (!active) return null;

  return (
    <div data-tour={tourAnchored ? "journey-path-guided" : undefined}>
      {/* Full content width, while the path itself stays a narrow column: the
          bar is page chrome and needs the room to hold both halves on one
          line. */}
      {/* Fades the path out as it scrolls into the gap between the app header
          and the pinned bar, instead of slicing a caption in half there. The
          negative margin keeps it out of the layout: it exists only while
          stuck. */}
      <div
        aria-hidden="true"
        className="pointer-events-none sticky top-12 z-20 -mb-5 h-5 bg-gradient-to-b from-background to-transparent"
      />
      <StickyPathBar section={active} liveNode={liveNode} de={de} />

      <div className="lg:flex lg:gap-8">
        <PathTimeline stages={stages} activeStage={active.stage.index} locale={locale} />

        <div className="mx-auto w-full max-w-2xl">
          {sections.map((section, i) => (
            <section
              key={section.key}
              data-section={section.key}
              ref={(el) => {
                if (el) sectionEls.current.set(section.key, el);
                else sectionEls.current.delete(section.key);
              }}
            >
              {/* Dividers announce a change of section, so the first one has
                nothing to announce: the bar directly above it already says
                which section this is. */}
              {i > 0 ? <SectionDivider title={section.title} /> : <div className="h-4" />}
              <ol className="flex flex-col items-center gap-3">
                {section.steps.map((step) => (
                  <StepNode key={step.node.id} step={step} total={total} de={de} />
                ))}
              </ol>
              {section.nextStage ? (
                <NextStageCard stage={section.nextStage} de={de} />
              ) : null}
            </section>
          ))}

          <p className="mt-10 pb-4 text-center text-xs text-muted-foreground">
            {de
              ? `Das ist der ganze Weg: ${total} Schritte.`
              : `That is the whole path: ${total} steps.`}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * One pinned row: where you are on the left, what to do next on the right.
 *
 * These were two stacked bars, the next-step banner from PathHero above a
 * stage header, and between them they spent a fifth of the viewport saying
 * two halves of the same sentence. Merged, the only thing permanently on
 * screen is the pair a guided path needs: the section you are reading and the
 * one step that is actually live.
 *
 * It is a pale surface, not a filled primary one. On this page `primary` is
 * already the fill of a signed-off node, so a bar in the same colour made the
 * strongest colour on screen mean two things at once — and being far larger
 * than any node, the bar won every time. Quiet chrome, with the accent spent
 * where it earns its place: the one button, and the progress on the path
 * behind. Same translucent-and-blurred treatment as the app header above it,
 * so the two read as one family rather than as a panel bolted under a header.
 */
function StickyPathBar({
  section,
  liveNode,
  de,
}: {
  section: SoloSection;
  liveNode: FlowNode | null;
  de: boolean;
}) {
  // Stage one holds a single category, so its stage label and section title
  // are the same word. Printing it twice reads as a rendering fault.
  const showSection = section.title !== section.stage.label;

  return (
    <div
      data-tour="journey-stage"
      // top-[68px], not top-12: the app header ends at 48px, and parking the
      // bar flush against it reads as one two-tone header rather than as a
      // pinned control. The 20px gap lets the path scroll visibly behind it.
      className="sticky top-[68px] z-20 mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border bg-background/80 px-3 py-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:px-4"
    >
      {/* Hidden where the rail is shown: it names the stage already, and two
          copies of the same position is one too many. */}
      <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-primary lg:hidden">
        {de ? "Stufe" : "Stage"} {section.stage.index}/{STAGE_COUNT}
      </span>
      <h2 className="min-w-0 truncate text-sm font-semibold">
        {showSection ? section.title : section.stage.label}
      </h2>
      <Link
        href={categoryHref(section.categorySlug)}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <BookOpen className="h-3.5 w-3.5" />
        {de ? "Hinweise" : "Guide"}
      </Link>

      {liveNode ? (
        <div className="ml-auto flex min-w-0 items-center gap-2.5">
          <span className="hidden shrink-0 text-[11px] font-medium uppercase tracking-wide text-muted-foreground lg:inline">
            {de ? "Als Nächstes" : "Next up"}
          </span>
          <span className="shrink-0 font-mono text-xs text-muted-foreground">
            {liveNode.code}
          </span>
          <span className="hidden min-w-0 truncate text-sm md:inline">
            {liveNode.label}
          </span>
          <Link
            href={requirementHref(liveNode)}
            className="inline-flex shrink-0 items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            {startLabel(liveNode.rawStatus, de)}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
          <CheckCheck className="h-3.5 w-3.5 text-primary" />
          {de ? "Alles erledigt" : "All done"}
        </span>
      )}
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
  const Icon = iconFor(node);

  return (
    <li
      data-tour={current ? "journey-live-step" : undefined}
      className="flex flex-col items-center"
      style={{ transform: `translateX(${step.offsetPx}px)` }}
    >
      {current ? <StartPill rawStatus={node.rawStatus} de={de} /> : null}
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
              <span className={statusTone(state)}>{statusLabel(node.rawStatus, de)}</span>
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
                {reviewLabel(node.dueInDays, de)}
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
function StartPill({ rawStatus, de }: { rawStatus: string; de: boolean }) {
  return (
    <div className="relative mb-2">
      <div className="rounded-lg border-2 border-primary bg-background px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary shadow-sm">
        {startLabel(rawStatus, de)}
      </div>
      <div className="absolute left-1/2 top-full h-2.5 w-2.5 -translate-x-1/2 -translate-y-[60%] rotate-45 border-b-2 border-r-2 border-primary bg-background" />
    </div>
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
