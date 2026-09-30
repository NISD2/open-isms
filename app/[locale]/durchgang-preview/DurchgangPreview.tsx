"use client";

import "./transitions.css";
import { ArrowRight, Check, Clock } from "lucide-react";
import { type CSSProperties, useState } from "react";
import { flushSync } from "react-dom";
import { Button } from "@/components/ui/button";
import { defaultSelectionFor } from "@/lib/asset-inventory/catalog";
import { type ItemState, resumeAt } from "@/lib/compliance/guided-form/policy";
import { cn } from "@/lib/utils";
import { type Draft, KIND, StepScreen, WAIT_REASONS, type Waiting } from "./StepScreen";
import type { PreviewItem } from "./script";

type View =
  | { readonly kind: "intro" }
  | { readonly kind: "home" }
  | { readonly kind: "step"; readonly item: number; readonly screen: number };

type Direction = "forward" | "back";

const INTRO_POINTS = [
  {
    title: "Eins nach dem anderen",
    text: "Sie sehen immer nur einen Punkt. Wir erklären ihn, bevor Sie etwas eintragen.",
  },
  {
    title: "Die Vorgaben des BSI",
    text: "Wo das BSI eine Methode empfiehlt, übernehmen Sie diese. Sie müssen nichts selbst erfinden.",
  },
  {
    title: "Offen lassen ist erlaubt",
    text: "Was noch nicht geht, legen Sie zur Seite und machen mit dem nächsten Punkt weiter.",
  },
  {
    title: "Am Ende eine Unterschrift",
    text: "Die Geschäftsführung sieht alles durch und unterschreibt.",
  },
] as const;

const STAGE: CSSProperties = { viewTransitionName: "dg-stage" };

const emptyDraft = (): Draft => ({
  values: {},
  file: null,
  looked: [],
  checked: defaultSelectionFor(["health"]),
  custom: [],
});

/**
 * Run a state change as a screen transition where the browser supports it. The direction decides
 * which way the stage slides (see transitions.css); without support, or with reduced motion, the
 * change simply happens.
 */
const transition = (direction: Direction, update: () => void) => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || !("startViewTransition" in document)) {
    update();
    window.scrollTo({ top: 0 });
    return;
  }
  const root = document.documentElement;
  root.dataset.dgDir = direction;
  const run = document.startViewTransition(() => {
    flushSync(update);
    window.scrollTo({ top: 0 });
  });
  run.finished.finally(() => {
    delete root.dataset.dgDir;
  });
};

export function DurchgangPreview({ items }: { items: readonly PreviewItem[] }) {
  const [view, setView] = useState<View>({ kind: "intro" });
  const [done, setDone] = useState<ReadonlySet<string>>(new Set());
  const [waiting, setWaiting] = useState<ReadonlyMap<string, Waiting>>(new Map());
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  const stateOf =
    (doneSet: ReadonlySet<string>, waitingMap: ReadonlyMap<string, Waiting>) =>
    (item: PreviewItem): ItemState =>
      doneSet.has(item.code) ? "settled" : waitingMap.has(item.code) ? "blocked" : "open";

  const next = resumeAt(items, stateOf(done, waiting));
  const go = (direction: Direction, target: View) =>
    transition(direction, () => setView(target));
  const goHome = () => go("back", { kind: "home" });
  const openItem = (item: PreviewItem) =>
    go("forward", { kind: "step", item: items.indexOf(item), screen: 0 });

  const reset = () =>
    transition("back", () => {
      setDone(new Set());
      setWaiting(new Map());
      setDraft(emptyDraft());
      setView({ kind: "intro" });
    });

  const body = (() => {
    if (view.kind === "intro")
      return <Intro items={items} onStart={() => go("forward", { kind: "home" })} />;
    if (view.kind === "home") {
      return (
        <Home
          items={items}
          next={next}
          done={done}
          waiting={waiting}
          onContinue={openItem}
          onReset={reset}
        />
      );
    }

    const item = items[view.item];
    if (!item) return null;
    const lastScreen = item.screens.length - 1;
    const withoutThis = new Map(waiting);
    withoutThis.delete(item.code);
    const doneWithThis = new Set(done).add(item.code);
    const after = resumeAt(items, stateOf(doneWithThis, withoutThis));

    return (
      <StepScreen
        item={item}
        screenIndex={view.screen}
        next={after}
        draft={draft}
        onDraft={setDraft}
        onExit={goHome}
        onBack={() =>
          view.screen === 0 ? goHome() : go("back", { ...view, screen: view.screen - 1 })
        }
        onForward={() => {
          if (view.screen < lastScreen) {
            go("forward", { ...view, screen: view.screen + 1 });
            return;
          }
          transition("forward", () => {
            setDone(doneWithThis);
            setWaiting(withoutThis);
            setView(
              after
                ? { kind: "step", item: items.indexOf(after), screen: 0 }
                : { kind: "home" },
            );
          });
        }}
        onWait={(entry) =>
          transition("back", () => {
            setWaiting(new Map(waiting).set(item.code, entry));
            setView({ kind: "home" });
          })
        }
      />
    );
  })();

  return (
    <div className="min-h-screen bg-background">
      <PreviewBar items={items} view={view} onJump={setView} />
      {body}
    </div>
  );
}

