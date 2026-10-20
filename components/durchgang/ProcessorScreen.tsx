"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  isProcessor,
  PROCESSOR_ROLES,
  type ProcessorAnswer,
  type ProcessorFact,
  SUBPROCESSOR_AUTHORISATIONS,
  TRANSFER_MECHANISMS,
} from "@/lib/durchgang";
import { answerFor, type SupplierStatement } from "@/lib/supplier-portal/statements";
import { type RouterOutputs, trpc } from "@/lib/trpc/client";
import type { Draft } from "./draft";
import { Aside, Heading, Lead } from "./ExplainScreens";
import { Toggle } from "./RowParts";
import type { Of, WorkProps } from "./WorkScreens";

/** A supplier as the processors screens read it: the customer's facts and what it stated. */
type Supplier = RouterOutputs["durchgang"]["gdpr"]["processorRows"][number];

/**
 * The suppliers a processors screen asks about: every supplier for their role; for the facts that
 * only a processor has, the suppliers marked as processors, on this visit or before.
 */
export const processorRowsOf = (
  fact: ProcessorFact,
  suppliers: readonly Supplier[],
  draft: Draft,
): readonly Supplier[] =>
  fact === "role"
    ? suppliers
    : suppliers.filter((s) => {
        const chosen = draft.processors[s.id];
        return chosen?.fact === "role" ? chosen.role === "processor" : isProcessor(s);
      });

/** The rows of a processors screen, read from the supplier list; undefined while it loads. */
export function useProcessorRows(
  fact: ProcessorFact | null,
  draft: Draft,
): readonly Supplier[] | undefined {
  const suppliers = trpc.durchgang.gdpr.processorRows.useQuery(undefined, {
    enabled: fact !== null,
  });
  return fact && suppliers.data
    ? processorRowsOf(fact, suppliers.data, draft)
    : undefined;
}

/**
 * The answer a row shows and where it comes from: chosen on this visit, recorded by the company,
 * stated by the supplier in its questionnaire, or the transfer columns' default (`answerFor`).
 */
export const resolvedAnswer = (fact: ProcessorFact, row: Supplier, draft: Draft) =>
  answerFor(fact, row, draft.processors[row.id]);

/** The answer a row shows, whatever its source. */
export const processorAnswerOf = (
  fact: ProcessorFact,
  row: Supplier,
  draft: Draft,
): ProcessorAnswer | null => resolvedAnswer(fact, row, draft)?.answer ?? null;

/** Whether a row's answer is complete: a transfer outside the EEA names its basis. */
export const answered = (answer: ProcessorAnswer | null): boolean =>
  answer !== null &&
  (answer.fact !== "transfer" || !answer.outside || answer.mechanism !== null);

/**
 * What leaving a processors screen saves, as `durchgang.gdpr.recordProcessors` takes it, or null
 * when nothing is to be saved: the complete answers chosen on this visit or taken from the
 * supplier's statement (moving on confirms what the screen showed), and on the transfer screen
 * every row it shows, since that screen starts each row answered (as 11.1 does).
 */
export const processorSave = (
  code: string,
  fact: ProcessorFact,
  rows: readonly Supplier[],
  draft: Draft,
) => {
  const picked = rows.flatMap((row) => {
    const resolved = resolvedAnswer(fact, row, draft);
    const saved =
      resolved !== null &&
      (fact === "transfer" ||
        resolved.source === "chosen" ||
        resolved.source === "stated");
    const answer = resolved?.answer;
    return saved && answer?.fact === fact && answered(answer)
      ? [{ supplierId: row.id, answer }]
      : [];
  });
  if (picked.length === 0) return null;
  switch (fact) {
    case "role":
      return {
        code,
        fact,
        rows: picked.flatMap(({ supplierId, answer }) =>
          answer.fact === "role" ? [{ supplierId, role: answer.role }] : [],
        ),
      };
    case "contract":
      return {
        code,
        fact,
        rows: picked.flatMap(({ supplierId, answer }) =>
          answer.fact === "contract" ? [{ supplierId, concluded: answer.concluded }] : [],
        ),
      };
    case "transfer":
      return {
        code,
        fact,
        rows: picked.flatMap(({ supplierId, answer }) =>
          answer.fact === "transfer"
            ? [{ supplierId, outside: answer.outside, mechanism: answer.mechanism }]
            : [],
        ),
      };
    case "subprocessing":
      return {
        code,
        fact,
        rows: picked.flatMap(({ supplierId, answer }) =>
          answer.fact === "subprocessing"
            ? [{ supplierId, authorisation: answer.authorisation }]
            : [],
        ),
      };
    default:
      return fact satisfies never;
  }
};

