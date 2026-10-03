"use client";

import { useTranslations } from "next-intl";
import type { RiskLevel } from "@/lib/compliance/bsi-200-3";
import {
  asksSecondFactor,
  byLevel,
  levelOfStanding,
  MFA_METHODS,
  type MfaMethod,
  type RatingRow,
} from "@/lib/durchgang";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import type { Draft } from "./draft";
import { Heading, Lead } from "./ExplainScreens";
import { useRatingRows } from "./RatingScreens";
import { RowLevel, Toggle } from "./RowParts";
import type { Of, WorkProps } from "./WorkScreens";

/**
 * A program or remote access as 11.1 shows it: its rating from 2.3 and its stored mark, where
 * null means nobody knows yet.
 */
export interface LoginRow {
  readonly id: string;
  readonly name: string;
  readonly providers: readonly string[];
  readonly level: RiskLevel | null;
  readonly stored: boolean | null;
  /** The kind of second factor stored for it, where one is. */
  readonly storedMethod: MfaMethod | null;
}

/**
 * Everything on the list people sign in to, from the same queries 2.3 and the asset page read,
 * highest rated first, so the sign-ins that matter most are answered first.
 */
export function useLoginRows(enabled: boolean): readonly LoginRow[] | undefined {
  const software = useRatingRows(enabled ? "software" : null);
  const technology = useRatingRows(enabled ? "technology" : null);
  const assets = trpc.asset.list.useQuery(undefined, { enabled });
  if (!software || !technology || !assets.data) return undefined;
  const stored = new Map(assets.data.map((a) => [a.id, a]));
  return [...software, ...technology]
    .flatMap((row: RatingRow) => {
      const a = stored.get(row.id);
      return row.kind === "asset" && a && asksSecondFactor(a)
        ? [
            {
              id: row.id,
              name: row.name,
              providers: row.providers,
              level: levelOfStanding(row.standing),
              stored: a.hasMfa,
              storedMethod: a.mfaMethod,
            },
          ]
        : [];
    })
    .sort(byLevel);
}

/**
 * The answer a row shows: what was chosen on this visit, else what is stored. A row never asked
 * holds the column's default, no, and so shows "password only", the safe assumption; null is
 * "not known yet".
 */
export const mfaOf = (row: LoginRow, draft: Draft): boolean | null =>
  Object.hasOwn(draft.logins, row.id) ? (draft.logins[row.id] ?? null) : row.stored;

/** The kind of second factor a row shows: chosen on this visit, else stored; none without one. */
export const methodOf = (row: LoginRow, draft: Draft): MfaMethod | null =>
  mfaOf(row, draft) !== true
    ? null
    : Object.hasOwn(draft.methods, row.id)
      ? (draft.methods[row.id] ?? null)
      : row.storedMethod;

/**
 * 11.1: per program and remote access, whether signing in takes a second factor, or that it is not
 * known yet. Every row starts with an answer, so the screen is never blocked.
 */
export function Logins({
  item,
  draft,
  onDraft,
  entry,
}: WorkProps & { entry: Of<"logins"> }) {
  const t = useTranslations("durchgang.ui");
  const rows = useLoginRows(true);

  const set = (row: LoginRow, mfa: boolean | null) =>
    onDraft({ ...draft, logins: { ...draft.logins, [row.id]: mfa } });
  const setMethod = (row: LoginRow, method: MfaMethod | null) =>
    onDraft({ ...draft, methods: { ...draft.methods, [row.id]: method } });

  return (
    <>
      <Heading>{entry.copy.title}</Heading>
      <Lead>{entry.copy.lead}</Lead>
      {rows === undefined ? null : rows.length === 0 ? (
        <p className="mt-8 text-muted-foreground">{t("logins.empty")}</p>
      ) : (
        <ul className="mt-8 divide-y overflow-hidden rounded-2xl border bg-card shadow-sm">
          {rows.map((row) => {
            const mfa = mfaOf(row, draft);
            const method = methodOf(row, draft);
            return (
              <li
                key={row.id}
                className="grid gap-3 px-5 py-4 lg:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] lg:items-center lg:gap-6"
              >
                <div className="flex min-w-0 items-center gap-3 lg:flex-col lg:items-start lg:gap-1.5">
                  <div className="min-w-0 flex-1 lg:flex-none">
                    <p className="font-medium break-words">{row.name}</p>
                    {row.providers.length > 0 && (
                      <p className="text-sm break-words text-muted-foreground">
                        {t("rate.providedBy", { name: row.providers.join(", ") })}
                      </p>
                    )}
                  </div>
                  <RowLevel level={row.level} locale={item.locale} />
                </div>
                <div className="space-y-2.5">
                  <div className="flex flex-wrap gap-2">
                    <Toggle on={mfa === true} onClick={() => set(row, true)}>
                      {entry.copy.mfa}
                    </Toggle>
                    <Toggle on={mfa === false} onClick={() => set(row, false)}>
                      {entry.copy.password}
                    </Toggle>
                    <Toggle on={mfa === null} onClick={() => set(row, null)}>
                      {entry.copy.unknown}
                    </Toggle>
                  </div>
                  {mfa === true && (
                    <fieldset className="flex flex-wrap items-center gap-1.5">
                      <legend className="sr-only">{entry.copy.which}</legend>
                      <span className="text-xs text-muted-foreground">
                        {entry.copy.which}
                      </span>
                      {MFA_METHODS.map((m) => (
                        <button
                          key={m}
                          type="button"
                          aria-pressed={method === m}
                          onClick={() => setMethod(row, method === m ? null : m)}
                          className={cn(
                            "cursor-pointer rounded-full border px-2.5 py-1 text-xs transition-colors",
                            method === m
                              ? "border-primary bg-primary/[0.06] text-foreground"
                              : "text-muted-foreground hover:border-primary/40 hover:text-foreground",
                          )}
                        >
                          {entry.copy.methods[m]}
                        </button>
                      ))}
                    </fieldset>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
