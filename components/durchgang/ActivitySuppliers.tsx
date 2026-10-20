"use client";

import { useTranslations } from "next-intl";
import { useThroughLine } from "@/components/processing-activities/useThroughLine";
import { roleOf, throughSupplier } from "@/lib/durchgang";
import { type RouterOutputs, trpc } from "@/lib/trpc/client";
import { Toggle } from "./RowParts";

type Activity = RouterOutputs["processingActivity"]["list"][number];

/**
 * G-ROP.1: which of the company's suppliers receive an activity's data (Art. 30(1)(d)), ticked
 * from the supplier list, and what each one's row says of transfers outside the EEA. A transfer is
 * recorded once per supplier, in G-DPA.1, so here it is only shown. A supplier recorded as
 * receiving no personal data is not offered.
 */
export function ActivitySuppliers({
  id,
  activity,
  chosen,
  onChange,
}: {
  id: string;
  activity: Activity;
  /** The ids ticked on this visit; undefined while the stored list stands. */
  chosen: readonly string[] | undefined;
  onChange: (supplierIds: readonly string[]) => void;
}) {
  const t = useTranslations("durchgang.ui.describe.suppliers");
  const lineOf = useThroughLine();
  const list = trpc.durchgang.gdpr.processorRows.useQuery();
  const ticked = chosen ?? activity.suppliers.map((s) => s.id);
  const offered = (list.data ?? []).filter(
    (s) => roleOf(s) !== "none" || ticked.includes(s.id),
  );
  const toggle = (supplierId: string) =>
    onChange(
      ticked.includes(supplierId)
        ? ticked.filter((s) => s !== supplierId)
        : [...ticked, supplierId],
    );
  const lines = offered
    .filter((s) => ticked.includes(s.id))
    .map((s) => lineOf(s.name, throughSupplier(s)));

  if (list.data === undefined) return null;
  return (
    <fieldset aria-describedby={`${id}-hint`}>
      <legend className="text-sm font-medium">{t("label")}</legend>
      <p id={`${id}-hint`} className="mt-0.5 text-sm text-muted-foreground">
        {offered.length === 0 ? t("none") : t("hint")}
      </p>
      {offered.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {offered.map((s) => (
            <Toggle key={s.id} on={ticked.includes(s.id)} onClick={() => toggle(s.id)}>
              {s.name}
            </Toggle>
          ))}
        </div>
      )}
      {lines.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
          {lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
    </fieldset>
  );
}
