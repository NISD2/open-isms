"use client";

import {
  BookText,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import {
  FREQUENCY_TEXT,
  IMPACT_TEXT,
  RISK_LEVEL_TEXT,
  riskLevel,
} from "@/lib/compliance/bsi-200-3";
import type { LearnLink, ResolvedScreen } from "@/lib/durchgang";
import { cn } from "@/lib/utils";
import { Art } from "./Art";
import { RegistrationPortals } from "./RegistrationPortals";
import { ReportingClock } from "./ReportingClock";
import { LEVEL_FILL, RiskMatrix } from "./RiskMatrix";
import { SizeThresholds } from "./SizeThresholds";
import type { ItemView } from "./view";

type Of<K extends ResolvedScreen["kind"]> = Extract<ResolvedScreen, { kind: K }>;

export function Heading({ children }: { children: ReactNode }) {
  return (
    <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-[2.5rem] sm:leading-[1.1]">
      {children}
    </h1>
  );
}

export function Lead({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 max-w-[60ch] text-lg leading-8 text-muted-foreground">
      {children}
    </p>
  );
}

/** Where a BSI rule or a statute list comes from, in small type under it. */
function Source({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 flex max-w-[62ch] gap-2 text-xs leading-5 text-muted-foreground">
      <BookText className="mt-0.5 size-3.5 shrink-0" />
      {children}
    </p>
  );
}

/** The legal duty: a paragraph sign, one plain sentence, and the citation it rests on. */
function Duty({ text, cite }: { text: string; cite: string }) {
  const t = useTranslations("durchgang.ui");
  return (
    <aside className="mt-10 flex max-w-[62ch] gap-4 rounded-2xl border border-primary/15 bg-primary/[0.04] p-5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary font-serif text-xl text-primary-foreground">
        §
      </span>
      <div>
        <p className="text-sm font-semibold">{t("duty")}</p>
        <p className="mt-1 text-sm leading-6 text-foreground/80">{text}</p>
        <p className="mt-3 text-xs font-medium text-primary">{cite}</p>
      </div>
    </aside>
  );
}

/** The platform page each learn link opens. */
const LEARN_HREF: Readonly<Record<LearnLink, "/training/nis2-ceo">> = {
  ceo_course: "/training/nis2-ceo",
};

export function Learn({ item, entry }: { item: ItemView; entry: Of<"learn"> }) {
  const { link } = entry.screen;
  return (
    <>
      {item.image && (
        <div className="mb-8 flex h-44 items-end justify-center overflow-hidden rounded-3xl bg-primary/[0.06] sm:h-52">
          <Art src={item.image} className="h-40 translate-y-2 sm:h-48" />
        </div>
      )}
      <Heading>{entry.copy.title}</Heading>
      <div className="mt-5 max-w-[62ch] space-y-4 text-[17px] leading-8 text-foreground/85">
        {entry.copy.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      {link && entry.copy.link && (
        <Link
          href={LEARN_HREF[link]}
          target="_blank"
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-primary/30 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/[0.04]"
        >
          <GraduationCap className="size-4" />
          {entry.copy.link}
          <ExternalLink className="size-3.5" />
        </Link>
      )}
      <Duty text={entry.copy.duty} cite={item.duty} />
    </>
  );
}

export function Prepare({ entry }: { entry: Of<"prepare"> }) {
  return (
    <>
      <Heading>{entry.copy.title}</Heading>
      <Lead>{entry.copy.lead}</Lead>
      <ol className="mt-8 divide-y overflow-hidden rounded-2xl border bg-card shadow-sm">
        {entry.copy.items.map((line, i) => (
          <li key={line.name} className="flex gap-4 px-5 py-4">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold tabular-nums">
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="font-semibold">{line.name}</p>
              <p className="text-sm text-muted-foreground">{line.detail}</p>
            </div>
          </li>
        ))}
      </ol>
      <Source>{entry.copy.source}</Source>
    </>
  );
}

/** One half of a do and don't pair: the value itself, and why. */
function Specimen({
  tone,
  value,
  note,
}: {
  tone: "good" | "bad";
  value: string;
  note: string;
}) {
  const t = useTranslations("durchgang.ui");
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
        {good ? t("good") : t("bad")}
      </p>
      <p
        className={cn(
          "mt-3 rounded-lg border bg-background px-3 py-2.5 text-sm break-words",
          !good && "text-muted-foreground line-through decoration-red-500/60",
        )}
      >
        {value}
      </p>
      <p className="mt-3 text-sm leading-6 text-foreground/80">{note}</p>
    </div>
  );
}

export function Compare({ entry }: { entry: Of<"compare"> }) {
  return (
    <>
      <Heading>{entry.copy.title}</Heading>
      <div className="mt-8">
        <p className="text-sm font-medium text-muted-foreground">{entry.copy.caption}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Specimen
            tone="good"
            value={entry.copy.good.value}
            note={entry.copy.good.note}
          />
          <Specimen tone="bad" value={entry.copy.bad.value} note={entry.copy.bad.note} />
        </div>
      </div>
    </>
  );
}

export function Sample({ entry }: { entry: Of<"sample"> }) {
  const t = useTranslations("durchgang.ui");
  return (
    <>
      <Heading>{entry.copy.title}</Heading>
      <p className="mt-8 text-sm font-medium text-muted-foreground">
        {entry.copy.caption}
      </p>
      <div className="mt-4 overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] border-b bg-muted/40 px-5 py-2.5 text-xs font-medium text-muted-foreground">
          <span>{t("sampleWhat")}</span>
          <span>{t("sampleDetail")}</span>
        </div>
        {entry.copy.rows.map((row) => (
          <div
            key={row.name}
            className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] border-b px-5 py-3.5 text-sm last:border-b-0"
          >
            <span className="font-medium">{row.name}</span>
            <span className="text-muted-foreground">{row.detail}</span>
          </div>
        ))}
      </div>
      {entry.copy.note && (
        <p className="mt-5 max-w-[62ch] rounded-xl bg-muted/60 p-4 text-sm leading-6">
          {entry.copy.note}
        </p>
      )}
    </>
  );
}

