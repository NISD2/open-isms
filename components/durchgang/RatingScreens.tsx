"use client";

import {
  Building2,
  Check,
  ChevronDown,
  Cloud,
  Handshake,
  type LucideIcon,
  Plus,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  catalogIdOf,
  catalogLabel,
  nameKey,
  ownDescription,
} from "@/lib/asset-inventory/catalog-labels";
import { RISK_LEVEL_TEXT, type RiskLevel } from "@/lib/compliance/bsi-200-3";
import {
  asksHosting,
  hostingOf,
  levelOf,
  providersOf,
  type Rating,
  type RatingRow,
  type RatingTarget,
  ratingRows,
  sliceOf,
  type WalkLocale,
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
function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "inline-flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors",
        on
          ? "border-primary bg-primary/[0.06] text-foreground"
          : "text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
    >
      {on && <Check className="size-3" />}
      {children}
    </button>
  );
}

/** Two answers side by side, one of them chosen or neither yet; a tap picks one. */
function Choice<T extends string>({
  id,
  label,
  options,
  value,
  onChange,
}: {
  id: string;
  label: string;
  options: ReadonlyArray<{ value: T; label: string; icon: LucideIcon }>;
  value: T | null;
  onChange: (value: T) => void;
}) {
  return (
    <RadioGroup
      aria-label={label}
      value={value ?? ""}
      onValueChange={(next) => {
        const picked = options.find((o) => o.value === next);
        if (picked) onChange(picked.value);
      }}
      className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1"
    >
      {options.map((o) => (
        <Label
          key={o.value}
          htmlFor={`${id}-${o.value}`}
          className="flex min-h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground has-[[data-state=checked]]:bg-background has-[[data-state=checked]]:text-foreground has-[[data-state=checked]]:shadow-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
        >
          <RadioGroupItem id={`${id}-${o.value}`} value={o.value} className="sr-only" />
          <o.icon className="size-4" />
          {o.label}
        </Label>
      ))}
    </RadioGroup>
  );
}

/**
 * Who provides one thing: any number of suppliers, each a tap on or off, and a name of one's own
 * added with Enter.
 */
function Providers({
  id,
  listId,
  common,
  value,
  placeholder,
  onChange,
}: {
  id: string;
  listId: string;
  common: readonly string[];
  value: readonly string[];
  placeholder: string;
  onChange: (value: readonly string[]) => void;
}) {
  const [typed, setTyped] = useState("");
  const has = (name: string) => value.some((v) => nameKey(v) === nameKey(name));
  const toggle = (name: string) =>
    onChange(
      has(name) ? value.filter((v) => nameKey(v) !== nameKey(name)) : [...value, name],
    );
  const add = () => {
    const name = typed.trim();
    if (name && !has(name)) onChange([...value, name]);
    setTyped("");
  };
  const names = [...new Set([...value, ...common])];
  return (
    <div className="space-y-2">
      {names.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {names.map((name) => (
            <Chip key={nameKey(name)} on={has(name)} onClick={() => toggle(name)}>
              {name}
            </Chip>
          ))}
        </div>
      )}
      <Input
        id={id}
        list={listId}
        value={typed}
        placeholder={placeholder}
        className="h-9"
        onChange={(e) => setTyped(e.target.value)}
        onBlur={add}
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          e.preventDefault();
          add();
        }}
      />
    </div>
  );
}

/**
 * 2.2: each listed thing gets the name the company knows it by, what it is for there, and who
 * provides it. The catalogue item it was listed as stays under the name, so "Salesforce" still
 * reads as the CRM.
 */
