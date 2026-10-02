"use client";

import { Check, ChevronDown, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RISK_LEVEL_TEXT, type RiskLevel } from "@/lib/compliance/bsi-200-3";
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
import { type Draft, fullRating, type RatingDraft, type Specified } from "./draft";
import { Heading, Lead } from "./ExplainScreens";
import { LEVEL_FILL, RiskMatrix, RiskPicker } from "./RiskMatrix";
import type { Of, WorkProps } from "./WorkScreens";

function Quiet({ children }: { children: string }) {
  return <p className="mt-8 text-muted-foreground">{children}</p>;
}

/** A row of answers of which one is chosen: a tap sets it, the field stays free to type in. */
function OneOf({
  items,
  value,
  onChange,
}: {
  items: ReadonlyArray<{ readonly label: string; readonly value: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {items.map((item) => {
        const on = item.value.trim().toLowerCase() === value.trim().toLowerCase();
        return (
          <button
            key={item.label}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(item.value)}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors",
              on
                ? "border-primary bg-primary/[0.06] text-foreground"
                : "text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {on && <Check className="size-3" />}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

/** 2.2: each listed thing gets the name the company knows it by, and who provides it. */
export function Specify({ draft, onDraft, entry }: WorkProps & { entry: Of<"specify"> }) {
  const t = useTranslations("durchgang.ui.specify");
  const utils = trpc.useUtils();
  const assets = trpc.asset.list.useQuery();
  const suppliers = trpc.supplier.list.useQuery();
  const another = trpc.durchgang.addAnotherAsset.useMutation({
    onSuccess: () => utils.asset.list.invalidate(),
  });
  const providerOf = new Map((suppliers.data ?? []).map((s) => [s.id, s.name]));
  const rows = (assets.data ?? []).filter((a) => sliceOf(a.type) === entry.screen.slice);
  const listId = `providers-${entry.screen.id}`;
  // Run in house, then the providers already named on this screen, then the rest of the list.
  const common = [
    { label: t("inHouse"), value: "" },
    ...[
      ...new Set([
        ...rows.flatMap((r) =>
          r.supplierId ? (providerOf.get(r.supplierId) ?? []) : [],
        ),
        ...(suppliers.data ?? []).map((s) => s.name),
      ]),
    ]
      .slice(0, 4)
      .map((name) => ({ label: name, value: name })),
  ];

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
                    <button
                      type="button"
                      disabled={another.isPending}
                      onClick={() => another.mutate({ id: row.id })}
                      className="mt-1.5 inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-primary hover:underline disabled:opacity-50"
                    >
                      <Plus className="size-3" />
                      {t("another")}
                    </button>
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
                    <OneOf
                      items={common}
                      value={value.provider}
                      onChange={(provider) => edit(row, { provider })}
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
      note: r.treatmentDescription,
      linked: r.riskAssets.map((l) => l.assetId),
    })),
    supplierRisks: (supplierRisks.data ?? []).map((r) => ({
      id: r.id,
      likelihood: r.likelihood,
      impact: r.impact,
      note: r.treatmentDescription,
      linked: r.riskSuppliers.map((l) => l.supplierId),
    })),
  });
}

/** The rating and note a row shows: what was chosen on this visit, else what is stored. */
const chosen = (row: RatingRow, draft: Draft): Partial<Rating> & { note?: string } =>
  draft.ratings[row.key] ??
  (row.standing.kind === "rated"
    ? { ...row.standing.rating, note: row.standing.note }
    : {});

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

/**
 * One thing to rate: its name and what it is, a small 200-3 matrix to pick the field in, the level
 * that follows, and a line for a note. A thing worked on in the risk register is shown, not rated.
 */
export function RateRow({
  row,
  draft,
  onDraft,
  locale,
}: {
  row: RatingRow;
  draft: Draft;
  onDraft: WorkProps["onDraft"];
  locale: "de" | "en";
}) {
  const t = useTranslations("durchgang.ui.rate");
  const value = chosen(row, draft);
  const rating = fullRating(value);
  const set = (change: Partial<RatingDraft>) =>
    onDraft({
      ...draft,
      ratings: {
        ...draft.ratings,
        [row.key]: { ...value, ...change, kind: row.kind, id: row.id },
      },
    });
  const about =
    row.kind === "asset"
      ? [row.kindOf, row.provider && t("providedBy", { name: row.provider })]
          .filter(Boolean)
          .join(" · ")
      : row.provides.length > 0 && t("provides", { names: row.provides.join(", ") });

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6">
        <div className="min-w-0">
          <p className="font-medium break-words">{row.name}</p>
          {about && <p className="text-sm text-muted-foreground">{about}</p>}
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
          <div className="flex items-center gap-4">
            <RiskPicker
              locale={locale}
              name={row.name}
              value={value}
              onPick={(frequency, impact) => set({ frequency, impact })}
            />
            {rating ? (
              <LevelChip level={levelOf(rating)} locale={locale} />
            ) : (
              <span className="inline-flex h-9 min-w-24 items-center justify-center rounded-md border border-dashed px-3 text-sm text-muted-foreground">
                {t("open")}
              </span>
            )}
          </div>
        )}
      </div>
      {row.standing.kind !== "kept" && (
        <Input
          aria-label={`${t("note")}: ${row.name}`}
          placeholder={t("notePlaceholder")}
          maxLength={1000}
          className="mt-3 h-9 text-sm"
          value={value.note ?? ""}
          onChange={(e) => set({ note: e.target.value })}
        />
      )}
    </>
  );
}

/**
 * 2.3: every listed asset or supplier on its own row, each rated by picking one field of a small
 * 200-3 matrix, with a line of its own for a note. The level follows from the field.
 */
export function Rate({ item, draft, onDraft, entry }: WorkProps & { entry: Of<"rate"> }) {
  const t = useTranslations("durchgang.ui.rate");
  const rows = useRatingRows(entry.screen.targets);
  const locale = item.locale;

  return (
    <>
      <Heading>{entry.copy.title}</Heading>
      <Lead>{entry.copy.lead}</Lead>
      <details className="group mt-4">
        <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-primary">
          <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
          {t("scales")}
        </summary>
        <div className="mt-4 rounded-3xl border bg-card p-4 shadow-sm sm:p-6">
          <RiskMatrix locale={locale} />
        </div>
      </details>
      {rows === undefined ? null : rows.length === 0 ? (
        <Quiet>{t("empty")}</Quiet>
      ) : (
        <ul className="mt-6 divide-y overflow-hidden rounded-2xl border bg-card shadow-sm">
          {rows.map((row) => (
            <li key={row.key} className="px-5 py-4">
              <RateRow row={row} draft={draft} onDraft={onDraft} locale={locale} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
