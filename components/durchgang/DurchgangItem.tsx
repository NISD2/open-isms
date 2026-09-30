"use client";

import "./transitions.css";
import {
  ArrowRight,
  BookOpen,
  BookText,
  ChevronLeft,
  CircleCheckBig,
  ClipboardList,
  Clock,
  Eye,
  FileUp,
  Lightbulb,
  ListChecks,
  type LucideIcon,
  PenLine,
  Scale,
  ScrollText,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useRouter } from "@/i18n/navigation";
import { RISK_LEVEL_TEXT } from "@/lib/compliance/bsi-200-3";
import { type ItemState, resumeAt, type ScreenKind } from "@/lib/durchgang";
import type { FieldMeta } from "@/lib/forms/schema-introspect";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import type { Draft } from "./draft";
import { Compare, Learn, Prepare, Provision, Reading, Sample } from "./ExplainScreens";
import { Rail } from "./Rail";
import { type Direction, PROGRESS, STAGE, transition } from "./transition";
import type { ItemView, WalkEntry } from "./view";
import { WaitSheet } from "./WaitSheet";
import {
  Adopt,
  Assets,
  asInput,
  Decide,
  Done,
  Evidence,
  Fields,
  Register,
  Sources,
} from "./WorkScreens";

/** Each kind of screen carries its own sign, so a person learns where they are at a glance. */
const KIND_ICON: Readonly<Record<ScreenKind, LucideIcon>> = {
  learn: BookOpen,
  prepare: ClipboardList,
  compare: Lightbulb,
  sample: Lightbulb,
  reading: Lightbulb,
  provision: ShieldCheck,
  fields: PenLine,
  evidence: FileUp,
  adopt: ScrollText,
  decide: Scale,
  sources: Search,
  assets: ListChecks,
  register: ListChecks,
  done: CircleCheckBig,
};

const SCREEN_PARAM = "s";

/**
 * An intake answer as the save sends it: numbers as numbers, and an emptied field as null, which
 * the intake save stores as cleared. Undefined means there is nothing valid to send.
 */
const toAnswer = (type: string | undefined, value: unknown): unknown => {
  if (value === "" || value === null || value === undefined) return null;
  if (type === "number") {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }
  return typeof value === "string" ? value.trim() : value;
};

/** A stored answer as the draft holds it: yes or no stays a boolean, everything else a string. */
const toDraft = (meta: FieldMeta | undefined, value: unknown): unknown =>
  meta?.type === "boolean" && typeof value === "boolean" ? value : asInput(meta, value);

const clampScreen = (value: number, total: number) =>
  Number.isInteger(value) && value >= 0 && value < total ? value : 0;

