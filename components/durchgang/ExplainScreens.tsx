"use client";

import {
  Activity,
  BellRing,
  BookText,
  CheckCircle2,
  ExternalLink,
  FileText,
  GraduationCap,
  Info,
  Repeat,
  ScrollText,
  XCircle,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type ReactNode, useRef, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import {
  FREQUENCY_TEXT,
  IMPACT_TEXT,
  RISK_LEVEL_TEXT,
  riskLevel,
} from "@/lib/compliance/bsi-200-3";
import { typesetCitation } from "@/lib/compliance/citations";
import type { LearnLink, ResolvedScreen } from "@/lib/durchgang";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { Art } from "./Art";
import { Glossed } from "./Glossed";
import { RegistrationPortals } from "./RegistrationPortals";
import { ReportingChannels } from "./ReportingChannels";
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
      {typeof children === "string" ? <Glossed text={children} /> : children}
    </p>
  );
}

/** Good to know, not needed to go on: one quiet line behind an info sign. */
export function Aside({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "flex max-w-[62ch] gap-2.5 text-sm leading-6 text-muted-foreground",
        className,
      )}
    >
      <Info className="mt-1 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

/** Where a BSI rule or a statute list comes from, in small type under it. */
export function Source({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 flex max-w-[62ch] gap-2 text-xs leading-5 text-muted-foreground">
      <BookText className="mt-0.5 size-3.5 shrink-0" />
      {typeof children === "string" ? typesetCitation(children) : children}
    </p>
  );
}

/**
 * The legal duty: a paragraph sign, one plain sentence, and the citation it rests on. The whole
 * card opens that provision.
 */
function Duty({ text, cite, href }: { text: string; cite: string; href: string }) {
  const t = useTranslations("durchgang.ui");
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group mt-10 flex max-w-[62ch] gap-4 rounded-2xl border border-primary/15 bg-primary/[0.04] p-5 transition-colors hover:border-primary/40 hover:bg-primary/[0.07]"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary font-serif text-xl text-primary-foreground">
        §
      </span>
      <div>
        <p className="text-sm font-semibold">{t("duty")}</p>
        <p className="mt-1 text-sm leading-6 text-foreground/80">{text}</p>
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary group-hover:underline">
          {cite}
          <ExternalLink className="size-3" />
        </p>
      </div>
    </a>
  );
}

/**
 * The page each learn link opens: a platform route, or a BSI landing page. BSI material is linked
 * at its landing page, never at the download, as the BSI's terms of use ask. A BSI page has an
 * English twin only where its English page lists the English editions; the others are German.
 */
const LEARN_HREF: Readonly<
  Record<
    LearnLink,
    | { readonly kind: "platform"; readonly href: "/training/nis2-ceo" }
    | { readonly kind: "bsi"; readonly de: string; readonly en: string }
  >
> = {
  ceo_course: { kind: "platform", href: "/training/nis2-ceo" },
  bsi_it_notfallkarte: {
    kind: "bsi",
    de: "https://www.bsi.bund.de/dok/13035678",
    en: "https://www.bsi.bund.de/dok/13035678",
  },
  bsi_tr_02102: {
    kind: "bsi",
    de: "https://www.bsi.bund.de/dok/TR-02102",
    en: "https://www.bsi.bund.de/EN/Themen/Unternehmen-und-Organisationen/Standards-und-Zertifizierung/Technische-Richtlinien/TR-nach-Thema-sortiert/tr02102/tr02102_node.html",
  },
  bsi_nis2_schulungen: {
    kind: "bsi",
    de: "https://www.bsi.bund.de/dok/nis-2-schulung-sensibilisierung",
    en: "https://www.bsi.bund.de/dok/nis-2-schulung-sensibilisierung",
  },
};

const LINK_STYLE =
  "mt-6 inline-flex items-center gap-2 rounded-xl border border-primary/30 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/[0.04]";

function LearnMore({ link, label }: { link: LearnLink; label: string }) {
  const locale = useLocale();
  const target = LEARN_HREF[link];
  return target.kind === "platform" ? (
    <Link href={target.href} target="_blank" className={LINK_STYLE}>
      <GraduationCap className="size-4" />
      {label}
      <ExternalLink className="size-3.5" />
    </Link>
  ) : (
    <a
      href={locale === "de" ? target.de : target.en}
      target="_blank"
      rel="noreferrer"
      className={LINK_STYLE}
    >
      <FileText className="size-4" />
      {label}
      <ExternalLink className="size-3.5" />
    </a>
  );
}

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
          <p key={paragraph}>
            <Glossed text={paragraph} />
          </p>
        ))}
      </div>
      {link && entry.copy.link && <LearnMore link={link} label={entry.copy.link} />}
      <Duty text={entry.copy.duty} cite={item.duty} href={item.dutyHref} />
    </>
  );
}

/**
 * What to have ready, numbered. Where the next step needs it, one large tick says the person has
 * it at hand; without it they go on through "Not possible yet".
 */
