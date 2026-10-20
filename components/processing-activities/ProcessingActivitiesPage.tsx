"use client";

import { ListTree, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { CrudPage } from "@/components/shared/CrudPage";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "@/i18n/navigation";
import { LEGAL_BASES, legalBasesIn } from "@/lib/durchgang";
import { type RouterOutputs, trpc } from "@/lib/trpc/client";
import { processingActivityCreateSchema } from "@/schema/processing-activity-validators";
import { type Controller, RecordHeader } from "./RecordHeader";
import { useThroughLine } from "./useThroughLine";

type Activity = RouterOutputs["processingActivity"]["list"][number];

const shown = (text: unknown) => (typeof text === "string" && text.trim() ? text : "—");

/**
 * The record of processing activities (Art. 30(1) GDPR) as a register: every activity with what
 * the article records of it. The GDPR walk (G-ROP.1) fills it; here it is read, corrected and
 * extended. Taking an activity off is an admin's act.
 */
export function ProcessingActivitiesPage({
  items,
  admin,
  controller,
}: {
  items: Activity[];
  admin: boolean;
  controller: Controller;
}) {
  const t = useTranslations("processingActivities");
  const lineOf = useThroughLine();
  // The form's list holds rows as plain records; the suppliers are read from the typed ones.
  const suppliers = new Map(items.map((a) => [a.id, a.suppliers]));
  const suppliersOf = (id: unknown) =>
    (suppliers.get(String(id)) ?? []).map((s) => lineOf(s.name, s.through));
  const router = useRouter();
  const refresh = () => router.refresh();
  const create = trpc.processingActivity.create.useMutation({ onSuccess: refresh });
  const update = trpc.processingActivity.update.useMutation({ onSuccess: refresh });
  const remove = trpc.processingActivity.delete.useMutation({ onSuccess: refresh });
  const basesOf = (value: unknown) =>
    legalBasesIn(value)
      .map((b) => t(`bases.${b}`))
      .join(", ") || "—";

  return (
    <CrudPage
      items={items}
      icon={<ListTree className="h-8 w-8 text-primary" />}
      namespace="processingActivities"
      schema={processingActivityCreateSchema}
      fieldOverrides={{
        legalBases: {
          component: "multiselect",
          options: LEGAL_BASES.map((b) => ({ value: b, label: t(`bases.${b}`) })),
        },
      }}
      onCreate={(data) => create.mutateAsync(data)}
      onUpdate={(id, data) => update.mutateAsync({ id, ...data })}
      onDelete={admin ? (id) => remove.mutate({ id }) : undefined}
      isSubmitting={create.isPending || update.isPending}
    >
      {({ items, onEdit, onDelete }) => (
        <>
          <RecordHeader controller={controller} items={items} suppliersOf={suppliersOf} />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("fields.name")}</TableHead>
                <TableHead>{t("fields.purpose")}</TableHead>
                <TableHead>{t("fields.legalBases")}</TableHead>
                <TableHead>{t("fields.dataSubjects")}</TableHead>
                <TableHead>{t("fields.recipients")}</TableHead>
                <TableHead>{t("fields.suppliers")}</TableHead>
                <TableHead>{t("fields.retention")}</TableHead>
                <TableHead className="text-right">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={String(item.id)}>
                  <TableCell className="font-medium">{shown(item.name)}</TableCell>
                  <TableCell className="max-w-64 whitespace-normal">
                    {shown(item.purpose)}
                  </TableCell>
                  <TableCell className="max-w-48 whitespace-normal">
                    {basesOf(item.legalBases)}
                  </TableCell>
                  <TableCell className="max-w-48 whitespace-normal">
                    {shown(item.dataSubjects)}
                  </TableCell>
                  <TableCell className="max-w-48 whitespace-normal">
                    {shown(item.recipients)}
                  </TableCell>
                  <TableCell className="max-w-64 whitespace-normal">
                    {suppliersOf(item.id).length === 0 ? (
                      "—"
                    ) : (
                      <ul className="space-y-1">
                        {suppliersOf(item.id).map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    )}
                  </TableCell>
                  <TableCell className="max-w-48 whitespace-normal">
                    {shown(item.retention)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {admin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(String(item.id))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </CrudPage>
  );
}
