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
import { LEGAL_BASES } from "@/lib/durchgang";
import { trpc } from "@/lib/trpc/client";
import { processingActivityInsertSchema } from "@/schema/processing-activity-validators";

const shown = (text: unknown) => (typeof text === "string" && text.trim() ? text : "—");

/**
 * The record of processing activities (Art. 30(1) GDPR) as a register: every activity with what
 * the article records of it. The GDPR walk (G-ROP.1) fills it; here it is read, corrected and
 * extended. Taking an activity off is an admin's act.
 */
export function ProcessingActivitiesPage({
  items,
  admin,
}: {
  items: Record<string, unknown>[];
  admin: boolean;
}) {
  const t = useTranslations("processingActivities");
  const router = useRouter();
  const refresh = () => router.refresh();
  const create = trpc.processingActivity.create.useMutation({ onSuccess: refresh });
  const update = trpc.processingActivity.update.useMutation({ onSuccess: refresh });
  const remove = trpc.processingActivity.delete.useMutation({ onSuccess: refresh });
  const basesOf = (value: unknown) =>
    Array.isArray(value) && value.length > 0
      ? LEGAL_BASES.filter((b) => value.includes(b))
          .map((b) => t(`bases.${b}`))
          .join(", ")
      : "—";

  return (
    <CrudPage
      items={items}
      icon={<ListTree className="h-8 w-8 text-primary" />}
      namespace="processingActivities"
      schema={processingActivityInsertSchema}
      omit={["id", "companyId", "catalogId", "createdAt", "updatedAt"]}
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("fields.name")}</TableHead>
              <TableHead>{t("fields.purpose")}</TableHead>
              <TableHead>{t("fields.legalBases")}</TableHead>
              <TableHead>{t("fields.dataSubjects")}</TableHead>
              <TableHead>{t("fields.recipients")}</TableHead>
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
      )}
    </CrudPage>
  );
}
