"use client";

import { Download } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { isYesNoFact, legalBasesIn } from "@/lib/durchgang";
import { recordCsv } from "@/lib/processing-activities/record-csv";
import type { RouterOutputs } from "@/lib/trpc/client";
import { processingActivityCreateSchema } from "@/schema/processing-activity-validators";

export type Controller = RouterOutputs["processingActivity"]["controller"];

/** The record's columns, in the table's order: what a company writes of each activity. */
const COLUMNS = Object.keys(processingActivityCreateSchema.shape);

const textOf = (value: unknown): string | null =>
  typeof value === "string" && value.trim() !== "" ? value : null;

/**
 * What a record of processing activities states besides its activities (Art. 30(1)(a) and (g)):
 * who the controller is, its data protection officer, and where its security measures are
 * described. The download carries all of it with every activity, for handing the record to the
 * supervisory authority (Art. 30(4)).
 */
export function RecordHeader({
  controller,
  items,
}: {
  controller: Controller;
  items: readonly Record<string, unknown>[];
}) {
  const t = useTranslations("processingActivities");
  const format = useFormatter();
  const day = (date: Date | string) =>
    format.dateTime(new Date(date), { dateStyle: "long" });

  const controllerLine = [
    controller.name,
    controller.address,
    controller.email,
    controller.phone,
  ]
    .filter(Boolean)
    .join(", ");
  const { dpo } = controller;
  const dpoLine =
    dpo.kind === "none"
      ? t("record.dpoNone")
      : dpo.kind === "designated"
        ? [dpo.name, dpo.contact].filter(Boolean).join(", ") || t("record.dpoUnnamed")
        : t("record.dpoOpen");
  const measuresLine = !controller.measures
    ? t("record.measuresNone")
    : controller.measures.approvedAt
      ? t("record.measuresApproved", {
          title: controller.measures.title,
          date: day(controller.measures.approvedAt),
        })
      : t("record.measuresDraft", { title: controller.measures.title });

  const download = () => {
    const yesNo = (value: unknown) =>
      value === true ? t("record.yes") : value === false ? t("record.no") : null;
    const cell = (column: string, value: unknown) =>
      column === "legalBases"
        ? legalBasesIn(value)
            .map((b) => t(`bases.${b}`))
            .join("; ") || null
        : isYesNoFact(column)
          ? yesNo(value)
          : textOf(value);
    const csv = recordCsv([
      [t("record.title")],
      [t("record.controller"), controllerLine || null],
      [t("record.dpo"), dpoLine],
      [t("record.measures"), measuresLine],
      [t("record.asOf"), day(new Date())],
      [],
      COLUMNS.map((c) => t(`fields.${c}`)),
      ...items.map((item) => COLUMNS.map((c) => cell(c, item[c]))),
    ]);
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