/** G-DPA.1 and G-DPA.2: per supplier, one GDPR fact: its role, its contract, transfers, sub-processors. */
export function Processors({
  draft,
  onDraft,
  entry,
}: WorkProps & { entry: Of<"processors"> }) {
  const t = useTranslations("durchgang.ui.processors");
  const { fact } = entry.screen;
  const rows = useProcessorRows(fact, draft);
  const set = (row: Supplier, answer: ProcessorAnswer) =>
    onDraft({ ...draft, processors: { ...draft.processors, [row.id]: answer } });

  /** What the supplier stated in its questionnaire that bears on this screen's fact. */
  const statedLines = (stated: SupplierStatement | null): readonly string[] => {
    if (!stated) return [];
    const agreement = stated.dataProcessingAgreement
      ? [t(`stated.dataProcessingAgreement.${stated.dataProcessingAgreement}`)]
      : [];
    switch (fact) {
      case "role":
        return agreement;
      case "contract":
        return [
          ...agreement,
          ...(stated.breachNoticeToController === null
            ? []
            : [
                t(
                  stated.breachNoticeToController
                    ? "stated.breachNotice"
                    : "stated.noBreachNotice",
                ),
              ]),
        ];
      case "transfer":
        return stated.personalDataTransfers
          ? [t(`stated.personalDataTransfers.${stated.personalDataTransfers}`)]
          : stated.dataProcessingLocations
            ? [t("stated.locations", { countries: stated.dataProcessingLocations })]
            : [];
      case "subprocessing":
        return [
          ...(stated.subprocessorEngagement
            ? [t(`stated.subprocessorEngagement.${stated.subprocessorEngagement}`)]
            : []),
          ...(stated.subprocessorList
            ? [t("stated.subprocessorList", { list: stated.subprocessorList })]
            : []),
        ];
      default:
        return fact satisfies never;
    }
  };
  const anyStated = rows?.some(
    (row) => resolvedAnswer(fact, row, draft)?.source === "stated",
  );

  const answers = (row: Supplier) => {
    const answer = processorAnswerOf(fact, row, draft);
    switch (fact) {
      case "role":
        return PROCESSOR_ROLES.map((role) => (
          <Toggle
            key={role}
            on={answer?.fact === "role" && answer.role === role}
            onClick={() => set(row, { fact, role })}
          >
            {t(`role.${role}`)}
          </Toggle>
        ));
      case "contract":
        return ([true, false] as const).map((concluded) => (
          <Toggle
            key={String(concluded)}
            on={answer?.fact === "contract" && answer.concluded === concluded}
            onClick={() => set(row, { fact, concluded })}
          >
            {t(concluded ? "contract.yes" : "contract.no")}
          </Toggle>
        ));
      case "transfer": {
        const current = answer?.fact === "transfer" ? answer : null;
        return (
          <>
            {([false, true] as const).map((outside) => (
              <Toggle
                key={String(outside)}
                on={current?.outside === outside}
                onClick={() =>
                  set(row, {
                    fact,
                    outside,
                    mechanism: outside ? (current?.mechanism ?? null) : null,
                  })
                }
              >
                {t(outside ? "transfer.yes" : "transfer.no")}
              </Toggle>
            ))}
            {current?.outside && (
              <div className="w-full space-y-2 pt-1">
                <p className="text-sm text-muted-foreground">{t("transfer.mechanism")}</p>
                <div className="flex flex-wrap gap-2">
                  {TRANSFER_MECHANISMS.map((mechanism) => (
                    <Toggle
                      key={mechanism}
                      on={current.mechanism === mechanism}
                      onClick={() => set(row, { fact, outside: true, mechanism })}
                    >
                      {t(`transfer.mechanisms.${mechanism}`)}
                    </Toggle>
                  ))}
                </div>
              </div>
            )}
          </>
        );
      }
      case "subprocessing":
        return SUBPROCESSOR_AUTHORISATIONS.map((authorisation) => (
          <Toggle
            key={authorisation}
            on={
              answer?.fact === "subprocessing" && answer.authorisation === authorisation
            }
            onClick={() => set(row, { fact, authorisation })}
          >
            {t(`subprocessing.${authorisation}`)}
          </Toggle>
        ));
      default:
        return fact satisfies never;
    }
  };

  return (
    <>
      <Heading>{entry.copy.title}</Heading>
      <Lead>{entry.copy.lead}</Lead>
      {rows === undefined ? null : rows.length === 0 ? (
        <Aside className="mt-8">
          {fact === "role" ? t("empty") : t("noProcessors")}{" "}
          {fact === "role" && (
            <Link
              href="/suppliers"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {t("toSuppliers")}
            </Link>
          )}
        </Aside>
      ) : (
        <>
          {fact !== "role" && (
            <p className="mt-4 text-sm text-muted-foreground">{t("onlyProcessors")}</p>
          )}
          {anyStated && (
            <p className="mt-2 text-sm text-muted-foreground">
              {t("stated.preselected")}
            </p>
          )}
          <ul className="mt-6 divide-y overflow-hidden rounded-2xl border bg-card shadow-sm">
            {rows.map((row) => {
              const lines = statedLines(row.stated);
              return (
                <li
                  key={row.id}
                  className="grid gap-3 px-5 py-4 lg:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] lg:items-start lg:gap-6"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{row.name}</p>
                    {lines.length > 0 && (
                      <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                        <p className="font-medium">{t("stated.label")}</p>
                        {lines.map((line) => (
                          <p key={line}>{line}</p>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">{answers(row)}</div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </>
  );
}