/**
 * Several risks read off the matrix, low to very high. The person picks one and the matrix lights
 * its cell; each level is computed from the example's two ratings, never written in the copy.
 */
export function Reading({ item, entry }: { item: ItemView; entry: Of<"reading"> }) {
  const t = useTranslations("durchgang.ui.matrix");
  const [chosen, setChosen] = useState(0);
  const matrix = useRef<HTMLDivElement>(null);
  /** On a phone the matrix sits below the cards, so a pick brings it into view. */
  const pick = (i: number) => {
    setChosen(i);
    matrix.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };
  const examples = entry.screen.examples.map((e, i) => ({
    ...e,
    level: riskLevel(e.frequency, e.impact),
    text: entry.copy.examples[i] ?? "",
  }));
  const current = examples[chosen] ?? examples[0];
  if (!current) return null;
  return (
    <>
      <Heading>{entry.copy.title}</Heading>
      <Lead>{entry.copy.caption}</Lead>
      <div className="mt-8 space-y-6">
        <ul className="grid gap-2 sm:grid-cols-2" aria-label={entry.copy.title}>
          {examples.map((e, i) => (
            <li key={e.text}>
              <button
                type="button"
                aria-pressed={i === chosen}
                onClick={() => pick(i)}
                className={cn(
                  "h-full w-full rounded-xl border bg-card p-3.5 text-left text-sm leading-6 transition-colors",
                  i === chosen ? "border-primary bg-primary/[0.04]" : "hover:bg-muted/50",
                )}
              >
                <span
                  className={cn(
                    "mb-1.5 inline-block rounded-full px-2 py-0.5 text-xs font-semibold",
                    LEVEL_FILL[e.level],
                  )}
                >
                  {RISK_LEVEL_TEXT[item.locale][e.level].label}
                </span>
                <span className="block">{e.text}</span>
              </button>
            </li>
          ))}
        </ul>
        <div ref={matrix} className="scroll-mb-28">
          <div className="rounded-3xl border bg-card p-4 shadow-sm sm:p-6">
            <RiskMatrix
              locale={item.locale}
              highlight={{ frequency: current.frequency, impact: current.impact }}
            />
          </div>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground">
            {t("reading", {
              frequency: FREQUENCY_TEXT[item.locale][current.frequency].label,
              impact: IMPACT_TEXT[item.locale][current.impact].label,
              level: RISK_LEVEL_TEXT[item.locale][current.level].label,
            })}
          </p>
        </div>
      </div>
    </>
  );
}

export function Provision({ item, entry }: { item: ItemView; entry: Of<"provision"> }) {
  const shown = (() => {
    switch (entry.screen.provision) {
      case "bsi_200_3_matrix":
        return (
          <div className="rounded-3xl border bg-card p-4 shadow-sm sm:p-6">
            <RiskMatrix locale={item.locale} />
          </div>
        );
      case "bsig_32_clock":
        return <ReportingClock locale={item.locale} />;
      case "bsig_28_thresholds":
        return <SizeThresholds />;
      case "registration_portals":
        return (
          <RegistrationPortals registration={item.registration} locale={item.locale} />
        );
      default:
        return entry.screen.provision satisfies never;
    }
  })();
  return (
    <>
      <Heading>{entry.copy.title}</Heading>
      <Lead>{entry.copy.lead}</Lead>
      <div className="mt-8">{shown}</div>
      <Source>{entry.copy.source}</Source>
    </>
  );
}
