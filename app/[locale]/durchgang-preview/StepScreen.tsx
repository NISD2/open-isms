"use client";

import {
  ArrowRight,
  BookOpen,
  BookText,
  Calculator,
  Check,
  CheckCircle2,
  ChevronLeft,
  CircleCheckBig,
  Clock,
  Eye,
  FileText,
  FileUp,
  Lightbulb,
  ListChecks,
  type LucideIcon,
  PenLine,
  ScrollText,
  Search,
  ShieldCheck,
  Upload,
  Wrench,
  X,
  XCircle,
} from "lucide-react";
import { type CSSProperties, type ReactNode, useState } from "react";
import { BigChecklist } from "@/components/asset-inventory/BigChecklist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { AssetLayer } from "@/lib/asset-inventory/types";
import { cn } from "@/lib/utils";
import { RiskMatrix } from "./RiskMatrix";
import type { Example, PreviewItem, PreviewScreen, SourceIcon } from "./script";

export const WAIT_REASONS = {
  letter: "Ich warte auf ein Schreiben, zum Beispiel vom BSI",
  ask: "Ich muss erst jemanden fragen",
  decide: "Das müssen wir intern entscheiden",
  unclear: "Ich verstehe es noch nicht",
} as const;

export type WaitReason = keyof typeof WAIT_REASONS;

const isWaitReason = (value: string): value is WaitReason =>
  Object.hasOwn(WAIT_REASONS, value);

export interface Waiting {
  readonly reason: WaitReason;
  readonly note: string;
}

/** What the person has entered so far. Held in the page only; the preview stores nothing. */
export interface Draft {
  readonly values: Readonly<Record<string, string>>;
  readonly file: string | null;
  readonly looked: readonly string[];
  readonly checked: readonly string[];
  readonly custom: ReadonlyArray<{ name: string; layer: AssetLayer }>;
}

/** Each kind of screen carries its own sign, so a person learns where they are at a glance. */
export const KIND: Readonly<
  Record<PreviewScreen["kind"], { label: string; icon: LucideIcon }>
> = {
  learn: { label: "Verstehen", icon: BookOpen },
  example: { label: "Beispiel", icon: Lightbulb },
  fields: { label: "Eintragen", icon: PenLine },
  evidence: { label: "Nachweis", icon: FileUp },
  provision: { label: "Vorgabe des BSI", icon: ShieldCheck },
  adopt: { label: "Übernehmen", icon: ScrollText },
  sources: { label: "Wo Sie suchen", icon: Search },
  register: { label: "Ihre Liste", icon: ListChecks },
  done: { label: "Erledigt", icon: CircleCheckBig },
};

const SOURCE_ICON: Readonly<Record<SourceIcon, LucideIcon>> = {
  privacy: ShieldCheck,
  ledger: Calculator,
  provider: Wrench,
};

/** The sector the preview company is in: a Krankentransport counts as health (BSI sector FAQ). */
const PREVIEW_SECTORS = ["health"];

/** Only the stage takes part in the screen transition; header, rail and footer stay put. */
const STAGE: CSSProperties = { viewTransitionName: "dg-stage" };
const PROGRESS: CSSProperties = { viewTransitionName: "dg-progress" };

const today = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  dateStyle: "long",
});

interface StepScreenProps {
  readonly item: PreviewItem;
  readonly screenIndex: number;
  readonly next: PreviewItem | null;
  readonly draft: Draft;
  readonly onDraft: (draft: Draft) => void;
  readonly onBack: () => void;
  readonly onForward: () => void;
  readonly onExit: () => void;
  readonly onWait: (waiting: Waiting) => void;
}