export function Prepare({
  entry,
  ready,
  onReady,
}: {
  entry: Of<"prepare">;
  ready: boolean;
  onReady: (ready: boolean) => void;
}) {
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
      {entry.screen.confirm && entry.copy.confirm && (
        <Label
          htmlFor="dg-ready"
          className="mt-6 flex cursor-pointer items-center gap-4 rounded-2xl border-2 p-5 text-base font-semibold transition-colors hover:border-primary/40 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/[0.05]"
        >
          <Checkbox
            id="dg-ready"
            className="size-6"
            checked={ready}
            onCheckedChange={(on) => onReady(on === true)}
          />
          {entry.copy.confirm}
        </Label>
      )}
      <Source>{entry.copy.source}</Source>
    </>
  );
}

/** The groups of ongoing duties in their fixed order, each with its sign. */
const ONGOING_ICONS = [BellRing, Repeat, Activity] as const;

/**
 * What the company does itself from now on, after management signed: grouped by when it
 * happens, each duty with what to do and what it rests on. Read only; the walk ends here.
 */
export function Ongoing({ entry }: { entry: Of<"ongoing"> }) {
  return (
    <>
      <Heading>{entry.copy.title}</Heading>
      <Lead>{entry.copy.lead}</Lead>
      <div className="mt-8 space-y-6">
        {entry.copy.groups.map((group, g) => {
          const Icon = ONGOING_ICONS[g] ?? Activity;
          return (
            <section key={group.title}>
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Icon className="size-4 text-primary" />
                {group.title}
              </h2>
              <ul className="mt-3 divide-y overflow-hidden rounded-2xl border bg-card shadow-sm">
                {group.items.map((line) => (
                  <li
                    key={line.name}
                    className="grid gap-1 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-6"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold">{line.name}</p>
                      <p className="text-sm text-muted-foreground">{line.detail}</p>
                    </div>
                    <p className="self-start text-xs text-muted-foreground sm:text-right">
                      {typesetCitation(line.basis)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
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

/** Do and don't, one pair per row; more pairs show more of what good looks like. */
export function Compare({ entry }: { entry: Of<"compare"> }) {
  const pairs = [
    { good: entry.copy.good, bad: entry.copy.bad },
    ...(entry.copy.more ?? []),
  ];
  return (
    <>
      <Heading>{entry.copy.title}</Heading>
      <div className="mt-8">
        <p className="text-sm font-medium text-muted-foreground">{entry.copy.caption}</p>
        <div className="mt-4 space-y-6">
          {pairs.map(({ good, bad }) => (
            <div key={good.value} className="grid gap-4 sm:grid-cols-2">
              <Specimen tone="good" value={good.value} note={good.note} />
              <Specimen tone="bad" value={bad.value} note={bad.note} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function Sample({ entry }: { entry: Of<"sample"> }) {
  const t = useTranslations("durchgang.ui");
  const beside = entry.screen.beside;
  const policies = trpc.durchgang.walkPolicies.useQuery(undefined, {
    enabled: beside !== undefined,
  });
  const own = (policies.data ?? []).find((p) => p.type === beside);
  return (
    <>
      <Heading>{entry.copy.title}</Heading>
      <p className="mt-8 text-sm font-medium text-muted-foreground">
        {entry.copy.caption}
      </p>
      <div className={cn("mt-4 grid gap-4", own && "lg:grid-cols-2 lg:items-start")}>
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
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
        {own && (
          <article className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <header className="flex items-center gap-3 border-b bg-muted/40 px-5 py-2.5">
              <ScrollText className="size-4 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground">
                {t("sampleBeside", { title: own.title })}
              </p>
            </header>
            <div
              className="prose prose-sm max-h-[32rem] max-w-none overflow-y-auto px-5 py-4 dark:prose-invert prose-h1:text-lg prose-h2:text-base"
              // Rendered on the server from the stored text, without raw HTML.
              // biome-ignore lint/security/noDangerouslySetInnerHtml: see above
              dangerouslySetInnerHTML={{ __html: own.html }}
            />
          </article>
        )}
      </div>
      {entry.copy.note && <Aside className="mt-5">{entry.copy.note}</Aside>}
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
                  "h-full w-full cursor-pointer rounded-xl border bg-card p-3.5 text-left text-sm leading-6 transition-colors",
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

/** A rule or list as it is, from the module that holds it. */
export function ProvisionView({
  item,
  provision,
}: {
  item: ItemView;
  provision: Of<"provision">["screen"]["provision"];
}) {
  switch (provision) {
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
    case "reporting_channels":
      return <ReportingChannels registration={item.registration} locale={item.locale} />;
    default:
      return provision satisfies never;
  }
}

export function Provision({ item, entry }: { item: ItemView; entry: Of<"provision"> }) {
  return (
    <>
      <Heading>{entry.copy.title}</Heading>
      <Lead>{entry.copy.lead}</Lead>
      <div className="mt-8">
        <ProvisionView item={item} provision={entry.screen.provision} />
      </div>
      <Source>{entry.copy.source}</Source>
    </>
  );
}