export function Specify({
  item,
  draft,
  onDraft,
  entry,
}: WorkProps & { entry: Of<"specify"> }) {
  const t = useTranslations("durchgang.ui.specify");
  const utils = trpc.useUtils();
  const assets = trpc.asset.list.useQuery();
  const suppliers = trpc.supplier.list.useQuery();
  const links = trpc.durchgang.providers.useQuery();
  const another = trpc.durchgang.addAnotherAsset.useMutation({
    onSuccess: () => utils.asset.list.invalidate(),
  });
  const listed = suppliers.data ?? [];
  const rows = (assets.data ?? []).filter((a) => sliceOf(a.type) === entry.screen.slice);
  const storedOf = (id: string) => providersOf(id, links.data ?? [], listed);
  const listId = `providers-${entry.screen.id}`;
  // The providers already named on this screen first, then the rest of the list.
  const common = [
    ...new Set([...rows.flatMap((r) => storedOf(r.id)), ...listed.map((s) => s.name)]),
  ].slice(0, 5);

  // Rows where "A provider" was picked before any provider is named; on this visit only, since
  // a row with no provider reads as in house.
  const [external, setExternal] = useState<ReadonlySet<string>>(new Set());

  const shown = (row: (typeof rows)[number]): Specified =>
    draft.specified[row.id] ?? {
      name: row.name,
      description: ownDescription(row) ?? "",
      hosting: asksHosting(row.type) ? hostingOf(row) : null,
      providers: storedOf(row.id),
    };
  const edit = (row: (typeof rows)[number], change: Partial<Specified>) =>
    onDraft({
      ...draft,
      specified: { ...draft.specified, [row.id]: { ...shown(row), ...change } },
    });
  const keptBy = (row: (typeof rows)[number], who: "in_house" | "provider") => {
    setExternal((rowIds) =>
      who === "provider"
        ? new Set([...rowIds, row.id])
        : new Set([...rowIds].filter((rowId) => rowId !== row.id)),
    );
    if (who === "in_house") edit(row, { providers: [] });
  };

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
              const kind = catalogLabel(catalogIdOf(row), item.locale);
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
                    {kind && kind !== value.name.trim() && (
                      <p className="mt-1.5 line-clamp-1 text-xs text-muted-foreground">
                        {kind}
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
                  <div className="min-w-0 space-y-2">
                    <Label
                      htmlFor={`provider-${row.id}`}
                      className="mb-1.5 text-xs text-muted-foreground sm:sr-only"
                    >
                      {t("provider")}
                    </Label>
                    {asksHosting(row.type) ? (
                      <>
                        <Choice
                          id={`hosting-${row.id}`}
                          label={t("where")}
                          options={[
                            { value: "in_house", label: t("inHouse"), icon: Building2 },
                            { value: "cloud", label: t("cloud"), icon: Cloud },
                          ]}
                          value={value.hosting}
                          onChange={(hosting) => edit(row, { hosting })}
                        />
                        <Providers
                          id={`provider-${row.id}`}
                          listId={listId}
                          common={common}
                          value={value.providers}
                          placeholder={
                            value.hosting === "cloud" ? t("whoseCloud") : t("addProvider")
                          }
                          onChange={(providers) => edit(row, { providers })}
                        />
                      </>
                    ) : (
                      <>
                        <Choice
                          id={`kept-${row.id}`}
                          label={t("who")}
                          options={[
                            { value: "in_house", label: t("inHouse"), icon: Building2 },
                            {
                              value: "provider",
                              label: t("byProvider"),
                              icon: Handshake,
                            },
                          ]}
                          value={
                            value.providers.length > 0 || external.has(row.id)
                              ? "provider"
                              : "in_house"
                          }
                          onChange={(who) => keptBy(row, who)}
                        />
                        {(value.providers.length > 0 || external.has(row.id)) && (
                          <Providers
                            id={`provider-${row.id}`}
                            listId={listId}
                            common={common}
                            value={value.providers}
                            placeholder={t("addProvider")}
                            onChange={(providers) => edit(row, { providers })}
                          />
                        )}
                      </>
                    )}
                  </div>
                  <div className="min-w-0 sm:col-span-2">
                    <Label
                      htmlFor={`about-${row.id}`}
                      className="mb-1.5 text-xs text-muted-foreground"
                    >
                      {t("about")}
                    </Label>
                    <Input
                      id={`about-${row.id}`}
                      value={value.description}
                      maxLength={2000}
                      placeholder={t("aboutHint")}
                      onChange={(e) => edit(row, { description: e.target.value })}
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
  const links = trpc.durchgang.providers.useQuery(undefined, {
    enabled: target !== null,
  });
  const risks = onAssets ? assetRisks.data : supplierRisks.data;
  if (!target || !assets.data || !suppliers.data || !links.data || !risks)
    return undefined;
  return ratingRows(target, {
    assets: assets.data,
    suppliers: suppliers.data,
    links: links.data,
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

export function LevelChip({ level, locale }: { level: RiskLevel; locale: WalkLocale }) {
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
  locale: WalkLocale;
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
      ? [
          row.about ?? catalogLabel(row.catalogId, locale),
          row.providers.length > 0 && t("providedBy", { name: row.providers.join(", ") }),
        ]
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
          className="mt-3 h-9"
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