export function StepScreen(props: StepScreenProps) {
  const { item, screenIndex, next, onBack, onForward, onExit, onWait } = props;
  const screen = item.screens[screenIndex];
  const [waitOpen, setWaitOpen] = useState(false);
  const [railOpen, setRailOpen] = useState(false);
  if (!screen) return null;

  const total = item.screens.length;
  const primaryLabel =
    screen.kind === "adopt"
      ? "Übernehmen"
      : screen.kind === "done"
        ? next
          ? `Weiter: ${next.headline}`
          : "Zur Übersicht"
        : "Weiter";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-3 sm:px-6 lg:px-10">
          <Button variant="ghost" size="icon" aria-label="Zurück" onClick={onBack}>
            <ChevronLeft className="size-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-muted-foreground">
              {item.section} · Schritt {screenIndex + 1} von {total}
            </p>
            <p className="truncate text-sm font-semibold">{item.title}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            aria-label="Nachschlagen"
            onClick={() => setRailOpen(true)}
          >
            <BookText />
            <span className="hidden sm:inline">Nachschlagen</span>
          </Button>
          <Button variant="ghost" size="icon" aria-label="Zur Übersicht" onClick={onExit}>
            <X className="size-5" />
          </Button>
        </div>
        <div className="h-1 bg-muted">
          <div
            className="h-full rounded-r-full bg-primary"
            style={{ ...PROGRESS, width: `${((screenIndex + 1) / total) * 100}%` }}
          />
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-12 px-4 pt-8 pb-40 sm:px-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:px-10 lg:pt-14 xl:gap-20">
        <main style={STAGE} className="w-full max-w-3xl">
          <KindTag kind={screen.kind} />
          <ScreenBody {...props} screen={screen} />
        </main>
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <Rail item={item} />
          </div>
        </aside>
      </div>

      <footer className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/90 backdrop-blur-md">
        <div className="mx-auto grid max-w-7xl px-4 py-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:px-10 xl:gap-20">
          <div className="flex max-w-3xl items-center justify-between gap-3">
            {screen.kind !== "done" ? (
              <button
                type="button"
                onClick={() => setWaitOpen(true)}
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                <Clock className="size-4" />
                Geht noch nicht
              </button>
            ) : (
              <span />
            )}
            <Button size="lg" onClick={onForward} className="min-w-0 rounded-xl px-6">
              <span className="max-w-[15rem] truncate sm:max-w-[24rem]">
                {primaryLabel}
              </span>
              <ArrowRight />
            </Button>
          </div>
        </div>
      </footer>

      <Sheet open={railOpen} onOpenChange={setRailOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Nachschlagen</SheetTitle>
            <SheetDescription>{item.title}</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-8">
            <Rail item={item} />
          </div>
        </SheetContent>
      </Sheet>

      <WaitSheet
        open={waitOpen}
        onOpenChange={setWaitOpen}
        itemCode={item.code}
        onConfirm={(waiting) => {
          setWaitOpen(false);
          onWait(waiting);
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------------

function KindTag({ kind }: { kind: PreviewScreen["kind"] }) {
  const { label, icon: Icon } = KIND[kind];
  const authority = kind === "provision";
  return (
    <span
      className={cn(
        "mb-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        authority
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground",
      )}
    >
      <Icon className="size-3.5" />
      {label}
    </span>
  );
}

function Heading({ children }: { children: ReactNode }) {
  return (
    <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-[2.5rem] sm:leading-[1.1]">
      {children}
    </h1>
  );
}

function Lead({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 max-w-[60ch] text-lg leading-8 text-muted-foreground">
      {children}
    </p>
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

// ---------------------------------------------------------------------------
// One body per kind of screen
// ---------------------------------------------------------------------------

function ScreenBody({
  item,
  next,
  draft,
  onDraft,
  screen,
}: StepScreenProps & { screen: PreviewScreen }) {
  switch (screen.kind) {
    case "learn":
      return (
        <>
          {item.image && (
            <div className="mb-8 flex h-44 items-end justify-center overflow-hidden rounded-3xl bg-primary/[0.06] sm:h-52">
              <Art src={item.image} className="h-40 translate-y-2 sm:h-48" />
            </div>
          )}
          <Heading>{screen.title}</Heading>
          <div className="mt-5 max-w-[62ch] space-y-4 text-[17px] leading-8 text-foreground/85">
            {screen.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <Duty text={screen.duty.text} cite={screen.duty.cite} href={item.statuteHref} />
        </>
      );

    case "example":
      return (
        <>
          <Heading>{screen.title}</Heading>
          <div className="mt-8">
            <ExampleView example={screen.example} />
          </div>
        </>
      );

    case "fields":
      return (
        <>
          <Heading>{screen.title}</Heading>
          <Lead>{screen.lead}</Lead>
          <div className="mt-8 overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="flex items-center gap-3 border-b bg-muted/40 px-5 py-3">
              <FileText className="size-4 text-muted-foreground" />
              <p className="text-sm font-medium">{screen.document}</p>
              <span className="ml-auto text-xs text-muted-foreground">abschreiben</span>
            </div>
            <div className="space-y-7 p-5 sm:p-6">
              {screen.fields.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <Label htmlFor={field.key} className="text-[15px] font-semibold">
                    {field.label}
                  </Label>
                  {field.meaning && (
                    <p className="text-sm text-muted-foreground">{field.meaning}</p>
                  )}
                  <Input
                    id={field.key}
                    type={field.type}
                    className="mt-2 h-12 rounded-xl text-base"
                    value={draft.values[field.key] ?? ""}
                    onChange={(e) =>
                      onDraft({
                        ...draft,
                        values: { ...draft.values, [field.key]: e.target.value },
                      })
                    }
                  />
                  {field.whereToFind && (
                    <details className="group pt-1 text-sm">
                      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 font-medium text-primary">
                        <Search className="size-3.5" />
                        Wo finde ich das?
                      </summary>
                      <p className="mt-2 rounded-lg bg-muted/60 p-3 text-muted-foreground">
                        {field.whereToFind}
                      </p>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      );

    case "evidence":
      return (
        <>
          <Heading>{screen.title}</Heading>
          <Lead>{screen.lead}</Lead>
          {draft.file ? (
            <div className="mt-8 flex items-center gap-4 rounded-2xl border bg-card p-5 shadow-sm">
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CheckCircle2 className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{draft.file}</p>
                <p className="text-sm text-muted-foreground">
                  Hochgeladen als Nachweis für {screen.document}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDraft({ ...draft, file: null })}
              >
                Ersetzen
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onDraft({ ...draft, file: "Bestaetigung_BSI.pdf" })}
              className="mt-8 flex w-full items-center gap-6 rounded-2xl border-2 border-dashed p-6 text-left transition-colors hover:border-primary/40 hover:bg-primary/[0.03] sm:p-8"
            >
              <DocumentThumb title={screen.document} />
              <span>
                <span className="flex items-center gap-2 font-semibold">
                  <Upload className="size-4" />
                  Datei auswählen
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  PDF, JPG oder PNG. Ein Foto reicht.
                </span>
              </span>
            </button>
          )}
        </>
      );

    case "provision":
      return (
        <>
          <Heading>{screen.title}</Heading>
          <Lead>{screen.lead}</Lead>
          <div className="mt-8 rounded-3xl border bg-card p-4 shadow-sm sm:p-6">
            <RiskMatrix />
          </div>
          <p className="mt-4 flex gap-2 text-xs leading-5 text-muted-foreground">
            <BookText className="mt-0.5 size-3.5 shrink-0" />
            {screen.source}
          </p>
        </>
      );

    case "adopt":
      return (
        <>
          <Heading>{screen.title}</Heading>
          <Lead>{screen.lead}</Lead>
          <article className="mt-8 overflow-hidden rounded-2xl border bg-card shadow-sm">
            <header className="flex items-center gap-3 border-b bg-muted/40 px-5 py-3">
              <ScrollText className="size-4 text-muted-foreground" />
              <p className="text-sm font-medium">Eintrag in Ihren Unterlagen</p>
              <p className="ml-auto text-xs text-muted-foreground">
                {today.format(new Date())}
              </p>
            </header>
            <dl className="divide-y">
              {screen.lines.map((line) => (
                <div
                  key={line.label}
                  className="grid gap-1 px-5 py-4 sm:grid-cols-[9rem_1fr] sm:gap-6"
                >
                  <dt className="text-sm text-muted-foreground">{line.label}</dt>
                  <dd className="text-sm font-medium">{line.text}</dd>
                </div>
              ))}
            </dl>
            <footer className="border-t bg-muted/20 px-5 py-5">
              <div className="flex items-end justify-between gap-4">
                <div className="flex-1">
                  <div className="h-8 border-b border-dashed border-foreground/30" />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Freigabe durch die Geschäftsführung
                  </p>
                </div>
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-100">
                  steht aus
                </span>
              </div>
            </footer>
          </article>
          <p className="mt-4 max-w-[60ch] text-sm text-muted-foreground">
            Welches Risiko das Unternehmen trägt, entscheidet die Geschäftsführung. Sie
            sieht diesen Eintrag, bevor sie unterschreibt.
          </p>
        </>
      );

    case "sources":
      return (
        <>
          <Heading>{screen.title}</Heading>
          <Lead>{screen.lead}</Lead>
          <div className="mt-8 grid gap-3">
            {screen.sources.map((source) => {
              const Icon = SOURCE_ICON[source.icon];
              const looked = draft.looked.includes(source.id);
              return (
                <button
                  key={source.id}
                  type="button"
                  aria-pressed={looked}
                  onClick={() =>
                    onDraft({
                      ...draft,
                      looked: looked
                        ? draft.looked.filter((id) => id !== source.id)
                        : [...draft.looked, source.id],
                    })
                  }
                  className={cn(
                    "flex items-center gap-4 rounded-2xl border bg-card p-4 text-left shadow-sm transition-colors sm:p-5",
                    looked && "border-primary/40 bg-primary/[0.04]",
                  )}
                >
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <Icon className="size-5 text-foreground/70" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{source.label}</span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">
                      {source.text}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
                      looked
                        ? "border-primary bg-primary text-primary-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {looked && <Check className="size-3.5" />}
                    Nachgesehen
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Was Sie abhaken, wird mit Datum festgehalten. So ist später klar, woher Ihre
            Liste stammt.
          </p>
        </>
      );

    case "register":
      return (
        <>
          <Heading>{screen.title}</Heading>
          <Lead>{screen.lead}</Lead>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <ListChecks className="size-4" />
            {draft.checked.length + draft.custom.length} Einträge auf Ihrer Liste
          </p>
          <div className="mt-6">
            <BigChecklist
              sectors={PREVIEW_SECTORS}
              groups={screen.groups}
              checked={[...draft.checked]}
              custom={[...draft.custom]}
              onCheckedChange={(checked) => onDraft({ ...draft, checked })}
              onCustomChange={(custom) => onDraft({ ...draft, custom })}
            />
          </div>
        </>
      );

    case "done": {
      const recorded =
        screen.recorded.length > 0
          ? screen.recorded
          : [`${draft.checked.length + draft.custom.length} Einträge auf Ihrer Liste`];
      return (
        <>
          <section className="relative overflow-hidden rounded-3xl bg-primary p-8 text-primary-foreground sm:p-10">
            <CheckCircle2 className="size-12" strokeWidth={1.5} />
            <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
              {screen.title}
            </h1>
            <p className="mt-2 text-primary-foreground/80">
              Festgehalten in Ihren Unterlagen
            </p>
            <ul className="mt-6 space-y-2">
              {recorded.map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-[15px]">
                  <Check className="mt-1 size-4 shrink-0" />
                  {line}
                </li>
              ))}
            </ul>
          </section>
          <p className="mt-6 max-w-[60ch] text-muted-foreground">{screen.note}</p>
          {next && (
            <div className="mt-8 flex items-center gap-5 rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex size-20 shrink-0 items-end justify-center overflow-hidden rounded-xl bg-primary/[0.06]">
                <Art src={next.image} className="h-16" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">Als Nächstes</p>
                <p className="text-lg font-semibold">{next.headline}</p>
                <p className="text-sm text-muted-foreground">{next.teaser}</p>
              </div>
            </div>
          )}
        </>
      );
    }
  }
}

/** The legal duty: a paragraph sign, one plain sentence, and the statute one click away. */
function Duty({ text, cite, href }: { text: string; cite: string; href: string | null }) {
  return (
    <aside className="mt-10 flex max-w-[62ch] gap-4 rounded-2xl border border-primary/15 bg-primary/[0.04] p-5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary font-serif text-xl text-primary-foreground">
        §
      </span>
      <div>
        <p className="text-sm font-semibold">Warum Sie das tun müssen</p>
        <p className="mt-1 text-sm leading-6 text-foreground/80">{text}</p>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1 rounded-full border bg-background px-3 py-1 text-xs font-medium text-primary hover:border-primary/40"
          >
            {cite} im Gesetz lesen
          </a>
        ) : (
          <p className="mt-3 text-xs font-medium text-primary">{cite}</p>
        )}
      </div>
    </aside>
  );
}

function ExampleView({ example }: { example: Example }) {
  switch (example.kind) {
    case "compare":
      return (
        <div>
          <p className="text-sm font-medium text-muted-foreground">{example.caption}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Sample tone="good" value={example.good.value} note={example.good.note} />
            <Sample tone="bad" value={example.bad.value} note={example.bad.note} />
          </div>
        </div>
      );
    case "rows":
      return (
        <div>
          <p className="text-sm font-medium text-muted-foreground">{example.caption}</p>
          <div className="mt-4 overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] border-b bg-muted/40 px-5 py-2.5 text-xs font-medium text-muted-foreground">
              <span>Was</span>
              <span>Kurz dazu</span>
            </div>
            {example.rows.map((row) => (
              <div
                key={row.name}
                className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] border-b px-5 py-3.5 text-sm last:border-b-0"
              >
                <span className="font-medium">{row.name}</span>
                <span className="text-muted-foreground">{row.detail}</span>
              </div>
            ))}
          </div>
        </div>
      );
    case "matrix":
      return (
        <div>
          <blockquote className="max-w-[60ch] border-l-2 border-primary/40 pl-4 text-[17px] leading-8">
            {example.caption}
          </blockquote>
          <div className="mt-6 rounded-3xl border bg-card p-4 shadow-sm sm:p-6">
            <RiskMatrix
              highlight={{ impact: example.impact, frequency: example.frequency }}
            />
          </div>
          <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground">
            {example.frequency} + {example.impact} = Stufe {example.result}
          </p>
        </div>
      );
  }
}

function Sample({
  tone,
  value,
  note,
}: {
  tone: "good" | "bad";
  value: string;
  note: string;
}) {
  const good = tone === "good";
  const Icon = good ? CheckCircle2 : XCircle;
  return (
    <div
      className={cn(
        "rounded-2xl border p-5",
        good
          ? "border-emerald-600/25 bg-emerald-50 dark:bg-emerald-950/30"
          : "border-red-600/15 bg-red-50/60 dark:bg-red-950/20",
      )}
    >
      <p
        className={cn(
          "flex items-center gap-1.5 text-sm font-semibold",
          good
            ? "text-emerald-800 dark:text-emerald-300"
            : "text-red-800 dark:text-red-300",
        )}
      >
        <Icon className="size-4" />
        {good ? "So ja" : "So besser nicht"}
      </p>
      <p
        className={cn(
          "mt-3 truncate rounded-lg border bg-background px-3 py-2.5 font-mono text-sm",
          !good && "text-muted-foreground line-through decoration-red-500/60",
        )}
      >
        {value}
      </p>
      <p className="mt-3 text-sm leading-6 text-foreground/80">{note}</p>
    </div>
  );
}

function DocumentThumb({ title }: { title: string }) {
  return (
    <span
      aria-hidden
      className="flex h-24 w-[4.5rem] shrink-0 -rotate-3 flex-col gap-1.5 rounded-md border bg-background p-2 shadow-md"
    >
      <span className="h-1.5 w-8 rounded-full bg-primary/60" />
      <span className="mt-1 h-1 w-full rounded-full bg-muted-foreground/25" />
      <span className="h-1 w-5/6 rounded-full bg-muted-foreground/25" />
      <span className="h-1 w-full rounded-full bg-muted-foreground/25" />
      <span className="h-1 w-2/3 rounded-full bg-muted-foreground/25" />
      <span className="sr-only">{title}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// The rail: the same three places on every screen of an item
// ---------------------------------------------------------------------------

function Rail({ item }: { item: PreviewItem }) {
  return (
    <div className="space-y-8">
      {item.overlooked.length > 0 && (
        <section className="rounded-2xl border border-amber-300/70 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/40">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-950 dark:text-amber-100">
            <Eye className="size-4" />
            Häufig übersehen
          </h2>
          <ol className="mt-3 space-y-3">
            {item.overlooked.map((text, i) => (
              <li
                key={text}
                className="flex gap-3 text-sm leading-6 text-amber-950/90 dark:text-amber-50/90"
              >
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-200 text-[11px] font-semibold text-amber-950 dark:bg-amber-800 dark:text-amber-50">
                  {i + 1}
                </span>
                {text}
              </li>
            ))}
          </ol>
        </section>
      )}

      <section>
        <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Begriffe
        </h2>
        <div className="mt-2 divide-y border-y">
          {item.terms.map((term) => (
            <details key={term.term} className="group py-2.5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium">
                {term.term}
                <span className="text-muted-foreground transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {term.definition}
              </p>
              {term.source && <p className="mt-1 text-xs text-primary">{term.source}</p>}
            </details>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Gesetz
        </h2>
        <ul className="mt-3 space-y-3">
          {item.citations.map((row) => (
            <li key={`${row.label}${row.citation}`} className="flex gap-3 text-sm">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted font-serif text-sm text-foreground/70">
                §
              </span>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{row.label}</p>
                {row.href ? (
                  <a
                    href={row.href}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    {row.citation}
                  </a>
                ) : (
                  <p className="font-medium">{row.citation}</p>
                )}
                {row.note && (
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {row.note}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// "Geht noch nicht"
// ---------------------------------------------------------------------------

function WaitSheet({
  open,
  onOpenChange,
  itemCode,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemCode: string;
  onConfirm: (waiting: Waiting) => void;
}) {
  const [reason, setReason] = useState<WaitReason>("letter");
  const [note, setNote] = useState("");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Kein Problem. Was fehlt noch?</SheetTitle>
          <SheetDescription>
            Der Punkt kommt auf Ihre Warteliste. Sie machen mit dem nächsten weiter und
            kommen zurück, wenn es geht.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-5 px-4">
          <RadioGroup
            value={reason}
            onValueChange={(value) => isWaitReason(value) && setReason(value)}
          >
            {Object.entries(WAIT_REASONS).map(([key, label]) => (
              <Label
                key={key}
                htmlFor={`wait-${key}`}
                className="flex items-center gap-3 rounded-xl border p-3.5 font-normal has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/[0.04]"
              >
                <RadioGroupItem id={`wait-${key}`} value={key} />
                {label}
              </Label>
            ))}
          </RadioGroup>
          {reason === "unclear" && (
            <p className="rounded-xl bg-muted p-3.5 text-sm">
              Schreiben Sie uns, wir erklären es Ihnen.{" "}
              <a
                href={`/hilfe?req=${itemCode}`}
                className="font-medium text-primary hover:underline"
              >
                Frage stellen
              </a>
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="wait-note">Notiz für später (freiwillig)</Label>
            <Textarea
              id="wait-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Zum Beispiel: IT-Dienstleister nach den IP-Adressen fragen"
            />
          </div>
        </div>
        <SheetFooter>
          <Button
            size="lg"
            className="rounded-xl"
            onClick={() => onConfirm({ reason, note })}
          >
            Auf die Warteliste
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
