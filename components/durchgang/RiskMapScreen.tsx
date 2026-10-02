"use client";

import { useTranslations } from "next-intl";
import { Fragment, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  cellCount,
  inCell,
  levelGroups,
  levelOf,
  levelOfStanding,
  type MappedRisk,
  type RatingRow,
} from "@/lib/durchgang";
import { type Draft, fullRating } from "./draft";
import { Heading, Lead } from "./ExplainScreens";
import { LevelChip, RateRow, useRatingRows } from "./RatingScreens";
import { RiskMatrix } from "./RiskMatrix";
import { RowLevel } from "./RowParts";
import type { Of, WorkProps } from "./WorkScreens";

/** A row as the map places it: the rating chosen on this visit, else the stored one. */
const mapped = (row: RatingRow, draft: Draft): MappedRisk => {
  const fresh = fullRating(draft.ratings[row.key]);
  const rating = fresh ?? (row.standing.kind === "rated" ? row.standing.rating : null);
  return {
    key: row.key,
    name: row.name,
    rating,
    level: rating ? levelOf(rating) : levelOfStanding(row.standing),
  };
};

/** Every listed asset and supplier, from the same queries the rating screens read. */
function useAllRows(): readonly RatingRow[] | undefined {
  const software = useRatingRows("software");
  const technology = useRatingRows("technology");
  const suppliers = useRatingRows("suppliers");
  if (!software || !technology || !suppliers) return undefined;
  return [...software, ...technology, ...suppliers];
}

/** Names that open their row to re-rate, comma separated so the list still reads on paper. */
function Names({
  risks,
  onOpen,
}: {
  risks: readonly MappedRisk[];
  onOpen: (keys: readonly string[]) => void;
}) {
  return (
    <p className="text-sm leading-7">
      {risks.map((risk, i) => (
        <Fragment key={risk.key}>
          {i > 0 && ", "}
          <button
            type="button"
            onClick={() => onOpen([risk.key])}
            className="cursor-pointer underline decoration-muted-foreground/40 decoration-dotted underline-offset-4 hover:text-primary hover:decoration-primary"
          >
            {risk.name}
          </button>
        </Fragment>
      ))}
    </p>
  );
}

/**
 * The company's own picture: each rated asset and supplier counted in its cell of the 200-3
 * matrix, then every one by level, highest first, so the names read on paper too. A name or a
 * filled cell opens its rows in a sheet to re-rate in place; the map behind follows each pick.
 */
export function RiskMapScreen({
  item,
  draft,
  onDraft,
  entry,
}: WorkProps & { entry: Of<"riskmap"> }) {
  const t = useTranslations("durchgang.ui.riskmap");
  const rows = useAllRows();
  // The rows the sheet holds, fixed when it opens, so a re-rated row stays in view.
  const [open, setOpen] = useState<readonly string[]>([]);
  if (rows === undefined) return null;
  const risks = rows.map((row) => mapped(row, draft));
  const groups = levelGroups(risks);
  const several = risks.filter((r) => r.rating === null && r.level !== null).length;
  const unrated = risks.filter((r) => r.level === null);
  const editing = open.flatMap((key) => rows.find((r) => r.key === key) ?? []);

  return (
    <>
      <Heading>{entry.copy.title}</Heading>
      <Lead>{entry.copy.lead}</Lead>
      {groups.length === 0 ? (
        <p className="mt-8 text-muted-foreground">{t("empty")}</p>
      ) : (
        <>
          <div className="mt-8">
            <RiskMatrix
              locale={item.locale}
              counts={(frequency, impact) => cellCount(risks, frequency, impact)}
              onCell={(frequency, impact) =>
                setOpen(inCell(risks, frequency, impact).map((r) => r.key))
              }
            />
          </div>
          <section className="mt-8 overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b bg-muted/40 px-5 py-3">
              <p className="text-sm font-medium">{t("byLevel")}</p>
              <p className="text-xs text-muted-foreground">{t("editHint")}</p>
            </div>
            <ul className="divide-y">
              {groups.map((group) => (
                <li
                  key={group.level}
                  className="grid gap-2 px-5 py-4 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-start sm:gap-4"
                >
                  <LevelChip level={group.level} locale={item.locale} />
                  <Names risks={group.risks} onOpen={setOpen} />
                </li>
              ))}
              {unrated.length > 0 && (
                <li className="grid gap-2 px-5 py-4 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-start sm:gap-4">
                  <RowLevel level={null} locale={item.locale} />
                  <Names risks={unrated} onOpen={setOpen} />
                </li>
              )}
            </ul>
          </section>
          {several > 0 && (
            <p className="mt-3 text-sm text-muted-foreground">
              {t("several", { count: several })}
            </p>
          )}
        </>
      )}
      <Sheet open={editing.length > 0} onOpenChange={(next) => !next && setOpen([])}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{t("sheetTitle", { count: editing.length })}</SheetTitle>
            <SheetDescription>{t("sheetDescription")}</SheetDescription>
          </SheetHeader>
          <ul className="mx-4 divide-y overflow-hidden rounded-2xl border bg-card">
            {editing.map((row) => (
              <li key={row.key} className="px-4 py-4">
                <RateRow row={row} draft={draft} onDraft={onDraft} locale={item.locale} />
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>
    </>
  );
}
