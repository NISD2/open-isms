"use client";

import { useTranslations } from "next-intl";
import type { RiskLevel } from "@/lib/compliance/bsi-200-3";
import { byLevel, levelOfStanding, type RatingRow, signsIn } from "@/lib/durchgang";
import { trpc } from "@/lib/trpc/client";
import type { Draft } from "./draft";
import { Heading, Lead } from "./ExplainScreens";
import { useRatingRows } from "./RatingScreens";
import { RowLevel, Toggle } from "./RowParts";
import type { Of, WorkProps } from "./WorkScreens";

/** A program or remote access as 11.1 shows it: its rating from 2.3 and its stored mark. */
export interface LoginRow {
  readonly id: string;
  readonly name: string;
  readonly provider: string | null;
  readonly level: RiskLevel | null;
  readonly stored: boolean;
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
      return row.kind === "asset" && a && signsIn(a.type)
        ? [
            {
              id: row.id,
              name: row.name,
              provider: row.provider,
              level: levelOfStanding(row.standing),
              stored: Boolean(a.hasMfa),
            },
          ]
        : [];
    })
    .sort(byLevel);
}

/**
 * The answer a row shows: what was chosen on this visit, else what is stored. A stored "no" shows
 * no answer, because the column cannot tell "password only" from "never asked"; the item's trail
 * keeps that record.
 */
export const mfaOf = (row: LoginRow, draft: Draft): boolean | null =>
  draft.logins[row.id] ?? (row.stored ? true : null);

/** 11.1: per program and remote access, whether signing in takes a second factor. */
export function Logins({
  item,
  draft,
  onDraft,
  entry,
}: WorkProps & { entry: Of<"logins"> }) {
  const t = useTranslations("durchgang.ui");
  const rows = useLoginRows(true);

  const set = (row: LoginRow, mfa: boolean) =>
    onDraft({ ...draft, logins: { ...draft.logins, [row.id]: mfa } });

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
            return (
              <li
                key={row.id}
                className="grid gap-3 px-5 py-4 lg:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] lg:items-center lg:gap-6"
              >
                <div className="flex min-w-0 items-center gap-3 lg:flex-col lg:items-start lg:gap-1.5">
                  <div className="min-w-0 flex-1 lg:flex-none">
                    <p className="font-medium break-words">{row.name}</p>
                    {row.provider && (
                      <p className="text-sm break-words text-muted-foreground">
                        {t("rate.providedBy", { name: row.provider })}
                      </p>
                    )}
                  </div>
                  <RowLevel level={row.level} locale={item.locale} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Toggle on={mfa === true} onClick={() => set(row, true)}>
                    {entry.copy.mfa}
                  </Toggle>
                  <Toggle on={mfa === false} onClick={() => set(row, false)}>
                    {entry.copy.password}
                  </Toggle>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