function PreviewBar({
  items,
  view,
  onJump,
}: {
  items: readonly PreviewItem[];
  view: View;
  onJump: (view: View) => void;
}) {
  const options: ReadonlyArray<{ key: string; label: string; view: View }> = [
    { key: "intro", label: "Erster Bildschirm", view: { kind: "intro" } },
    { key: "home", label: "Übersicht: weitermachen", view: { kind: "home" } },
    ...items.flatMap((item, i) =>
      item.screens.map((screen, j) => ({
        key: `${i}-${j}`,
        label: `${item.code} ${item.headline}: ${KIND[screen.kind].label}`,
        view: { kind: "step", item: i, screen: j } as const,
      })),
    ),
  ];
  const current = view.kind === "step" ? `${view.item}-${view.screen}` : view.kind;

  return (
    <div className="bg-foreground text-background">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-1.5 text-xs sm:px-6 lg:px-10">
        <span className="font-semibold">Designvorschau</span>
        <span className="opacity-70">
          Statische Daten, nichts wird gespeichert. Texte nicht geprüft.
        </span>
        <label className="ml-auto flex items-center gap-2">
          <span className="sr-only">Bildschirm wählen</span>
          <select
            value={current}
            onChange={(e) => {
              const option = options.find((o) => o.key === e.target.value);
              if (option) onJump(option.view);
            }}
            className="max-w-[16rem] rounded-md bg-background/10 px-2 py-1 text-xs text-background"
          >
            {options.map((o) => (
              <option key={o.key} value={o.key} className="text-foreground">
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

/** The step art carries its own white ground; multiply lets the tinted panel show through it. */
function Art({ src, className }: { src: string | null; className: string }) {
  if (!src) return null;
  // biome-ignore lint/performance/noImgElement: animated SVG, next/image would rasterise it
  return (
    <img
      src={src}
      alt=""
      className={cn("w-auto mix-blend-multiply dark:mix-blend-normal", className)}
    />
  );
}

function Intro({
  items,
  onStart,
}: {
  items: readonly PreviewItem[];
  onStart: () => void;
}) {
  return (
    <main
      style={STAGE}
      className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
    >
      <div className="flex flex-col justify-center px-6 py-14 sm:px-10 lg:py-20 lg:pr-16">
        <p className="text-sm font-medium text-primary">
          NIS 2 für Unternehmen mit 50 bis 150 Beschäftigten
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Sie sind hier richtig.
        </h1>
        <p className="mt-5 max-w-[52ch] text-lg leading-8 text-muted-foreground">
          Sie sollen sich um NIS 2 kümmern und wissen nicht, wo Sie anfangen? Das geht
          fast allen so. Wir gehen es mit Ihnen durch, Punkt für Punkt.
        </p>
        <ol className="mt-10 grid gap-x-8 gap-y-6 sm:grid-cols-2">
          {INTRO_POINTS.map((point, i) => (
            <li key={point.title}>
              <span className="text-sm font-semibold text-primary tabular-nums">
                0{i + 1}
              </span>
              <p className="mt-1 font-semibold">{point.title}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{point.text}</p>
            </li>
          ))}
        </ol>
        <Button
          size="lg"
          className="mt-12 h-12 self-start rounded-xl px-7 text-base"
          onClick={onStart}
        >
          Los geht&apos;s
          <ArrowRight />
        </Button>
      </div>
      <div className="relative hidden overflow-hidden bg-primary/[0.06] lg:block">
        <div className="absolute inset-0 flex flex-col justify-center gap-5 px-16">
          <p className="text-sm font-medium text-muted-foreground">
            Die ersten Punkte auf Ihrem Weg
          </p>
          {items.map((item, i) => (
            <div
              key={item.code}
              className="flex items-center gap-5 rounded-2xl border bg-background/80 p-4 shadow-sm backdrop-blur"
              style={{ marginLeft: `${i * 2.5}rem` }}
            >
              <div className="flex size-20 shrink-0 items-end justify-center overflow-hidden rounded-xl bg-primary/[0.06]">
                <Art src={item.image} className="h-16" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{item.section}</p>
                <p className="font-semibold">{item.headline}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function Home({
  items,
  next,
  done,
  waiting,
  onContinue,
  onReset,
}: {
  items: readonly PreviewItem[];
  next: PreviewItem | null;
  done: ReadonlySet<string>;
  waiting: ReadonlyMap<string, Waiting>;
  onContinue: (item: PreviewItem) => void;
  onReset: () => void;
}) {
  const nextWaiting = next ? waiting.get(next.code) : undefined;

  return (
    <main
      style={STAGE}
      className="mx-auto grid max-w-7xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:px-10 lg:py-16 xl:gap-20"
    >
      <div className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Ihre Umsetzung von NIS 2
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Ein Punkt nach dem anderen. Was Sie zur Seite legen, wartet rechts auf Sie.
        </p>

        {next ? (
          <section className="mt-10 overflow-hidden rounded-3xl border bg-card shadow-sm">
            {next.image && (
              <div className="flex h-56 items-end justify-center bg-primary/[0.06] sm:h-64">
                <Art src={next.image} className="h-48 translate-y-2 sm:h-56" />
              </div>
            )}
            <div className="p-6 sm:p-8">
              <p className="text-sm font-medium text-primary">
                {nextWaiting ? "Wartet noch" : "Als Nächstes"}
              </p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">
                {next.headline}
              </p>
              <p className="mt-2 text-muted-foreground">{next.teaser}</p>
              {nextWaiting && (
                <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-50">
                  <Clock className="mt-0.5 size-4 shrink-0" />
                  {WAIT_REASONS[nextWaiting.reason]}
                  {nextWaiting.note && `. ${nextWaiting.note}`}
                </p>
              )}
              <Button
                size="lg"
                className="mt-6 h-12 w-full rounded-xl text-base sm:w-auto sm:px-7"
                onClick={() => onContinue(next)}
              >
                NIS 2 Umsetzung fortsetzen
                <ArrowRight />
              </Button>
            </div>
          </section>
        ) : (
          <section className="mt-10 rounded-3xl border bg-card p-8">
            <p className="text-xl font-semibold">
              Für diese Vorschau ist alles erledigt.
            </p>
            <Button variant="outline" className="mt-5 rounded-xl" onClick={onReset}>
              Von vorn
            </Button>
          </section>
        )}
      </div>

      <aside>
        <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Ihr Weg
        </h2>
        <ol className="relative mt-5 space-y-1">
          <span
            aria-hidden
            className="absolute top-4 bottom-4 left-[15px] w-px bg-border"
          />
          {items.map((item) => {
            const isDone = done.has(item.code);
            const entry = waiting.get(item.code);
            const isNext = next?.code === item.code;
            return (
              <li key={item.code} className="relative flex gap-4 rounded-xl p-2">
                <span
                  className={cn(
                    "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 bg-background",
                    isDone && "border-primary bg-primary text-primary-foreground",
                    entry && "border-amber-400 text-amber-600",
                    isNext && !entry && "border-primary ring-4 ring-primary/15",
                  )}
                >
                  {isDone ? (
                    <Check className="size-4" />
                  ) : entry ? (
                    <Clock className="size-4" />
                  ) : null}
                </span>
                <div className="min-w-0 pt-1">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      isDone && "text-muted-foreground",
                    )}
                  >
                    {item.headline}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isDone
                      ? "Erledigt"
                      : entry
                        ? WAIT_REASONS[entry.reason]
                        : isNext
                          ? "Als Nächstes"
                          : item.section}
                  </p>
                  {entry && !isNext && (
                    <button
                      type="button"
                      onClick={() => onContinue(item)}
                      className="mt-1 text-xs font-medium text-primary hover:underline"
                    >
                      Jetzt weitermachen
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </aside>
    </main>
  );
}