export function DurchgangItem({
  item,
  walk,
  initialScreen,
}: {
  item: ItemView;
  walk: readonly WalkEntry[];
  initialScreen: number;
}) {
  const t = useTranslations("durchgang.ui");
  const router = useRouter();
  const total = item.screens.length;
  const [index, setIndex] = useState(() => clampScreen(initialScreen, total));
  const [error, setError] = useState<number | null>(null);
  const [waitOpen, setWaitOpen] = useState(false);
  const [railOpen, setRailOpen] = useState(false);
  /** Set when this visit resumed a waiting item or adopted the method, so neither is sent twice. */
  const [resumed, setResumed] = useState(false);
  const [adoptedAt, setAdoptedAt] = useState(item.adoptedAt);
  const [draft, setDraft] = useState<Draft>(() => ({
    values: Object.fromEntries(
      Object.entries(item.answers).map(([k, v]) => [k, toDraft(item.fields[k], v)]),
    ),
    sources: [],
    acceptance: null,
    checked: [],
    custom: [],
    uploaded: null,
  }));
  /** What the server holds, so an unchanged screen saves nothing. */
  const saved = useRef<Readonly<Record<string, unknown>>>(draft.values);
  /**
   * The writes run one after another. The screen moves on before its write settles, and two
   * answer saves in flight at once would each merge into the same stored answers, the later
   * overwriting the earlier.
   */
  const queue = useRef<Promise<void>>(Promise.resolve());

  const self = walk.find((w) => w.code === item.code);
  const filled: ItemState = { kind: "filled", since: new Date() };
  const next = resumeAt(walk, (w) => (w.code === item.code ? filled : w.state));

  const saveAnswers = trpc.intake.saveRequirementAnswers.useMutation();
  const sources = trpc.durchgang.sources.useMutation();
  const adopt = trpc.durchgang.adoptMethod.useMutation();
  const decide = trpc.durchgang.decideAcceptance.useMutation();
  const addAssets = trpc.durchgang.addAssets.useMutation();
  const finish = trpc.durchgang.finish.useMutation();
  const resume = trpc.durchgang.resume.useMutation();
  const wait = trpc.durchgang.wait.useMutation();

  // The screen lives in the URL, so the browser's back button and a reload keep the place.
  const show = useCallback((target: number, direction: Direction, push = true) => {
    transition(direction, () => {
      setIndex(target);
      if (push) {
        const url = new URL(window.location.href);
        url.searchParams.set(SCREEN_PARAM, String(target));
        window.history.pushState(null, "", url);
      }
    });
  }, []);

  useEffect(() => {
    const onPop = () => {
      const raw = Number(
        new URL(window.location.href).searchParams.get(SCREEN_PARAM) ?? 0,
      );
      setIndex(clampScreen(raw, total));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [total]);

  const entry = item.screens[index];
  if (!entry) return null;

  /** The write a screen makes when the person moves on, or null when it has nothing to record. */
  const saveOf = (at: number): Promise<unknown> | null => {
    const current = item.screens[at];
    if (!current) return null;
    switch (current.screen.kind) {
      case "fields": {
        const answers = Object.fromEntries(
          current.screen.fields.flatMap((key) => {
            const value = draft.values[key];
            if (value === saved.current[key]) return [];
            const answer = toAnswer(item.fields[key]?.type, value);
            return answer === undefined ? [] : [[key, answer]];
          }),
        );
        if (Object.keys(answers).length === 0 || !item.assessmentId) return null;
        return saveAnswers
          .mutateAsync({
            assessmentId: item.assessmentId,
            categoryId: item.categoryId,
            requirementCode: item.code,
            answers,
          })
          .then(() => {
            saved.current = {
              ...saved.current,
              ...Object.fromEntries(
                Object.keys(answers).map((k) => [k, draft.values[k]]),
              ),
            };
          });
      }
      case "evidence": {
        const field = current.screen.field;
        if (!field || !draft.uploaded || !item.assessmentId) return null;
        return saveAnswers.mutateAsync({
          assessmentId: item.assessmentId,
          categoryId: item.categoryId,
          requirementCode: item.code,
          answers: { [field]: draft.uploaded },
        });
      }
      case "adopt":
        return adoptedAt === null ? adopt.mutateAsync() : null;
      case "decide":
        return draft.acceptance ? decide.mutateAsync({ level: draft.acceptance }) : null;
      case "sources":
        return draft.sources.length > 0
          ? sources.mutateAsync({ code: item.code, sources: [...draft.sources] })
          : null;
      case "assets":
        return draft.checked.length > 0 || draft.custom.length > 0
          ? addAssets.mutateAsync({
              catalogIds: [...draft.checked],
              custom: draft.custom.map((c) => ({ name: c.name })),
              locale: item.locale,
            })
          : null;
      default:
        return null;
    }
  };

  const forward = () => {
    if (entry.screen.kind === "done") {
      if (next) {
        router.push({ pathname: "/durchgang/[code]", params: { code: next.code } });
      } else {
        router.push("/durchgang");
      }
      return;
    }
    setError(null);
    const at = index;
    // Decided now, from this screen's state; the writes themselves wait their turn.
    const resuming = at === 0 && self?.state.kind === "waiting" && !resumed;
    const adopting = entry.screen.kind === "adopt" && adoptedAt === null;
    const finishing = item.screens[at + 1]?.screen.kind === "done";
    if (resuming) setResumed(true);
    if (adopting) setAdoptedAt(new Date());
    show(Math.min(at + 1, total - 1), "forward");
    queue.current = queue.current
      .then(async () => {
        if (resuming) await resume.mutateAsync({ code: item.code });
        await saveOf(at);
        // The item counts as filled only once its last answers are stored.
        if (finishing) await finish.mutateAsync({ code: item.code });
      })
      .catch(() => {
        if (resuming) setResumed(false);
        if (adopting) setAdoptedAt(null);
        setError(at);
        show(at, "back");
      });
  };

  const back = () => {
    if (index === 0) router.push("/durchgang");
    else show(index - 1, "back");
  };

  /** Parks the item once the pending writes and the waiting row are stored, then goes home. */
  const park = (reason: Parameters<typeof wait.mutate>[0]["reason"], note: string) => {
    setWaitOpen(false);
    queue.current = queue.current
      .then(() =>
        wait.mutateAsync({ code: item.code, reason, note: note.trim() || undefined }),
      )
      .then(
        () => router.push("/durchgang"),
        () => {
          toast.error(t("saveFailed"));
        },
      );
  };

  const recorded = [
    ...item.screens.flatMap((s) =>
      s.screen.kind === "fields" && "fields" in s.copy
        ? s.copy.fields.flatMap((f) => {
            const value = draft.values[f.key];
            if (value === "" || value === undefined || value === null) return [];
            const shown =
              f.options && typeof value === "string"
                ? (f.options[value] ?? value)
                : typeof value === "boolean"
                  ? value
                    ? t("yes")
                    : t("no")
                  : String(value);
            return [`${f.label}: ${shown}`];
          })
        : [],
    ),
    ...(draft.uploaded ? [draft.uploaded] : []),
    ...(draft.acceptance ? [RISK_LEVEL_TEXT[item.locale][draft.acceptance].label] : []),
  ];

  const primary =
    entry.screen.kind === "adopt" && adoptedAt === null
      ? t("adopt")
      : entry.screen.kind === "done"
        ? next && next.code !== item.code
          ? t("nextItem", { headline: next.headline })
          : t("toOverview")
        : t("next");
  const Icon = KIND_ICON[entry.screen.kind];

  const body = (() => {
    const work = { item, draft, onDraft: setDraft };
    switch (entry.kind) {
      case "learn":
        return <Learn item={item} entry={entry} />;
      case "prepare":
        return <Prepare entry={entry} />;
      case "compare":
        return <Compare entry={entry} />;
      case "sample":
        return <Sample entry={entry} />;
      case "reading":
        return <Reading item={item} entry={entry} />;
      case "provision":
        return <Provision item={item} entry={entry} />;
      case "fields":
        return <Fields {...work} entry={entry} />;
      case "evidence":
        return <Evidence {...work} entry={entry} />;
      case "adopt":
        return <Adopt item={item} entry={entry} adoptedAt={adoptedAt} />;
      case "decide":
        return <Decide {...work} entry={entry} />;
      case "sources":
        return <Sources {...work} entry={entry} />;
      case "assets":
        return <Assets {...work} entry={entry} />;
      case "register":
        return <Register item={item} entry={entry} />;
      case "done":
        return <Done item={item} entry={entry} recorded={recorded} next={next} />;
      default:
        return entry satisfies never;
    }
  })();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-3 sm:px-6 lg:px-10">
          <Button variant="ghost" size="icon" aria-label={t("back")} onClick={back}>
            <ChevronLeft className="size-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-muted-foreground">
              {t("where", { section: item.section, step: index + 1, total })}
            </p>
            <p className="truncate text-sm font-semibold">{item.title}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            aria-label={t("lookUp")}
            onClick={() => setRailOpen(true)}
          >
            <BookText />
            <span className="hidden sm:inline">{t("lookUp")}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("exit")}
            onClick={() => router.push("/durchgang")}
          >
            <X className="size-5" />
          </Button>
        </div>
        <div
          className="h-1 bg-muted"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={index + 1}
        >
          <div
            className="h-full rounded-r-full bg-primary"
            style={{ ...PROGRESS, width: `${((index + 1) / total) * 100}%` }}
          />
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] gap-12 px-4 pt-8 pb-40 sm:px-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:px-10 lg:pt-14 xl:gap-20">
        <main style={STAGE} className="w-full max-w-3xl" key={`${item.code}-${index}`}>
          <span
            className={cn(
              "mb-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
              entry.screen.kind === "provision"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground",
            )}
          >
            <Icon className="size-3.5" />
            {t(`kinds.${entry.screen.kind}`)}
          </span>
          {error === index && (
            <p
              role="alert"
              className="mb-6 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-50"
            >
              <Eye className="mt-0.5 size-4 shrink-0" />
              {t("saveFailed")}
            </p>
          )}
          {body}
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
            {entry.screen.kind !== "done" ? (
              <button
                type="button"
                onClick={() => setWaitOpen(true)}
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                <Clock className="size-4" />
                {t("notYet")}
              </button>
            ) : (
              <span />
            )}
            <Button size="lg" onClick={forward} className="min-w-0 rounded-xl px-6">
              <span className="max-w-[15rem] truncate sm:max-w-[24rem]">{primary}</span>
              <ArrowRight />
            </Button>
          </div>
        </div>
      </footer>

      <Sheet open={railOpen} onOpenChange={setRailOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{t("lookUp")}</SheetTitle>
            <SheetDescription>{item.title}</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-8">
            <Rail item={item} />
          </div>
        </SheetContent>
      </Sheet>

      <WaitSheet open={waitOpen} onOpenChange={setWaitOpen} onConfirm={park} />
    </div>
  );
}
