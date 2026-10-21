"use client";

import { Download } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { recordCsv } from "@/lib/processing-activities/record-csv";
import { recordFacts, recordLines } from "@/lib/processing-activities/record-lines";
import type { RouterOutputs } from "@/lib/trpc/client";

export type Controller = RouterOutputs["processingActivity"]["controller"];

/**
 * What a record of processing activities states besides its activities (Art. 30(1)(a) and (g)):
 * who the controller is, its data protection officer, and where its security measures are
 * described. The download carries all of it with every activity, for handing the record to the
 * supervisory authority (Art. 30(4)); the export page offers the same file.
 */
export function RecordHeader({
  controller,
  items,
  suppliersOf,
}: {
  controller: Controller;
  items: readonly Record<string, unknown>[];
  /** The suppliers receiving an activity's data, each with its transfers, as the record words it. */
  suppliersOf: (id: unknown) => readonly string[];
}) {
  const t = useTranslations("processingActivities");
  const format = useFormatter();
  const words = {
    say: t,
    day: (date: Date | string) => format.dateTime(new Date(date), { dateStyle: "long" }),
  };
  const { controllerLine, dpoLine, measuresLine } = recordFacts(words, controller);

  const download = () => {
    const csv = recordCsv(recordLines(words, controller, items, suppliersOf));
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `record-of-processing-activities-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mb-6 rounded-2xl border bg-card p-5">
      <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
        <dt className="font-medium">{t("record.controller")}</dt>
        <dd className="text-muted-foreground">
          {controllerLine || t("record.controllerOpen")}
        </dd>
        <dt className="font-medium">{t("record.dpo")}</dt>
        <dd className="text-muted-foreground">{dpoLine}</dd>
        <dt className="font-medium">{t("record.measures")}</dt>
        <dd className="text-muted-foreground">{measuresLine}</dd>
      </dl>
      <Button type="button" variant="outline" className="mt-4" onClick={download}>
        <Download className="size-4" />
        {t("record.export")}
      </Button>
    </div>
  );
}
