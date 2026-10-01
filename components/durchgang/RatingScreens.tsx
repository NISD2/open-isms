"use client";

import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  FREQUENCIES,
  FREQUENCY_TEXT,
  IMPACT_TEXT,
  IMPACTS,
  RISK_LEVEL_TEXT,
  type RiskLevel,
} from "@/lib/compliance/bsi-200-3";
import {
  levelOf,
  type Rating,
  type RatingRow,
  type RatingTarget,
  ratingRows,
  sliceOf,
} from "@/lib/durchgang";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { type Draft, fullRating, type Specified } from "./draft";
import { Heading, Lead } from "./ExplainScreens";
import { LEVEL_FILL, RiskMatrix } from "./RiskMatrix";
import type { Of, WorkProps } from "./WorkScreens";

function Quiet({ children }: { children: string }) {
  return <p className="mt-8 text-muted-foreground">{children}</p>;
}

/** 2.2: each listed thing gets the name the company knows it by, and who provides it. */
export function Specify({ draft, onDraft, entry }: WorkProps & { entry: Of<"specify"> }) {
  const t = useTranslations("durchgang.ui.specify");
  const assets = trpc.asset.list.useQuery();
  const suppliers = trpc.supplier.list.useQuery();
  const providerOf = new Map((suppliers.data ?? []).map((s) => [s.id, s.name]));
  const rows = (assets.data ?? []).filter((a) => sliceOf(a.type) === entry.screen.slice);
  const listId = `providers-${entry.screen.id}`;

  const shown = (row: (typeof rows)[number]): Specified =>
    draft.specified[row.id] ?? {
      name: row.name,
      provider: row.supplierId ? (providerOf.get(row.supplierId) ?? "") : "",
    };
  const edit = (row: (typeof rows)[number], change: Partial<Specified>) =>
    onDraft({
      ...draft,
      specified: { ...draft.specified, [row.id]: { ...shown(row), ...change } },
    });

  return (
    <>
      <Heading>{entry.copy.title}</Heading>
      <Lead>{entry.copy.lead}</Lead>
      <datalist id={listId}>
        {(suppliers.data ?? []).map((s) => (
          <option key={s.id} value={s.name} />
        ))}
      </datalist>
      {assets.data === undefined ? null : rows.length === 0 ? (
        <Quiet>{t("empty")}</Quiet>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="hidden grid-cols-2 gap-4 border-b bg-muted/40 px-5 py-2.5 text-xs font-medium text-muted-foreground sm:grid">
            <span>{t("what")}</span>
            <span>{t("provider")}</span>
          </div>
          <ul className="divide-y">
            {rows.map((row) => {
              const value = shown(row);
              return (
                <li key={row.id} className="grid gap-3 px-5 py-4 sm:grid-cols-2 sm:gap-4">
                  <div className="min-w-0">
                    <Label
                      htmlFor={`what-${row.id}`}
                      className="mb-1.5 text-xs text-muted-foreground sm:sr-only"
                    >
                      {t("what")}
                    </Label>
                    <Input
                      id={`what-${row.id}`}
                      value={value.name}
                      onChange={(e) => edit(row, { name: e.target.value })}
                    />
                    {row.description && (
                      <p className="mt-1.5 line-clamp-1 text-xs text-muted-foreground">
                        {row.description}
                      </p>
                    )}
                  </div>
                  <div className="min-w-0">
                    <Label
                      htmlFor={`provider-${row.id}`}
                      className="mb-1.5 text-xs text-muted-foreground sm:sr-only"
                    >
                      {t("provider")}
                    </Label>
                    <Input
                      id={`provider-${row.id}`}
                      list={listId}
                      value={value.provider}
                      placeholder={t("inHouse")}
                      onChange={(e) => edit(row, { provider: e.target.value })}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <p className="mt-4 max-w-[60ch] text-sm text-muted-foreground">{t("hint")}</p>
    </>
  );
}

/** The rows of a rating screen, from the same queries the risk and supplier pages read. */
export function useRatingRows(
  target: RatingTarget | null,
): readonly RatingRow[] | undefined {
  const onAssets = target === "software" || target === "technology";
  const assets = trpc.asset.list.useQuery(undefined, { enabled: target !== null });
  const suppliers = trpc.supplier.list.useQuery(undefined, { enabled: target !== null });
  const assetRisks = trpc.risk.listWithAssets.useQuery(undefined, { enabled: onAssets });
  const supplierRisks = trpc.risk.listWithSuppliers.useQuery(undefined, {
    enabled: target === "suppliers",
  });
  const risks = onAssets ? assetRisks.data : supplierRisks.data;
  if (!target || !assets.data || !suppliers.data || !risks) return undefined;
  return ratingRows(target, {
    assets: assets.data,
    suppliers: suppliers.data,
    assetRisks: (assetRisks.data ?? []).map((r) => ({
      id: r.id,
      likelihood: r.likelihood,
      impact: r.impact,
      linked: r.riskAssets.map((l) => l.assetId),
    })),
    supplierRisks: (supplierRisks.data ?? []).map((r) => ({
      id: r.id,
      likelihood: r.likelihood,
      impact: r.impact,
      linked: r.riskSuppliers.map((l) => l.supplierId),
    })),
  });
}

/** The rating a row shows: what was chosen on this visit, else what is stored. */
const chosen = (row: RatingRow, draft: Draft): Partial<Rating> =>
  draft.ratings[row.key] ?? (row.standing.kind === "rated" ? row.standing.rating : {});

/** Whether a row needs nothing more: rated now, rated before, or worked on in the register. */
export const rowSettled = (row: RatingRow, draft: Draft): boolean =>
  row.standing.kind === "kept" || fullRating(chosen(row, draft)) !== null;

export function LevelChip({ level, locale }: { level: RiskLevel; locale: "de" | "en" }) {
  return (
    <span
      className={cn(
        "inline-flex h-9 min-w-24 items-center justify-center rounded-md px-3 text-sm font-semibold",
        LEVEL_FILL[level],
      )}
    >
      {RISK_LEVEL_TEXT[locale][level].label}
    </span>
  );
}

/** The two scales in the BSI's words, always in view: a label alone is too vague to rate by. */
function Scales({ locale }: { locale: "de" | "en" }) {
  const t = useTranslations("durchgang.ui.rate");
  const scale = (
    title: string,
    lines: ReadonlyArray<{ readonly label: string; readonly description: string }>,
  ) => (
    <div>
      <p className="text-sm font-semibold">{title}</p>
      <dl className="mt-2 space-y-1.5 text-sm">
        {lines.map((line) => (
          <div key={line.label} className="grid gap-x-3 sm:grid-cols-[9.5rem_1fr]">
            <dt className="font-medium">{line.label}</dt>
            <dd className="text-muted-foreground">{line.description}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
  return (
    <div className="mt-8 grid gap-6 rounded-2xl border bg-muted/30 p-5 md:grid-cols-2">
      {scale(
        t("frequency"),
        FREQUENCIES.map((f) => FREQUENCY_TEXT[locale][f]),
      )}
      {scale(
        t("impact"),
        IMPACTS.map((i) => IMPACT_TEXT[locale][i]),
      )}
    </div>
  );
}

/** 2.3: each listed asset or supplier rated on the two 200-3 scales; the matrix gives the level. */
export function Rate({ item, draft, onDraft, entry }: WorkProps & { entry: Of<"rate"> }) {
  const t = useTranslations("durchgang.ui.rate");
  const rows = useRatingRows(entry.screen.targets);
  const locale = item.locale;

  const set = (row: RatingRow, change: Partial<Rating>) =>
    onDraft({
      ...draft,
      ratings: {
        ...draft.ratings,
        [row.key]: { ...chosen(row, draft), ...change, kind: row.kind, id: row.id },
      },
    });

  const detail = (row: RatingRow) =>
    row.kind === "asset"
      ? row.provider && t("providedBy", { name: row.provider })
      : row.provides.length > 0 && t("provides", { names: row.provides.join(", ") });

  return (
    <>
      <Heading>{entry.copy.title}</Heading>
      <Lead>{entry.copy.lead}</Lead>
      <Scales locale={locale} />
      <details className="group mt-4">
        <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-primary">
          <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
          {t("matrix")}
        </summary>
        <div className="mt-4">
          <RiskMatrix locale={locale} />
        </div>
      </details>
      {rows === undefined ? null : rows.length === 0 ? (
        <Quiet>{t("empty")}</Quiet>
      ) : (
        <ul className="mt-8 divide-y overflow-hidden rounded-2xl border bg-card shadow-sm">
          {rows.map((row) => {
            const value = chosen(row, draft);
            const rating = fullRating(value);
            const about = detail(row);
            return (
              <li
                key={row.key}
                className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-6"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{row.name}</p>
                  {about && (
                    <p className="truncate text-sm text-muted-foreground">{about}</p>
                  )}
                </div>
                {row.standing.kind === "kept" ? (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {t("kept", { count: row.standing.count })}
                    </span>
                    {row.standing.highest && (
                      <LevelChip level={row.standing.highest} locale={locale} />
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <NativeSelect
                      aria-label={`${t("frequency")}: ${row.name}`}
                      value={value.frequency ?? ""}
                      onChange={(e) => {
                        const frequency = FREQUENCIES.find((f) => f === e.target.value);
                        if (frequency) set(row, { frequency });
                      }}
                      className="min-w-36"
                    >
                      <NativeSelectOption value="" disabled>
                        {t("frequencyShort")}
                      </NativeSelectOption>
                      {FREQUENCIES.map((f) => (
                        <NativeSelectOption key={f} value={f}>
                          {FREQUENCY_TEXT[locale][f].label}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                    <NativeSelect
                      aria-label={`${t("impact")}: ${row.name}`}
                      value={value.impact ?? ""}
                      onChange={(e) => {
                        const impact = IMPACTS.find((i) => i === e.target.value);
                        if (impact) set(row, { impact });
                      }}
                      className="min-w-36"
                    >
                      <NativeSelectOption value="" disabled>
                        {t("impactShort")}
                      </NativeSelectOption>
                      {IMPACTS.map((i) => (
                        <NativeSelectOption key={i} value={i}>
                          {IMPACT_TEXT[locale][i].label}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                    {rating ? (
                      <LevelChip level={levelOf(rating)} locale={locale} />
                    ) : (
                      <span className="inline-flex h-9 min-w-24 items-center justify-center rounded-md border border-dashed px-3 text-sm text-muted-foreground">
                        {t("open")}
                      </span>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
