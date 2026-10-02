"use client";

import "./transitions.css";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  BookText,
  ChevronLeft,
  CircleCheckBig,
  ClipboardList,
  Clock,
  DatabaseBackup,
  Eye,
  FileUp,
  Gauge,
  Grid3x3,
  Handshake,
  KeyRound,
  LifeBuoy,
  Lightbulb,
  ListChecks,
  LockKeyhole,
  type LucideIcon,
  PenLine,
  ScrollText,
  ShieldCheck,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
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
import { CATALOG_BY_ID } from "@/lib/asset-inventory/catalog";
import { CUSTOM_ASSET_TYPE } from "@/lib/asset-inventory/types";
import { type ItemState, resumeAt, type ScreenKind, sliceOf } from "@/lib/durchgang";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { Agreements } from "./AgreementScreen";
import { Approve } from "./ApproveScreen";
import { BackupsScreen } from "./BackupsScreen";
import { CriticalScreen } from "./CriticalScreen";
import { CryptoScreen } from "./CryptoScreen";
import { Compare, Learn, Prepare, Provision, Reading, Sample } from "./ExplainScreens";
import { GlossProvider } from "./Glossed";
import { Logins } from "./LoginScreen";
import { PolicyScreen } from "./PolicyScreen";
import { Rail } from "./Rail";
import { Rate, Specify } from "./RatingScreens";
import { RiskMapScreen } from "./RiskMapScreen";
import { type Direction, PROGRESS, STAGE, transition, transitionTo } from "./transition";
import { useScreenComplete } from "./useScreenComplete";
import { useWalkItem } from "./useWalkItem";
import type { ItemView, WalkEntry } from "./view";
import { WaitSheet } from "./WaitSheet";
import { Adopt, Assets, Done, Evidence, Fields, Register } from "./WorkScreens";

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
  assets: ListChecks,
  register: ListChecks,
  specify: PenLine,
  rate: Gauge,
  agreements: Handshake,
  logins: KeyRound,
  policy: ScrollText,
  approve: BadgeCheck,
  riskmap: Grid3x3,
  critical: LifeBuoy,
  backups: DatabaseBackup,
  crypto: LockKeyhole,
  done: CircleCheckBig,
};

const SCREEN_PARAM = "s";

