"use client";

import { useTranslations } from "next-intl";
import {
  cellCount,
  levelGroups,
  levelOf,
  levelOfStanding,
  type MappedRisk,
  type RatingRow,
} from "@/lib/durchgang";
import { type Draft, fullRating } from "./draft";
import { Heading, Lead } from "./ExplainScreens";
import { LevelChip, useRatingRows } from "./RatingScreens";
import { RiskMatrix } from "./RiskMatrix";
import { RowLevel } from "./RowParts";
import type { Of, WorkProps } from "./WorkScreens";

/** A row as the map places it: the rating chosen on this visit, else the stored one. */
const mapped = (row: RatingRow, draft: Draft): MappedRisk => {
  const fresh = fullRating(draft.ratings[row.key]);
  const rating = fresh ?? (row.standing.kind === "rated" ? row.standing.rating : null);
  return {
    name: row.name,
    rating,
    level: rating ? levelOf(rating) : levelOfStanding(row.standing),
  };
};

/** Every listed asset and supplier, from the same queries the rating screens read. */
function useMappedRisks(draft: Draft): readonly MappedRisk[] | undefined {
  const software = useRatingRows("software");
  const technology = useRatingRows("technology");
  const suppliers = useRatingRows("suppliers");
  if (!software || !technology || !suppliers) return undefined;
  return [...software, ...technology, ...suppliers].map((row) => mapped(row, draft));
}

/**
 * The company's own picture: each rated asset and supplier counted in its cell of the 200-3
 * matrix, then every one by level, highest first, so the names read on paper too.
 */
export function RiskMapScreen({
  item,
  draft,
  entry,
}: WorkProps & { entry: Of<"riskmap"> }) {
  const t = useTranslations("durchgang.ui.riskmap");
  const risks = useMappedRisks(draft);
  if (risks === undefined) return null;
  const groups = levelGroups(risks);
  const several = risks.filter((r) => r.rating === null && r.level !== null).length;
  const unrated = risks.filter((r) => r.level === null).map((r) => r.name);

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
            />
          </div>
          <section className="mt-8 overflow-hidden rounded-2xl border bg-card shadow-sm">
            <p className="border-b bg-muted/40 px-5 py-3 text-sm font-medium">
              {t("byLevel")}
            </p>
            <ul className="divide-y">
              {groups.map((group) => (
                <li
                  key={group.level}
                  className="grid gap-2 px-5 py-4 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-start sm:gap-4"
                >
                  <LevelChip level={group.level} locale={item.locale} />
                  <p className="text-sm leading-7">{group.names.join(", ")}</p>
                </li>
              ))}
              {unrated.length > 0 && (
                <li className="grid gap-2 px-5 py-4 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-start sm:gap-4">
                  <RowLevel level={null} locale={item.locale} />
                  <p className="text-sm leading-7 text-muted-foreground">
                    {unrated.join(", ")}
                  </p>
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
    </>
  );
}
