"use client";

import { useTranslations } from "next-intl";
import { RequestSupplierProfileButton } from "@/components/suppliers/RequestSupplierProfileButton";
import type { RiskLevel } from "@/lib/compliance/bsi-200-3";
import { byLevel, levelOfStanding, type RatingRow } from "@/lib/durchgang";
import { trpc } from "@/lib/trpc/client";
import type { Agreed, Draft } from "./draft";
import { Aside, Heading, Lead } from "./ExplainScreens";
import { useRatingRows } from "./RatingScreens";
import { RowLevel, Toggle } from "./RowParts";
import type { Of, WorkProps } from "./WorkScreens";

/** A supplier as 5.2 shows it: its rating from 2.3 and what is stored about its paper. */
export interface AgreementRow {
  readonly id: string;
  readonly name: string;
  readonly level: RiskLevel | null;
  readonly stored: Agreed;
  /** Whether 5.2 recorded this row before, so a stored "nothing agreed" is an answer. */
  readonly checked: boolean;
  /** Whether the supplier answers through the supplier portal already. */
  readonly linked: boolean;
}

/**
 * The suppliers with their rating, from the same queries 2.3 and the supplier page read, highest
 * rated first. The level comes from the linked risk, because the register's own level defaults to
 * medium and would make an unrated supplier look rated.
 */
export function useAgreementRows(enabled: boolean): readonly AgreementRow[] | undefined {
  const rated = useRatingRows(enabled ? "suppliers" : null);
  const suppliers = trpc.supplier.list.useQuery(undefined, { enabled });
  if (!rated || !suppliers.data) return undefined;
  const stored = new Map(suppliers.data.map((s) => [s.id, s]));
  return rated
    .flatMap((row: RatingRow) => {
      const s = stored.get(row.id);
      return row.kind === "supplier" && s
        ? [
            {
              id: row.id,
              name: row.name,
              level: levelOfStanding(row.standing),
              stored: {
                security: Boolean(s.hasSecurityClauses),
                incidents: Boolean(s.hasIncidentNotificationClause),
              },
              checked: s.agreementsCheckedAt !== null,
              linked: s.supplierCompanyId !== null,
            },
          ]
        : [];
    })
    .sort(byLevel);
}

/**
 * The answer a row shows: what was chosen on this visit, else what is stored. A stored row with
 * neither agreement is an answer only once 5.2 recorded it, because the two columns alone cannot
 * tell "nothing agreed" from "never looked".
 */
export const answerOf = (row: AgreementRow, draft: Draft): Agreed | null =>
  draft.agreements[row.id] ??
  (row.checked || row.stored.security || row.stored.incidents ? row.stored : null);

/** 5.2: per supplier, what its paper already settles, with its rating from 2.3 beside it. */
export function Agreements({
  item,
  draft,
  onDraft,
  entry,
}: WorkProps & { entry: Of<"agreements"> }) {
  const t = useTranslations("durchgang.ui.agreements");
  const rows = useAgreementRows(true);

  const set = (row: AgreementRow, agreed: Agreed) =>
    onDraft({ ...draft, agreements: { ...draft.agreements, [row.id]: agreed } });

  return (
    <>
      <Heading>{entry.copy.title}</Heading>
      <Lead>{entry.copy.lead}</Lead>
      {rows === undefined ? null : rows.length === 0 ? (
        <p className="mt-8 text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="mt-8 divide-y overflow-hidden rounded-2xl border bg-card shadow-sm">
          {rows.map((row) => {
            const answer = answerOf(row, draft);
            const current = answer ?? { security: false, incidents: false };
            const none = answer !== null && !answer.security && !answer.incidents;
            return (
              <li
                key={row.id}
                className="grid gap-3 px-5 py-4 lg:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] lg:items-center lg:gap-6"
              >
                <div className="flex min-w-0 items-center gap-3 lg:flex-col lg:items-start lg:gap-1.5">
                  <p className="truncate font-medium">{row.name}</p>
                  <RowLevel level={row.level} locale={item.locale} />
                </div>
                <div className="space-y-2.5">
                  <div className="flex flex-wrap gap-2">
                    <Toggle
                      on={current.security}
                      onClick={() =>
                        set(row, { ...current, security: !current.security })
                      }
                    >
                      {entry.copy.security}
                    </Toggle>
                    <Toggle
                      on={current.incidents}
                      onClick={() =>
                        set(row, { ...current, incidents: !current.incidents })
                      }
                    >
                      {entry.copy.incidents}
                    </Toggle>
                    <Toggle
                      on={none}
                      onClick={() => set(row, { security: false, incidents: false })}
                    >
                      {entry.copy.none}
                    </Toggle>
                  </div>
                  {row.linked ? (
                    <p className="text-xs text-muted-foreground">{t("linked")}</p>
                  ) : (
                    <RequestSupplierProfileButton
                      label={t("questionnaireButton")}
                      supplierId={row.id}
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {rows && rows.length > 0 && <Aside className="mt-6">{t("questionnaire")}</Aside>}
    </>
  );
}
