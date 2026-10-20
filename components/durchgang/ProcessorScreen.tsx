"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import {
  isProcessor,
  PROCESSOR_ROLES,
  type ProcessorAnswer,
  type ProcessorFact,
  SUBPROCESSOR_AUTHORISATIONS,
  TRANSFER_MECHANISMS,
  transferComplete,
} from "@/lib/durchgang";
import { answerFor, type SupplierStatement } from "@/lib/supplier-portal/statements";
import { type RouterOutputs, trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
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

/** Whether a row's answer is complete: a transfer outside the EEA names its basis and countries. */
export const answered = (answer: ProcessorAnswer | null | undefined): boolean =>
  !!answer && (answer.fact !== "transfer" || transferComplete(answer));

/**
 * Whether a row is settled: the company's own answer, chosen now or recorded before, and complete.
 * A supplier's statement alone is a suggestion, so it leaves the row open.
 */
export const settled = (fact: ProcessorFact, row: Supplier, draft: Draft): boolean => {
  const shown = answerFor(fact, row, draft.processors[row.id]);
  return shown !== null && shown.source !== "stated" && answered(shown.answer);
};

/**
 * What leaving a processors screen saves, as `durchgang.gdpr.recordProcessors` takes it, or null
 * when nothing is to be saved: the complete answers chosen on this visit, and nothing else.
 */
export const processorSave = (
  code: string,
  fact: ProcessorFact,
  rows: readonly Supplier[],
  draft: Draft,
) => {
  const picked = rows.flatMap((row) => {
    const answer = draft.processors[row.id];
    return answer?.fact === fact && answered(answer)
      ? [{ supplierId: row.id, answer }]
      : [];
  });
  return picked.length === 0 ? null : { code, rows: picked };
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
  const shownOf = (row: Supplier) => answerFor(fact, row, draft.processors[row.id]);
  // The suppliers' own answers, which the person takes over in one go after checking them.
  const suggestions = (rows ?? []).flatMap((row) => {
    const shown = shownOf(row);
    return shown?.source === "stated" ? [[row.id, shown.answer] as const] : [];
  });
  const takeSuggestions = () =>
    onDraft({
      ...draft,
      processors: { ...draft.processors, ...Object.fromEntries(suggestions) },
    });

  const answers = (row: Supplier) => {
    const shown = shownOf(row);
    const answer = shown?.answer;
    const suggested = shown?.source === "stated";
    /** A toggle's state: chosen for the company's own answer, dashed for the supplier's. */
    const mark = (match: boolean) => ({
      on: match && !suggested,
      suggested: match && suggested,
    });
    switch (fact) {
      case "role":
        return PROCESSOR_ROLES.map((role) => (
          <Toggle
            key={role}
            {...mark(answer?.fact === "role" && answer.role === role)}
            onClick={() => set(row, { fact, role })}
          >
            {t(`role.${role}`)}
          </Toggle>
        ));
      case "contract":
        return ([true, false] as const).map((concluded) => (
          <Toggle
            key={String(concluded)}
            {...mark(answer?.fact === "contract" && answer.concluded === concluded)}
            onClick={() => set(row, { fact, concluded })}
          >
            {t(concluded ? "contract.yes" : "contract.no")}
          </Toggle>
        ));
      case "transfer": {
        const current = answer?.fact === "transfer" ? answer : null;
        const countries = current?.countries ?? null;
        return (
          <>
            {([false, true] as const).map((outside) => (
              <Toggle
                key={String(outside)}
                {...mark(current?.outside === outside)}
                onClick={() =>
                  set(row, {
                    fact,
                    outside,
                    mechanism: outside ? (current?.mechanism ?? null) : null,
                    countries: outside ? countries : null,
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
                      {...mark(current.mechanism === mechanism)}
                      onClick={() =>
                        set(row, { fact, outside: true, mechanism, countries })
                      }
                    >
                      {t(`transfer.mechanisms.${mechanism}`)}
                    </Toggle>
                  ))}
                </div>
                <Label htmlFor={`countries-${row.id}`} className="pt-1 font-normal">
                  {t("transfer.countries")}
                </Label>
                <Input
                  id={`countries-${row.id}`}
                  value={countries ?? ""}
                  placeholder={t("transfer.countriesHint")}
                  maxLength={500}
                  onChange={(e) =>
                    set(row, {
                      fact,
                      outside: true,
                      mechanism: current.mechanism,
                      countries: e.target.value,
                    })
                  }
                  className={cn(
                    "h-11 max-w-md text-base sm:h-10 sm:text-sm",
                    suggested && "border-dashed",
                  )}
                />
              </div>
            )}
          </>
        );
      }
      case "subprocessing":
        return SUBPROCESSOR_AUTHORISATIONS.map((authorisation) => (
          <Toggle
            key={authorisation}
            {...mark(
              answer?.fact === "subprocessing" && answer.authorisation === authorisation,
            )}
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
          {suggestions.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              <p className="max-w-[60ch] text-sm text-muted-foreground">
                {t("stated.preselected")}
              </p>
              <Button variant="outline" size="sm" onClick={takeSuggestions}>
                {t("stated.takeAll", { count: suggestions.length })}
              </Button>
            </div>
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