/** A header icon button: 44 px to tap on a phone, the button's own 36 px from `sm` up. */
const PHONE_ICON_TARGET = "size-11 sm:size-9";

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

  const self = walk.find((w) => w.code === item.code);
  const filled: ItemState = { kind: "filled", since: new Date() };
  const next = resumeAt(walk, (w) => (w.code === item.code ? filled : w.state));
  const { draft, setDraft, adoptedAt, leave, keep, park, decline } = useWalkItem(
    item,
    self?.state.kind === "waiting",
  );
  const complete = useScreenComplete(item, item.screens[index], draft);

  // A "which exactly" screen is passed over when nothing of its kind is on the list, saved or
  // ticked on this visit: asking which software you use when you listed none is a dead end.
  const specifies = item.screens.some((s) => s.kind === "specify");
  const assets = trpc.asset.list.useQuery(undefined, { enabled: specifies });
  const passedOver = (target: number): boolean => {
    const screen = item.screens[target]?.screen;
    if (screen?.kind !== "specify" || !assets.data) return false;
    const types = [
      ...assets.data.map((a) => a.type),
      ...draft.checked.flatMap((id) => CATALOG_BY_ID.get(id)?.category ?? []),
      ...draft.custom.map((c) => CUSTOM_ASSET_TYPE[c.layer]),
    ];
    return !types.some((type) => sliceOf(type) === screen.slice);
  };

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

  const forward = () => {
    if (entry.screen.kind === "done") {
      if (next) {
        // The next section slides in like the next screen of this one.
        transitionTo(
          "forward",
          () =>
            router.push({
              pathname: "/durchgang/nis2/[code]",
              params: { code: next.code },
            }),
          () => document.querySelector(`main[data-dg-item="${next.code}"]`) !== null,
        );
      } else {
        router.push("/durchgang/nis2");
      }
      return;
    }
    setError(null);
    const at = index;
    const following = item.screens.findIndex((_, i) => i > at && !passedOver(i));
    const to = following === -1 ? total - 1 : following;
    leave(at, to, () => {
      setError(at);
      show(at, "back");
    });
    show(to, "forward");
  };

  const back = () => {
    const previous = item.screens.findLastIndex((_, i) => i < index && !passedOver(i));
    if (previous === -1) settleAndGoHome(keep(index));
    else show(previous, "back");
  };

  /**
   * Stores what this screen holds, then goes home once that is stored: on exit, and when the item
   * is set aside or closes as decided. A refused save keeps the person here, input intact.
   */
  const settleAndGoHome = (stored: Promise<void>) => {
    setWaitOpen(false);
    stored.then(
      () => router.push("/durchgang/nis2"),
      () => {
        toast.error(t("saveFailed"));
      },
    );
  };

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
        return (
          <Prepare
            entry={entry}
            ready={draft.ready}
            onReady={(ready) => setDraft({ ...draft, ready })}
          />
        );
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
      case "assets":
        return <Assets {...work} entry={entry} />;
      case "register":
        return <Register item={item} entry={entry} />;
      case "specify":
        return <Specify {...work} entry={entry} />;
      case "rate":
        return <Rate {...work} entry={entry} />;
      case "agreements":
        return <Agreements {...work} entry={entry} />;
      case "logins":
        return <Logins {...work} entry={entry} />;
      case "policy":
        return <PolicyScreen {...work} entry={entry} />;
      case "approve":
        return <Approve item={item} entry={entry} />;
      case "critical":
        return <CriticalScreen {...work} entry={entry} />;
      case "backups":
        return <BackupsScreen {...work} entry={entry} />;
      case "crypto":
        return <CryptoScreen {...work} entry={entry} />;
      case "riskmap":
        return <RiskMapScreen {...work} entry={entry} />;
      case "done":
        return (
          <Done item={item} entry={entry} draft={draft} next={next} onNext={forward} />
        );
      default:
        return entry satisfies never;
    }
  })();

  const page = (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md print:hidden">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-3 sm:px-6 lg:px-10">
          <Button
            variant="ghost"
            size="icon"
            className={PHONE_ICON_TARGET}
            aria-label={t("back")}
            onClick={back}
          >
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
            className="h-11 min-w-11 sm:h-8 sm:min-w-0 lg:hidden"
            aria-label={t("lookUp")}
            onClick={() => setRailOpen(true)}
          >
            <BookText />
            <span className="hidden sm:inline">{t("lookUp")}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={PHONE_ICON_TARGET}
            aria-label={t("exit")}
            onClick={() => settleAndGoHome(keep(index))}
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
        <main
          style={STAGE}
          className="w-full max-w-3xl"
          key={`${item.code}-${index}`}
          data-dg-item={item.code}
        >
          <span
            className={cn(
              "mb-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium print:hidden",
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
        <aside className="hidden lg:block print:hidden">
          <div className="sticky top-28">
            <Rail item={item} />
          </div>
        </aside>
      </div>

      <footer className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/90 backdrop-blur-md print:hidden">
        <div className="mx-auto grid max-w-7xl px-4 py-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:px-10 xl:gap-20">
          <div className="flex max-w-3xl items-center justify-between gap-3">
            {/* Only a screen that cannot be completed offers the way out. */}
            {!complete ? (
              <button
                type="button"
                onClick={() => setWaitOpen(true)}
                className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline sm:min-h-0"
              >
                <Clock className="size-4" />
                {t("notYet")}
              </button>
            ) : (
              <span />
            )}
            <div className="flex min-w-0 items-center gap-2">
              <Button
                variant="outline"
                size="lg"
                onClick={back}
                className="h-11 rounded-xl sm:h-10"
                aria-label={t("back")}
              >
                <ChevronLeft />
                <span className="hidden sm:inline">{t("back")}</span>
              </Button>
              <Button
                size="lg"
                onClick={forward}
                disabled={!complete}
                className="h-11 min-w-0 rounded-xl px-6 sm:h-10"
              >
                <span className="max-w-[12rem] truncate sm:max-w-[24rem]">{primary}</span>
                <ArrowRight />
              </Button>
            </div>
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

      <WaitSheet
        open={waitOpen}
        onOpenChange={setWaitOpen}
        onWait={(reason, note) => settleAndGoHome(park(index, reason, note))}
        onDecline={(reason) => settleAndGoHome(decline(index, reason))}
      />
    </div>
  );

  return <GlossProvider value={item.gloss}>{page}</GlossProvider>;
}
