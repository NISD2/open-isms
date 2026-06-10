"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc/client";
import { internalAuditInsertSchema } from "@/schema/validators";
import { CrudPage } from "@/components/shared/CrudPage";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, Pencil, Trash2 } from "lucide-react";

const statusConfig: Record<string, { variant: "secondary" | "default" | "outline" | "destructive"; className?: string }> = {
  planned: { variant: "secondary" },
  in_progress: { variant: "default" },
  completed: { variant: "default", className: "bg-green-600 text-white" },
  cancelled: { variant: "destructive" },
};

export function InternalAuditsPage({ items, inline }: { items: Record<string, unknown>[]; inline?: boolean }) {
  const t = useTranslations("internalAudits");
  const router = useRouter();
  const refresh = () => router.refresh();
  const createMut = trpc.internalAudit.create.useMutation({ onSuccess: refresh });
  const updateMut = trpc.internalAudit.update.useMutation({ onSuccess: refresh });
  const deleteMut = trpc.internalAudit.delete.useMutation({ onSuccess: refresh });

  return (
    <CrudPage
      items={items}
      icon={<Search className="h-8 w-8 text-primary" />}
      inline={inline}
      namespace="internalAudits"
      schema={internalAuditInsertSchema}
      omit={["id", "companyId", "createdAt", "updatedAt", "reportFileKey"]}
      onCreate={(data) => createMut.mutate(data)}
      onUpdate={(id, data) => updateMut.mutate({ id, ...data })}
      onDelete={(id) => deleteMut.mutate({ id })}
      isSubmitting={createMut.isPending || updateMut.isPending}
      llmPrefill
    >
      {({ items, onEdit, onDelete }) => (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("fields.title")}</TableHead>
              <TableHead>{t("fields.auditArea")}</TableHead>
              <TableHead>{t("fields.status")}</TableHead>
              <TableHead>{t("fields.scheduledDate")}</TableHead>
              <TableHead>{t("fields.completedAt")}</TableHead>
              <TableHead>{t("fields.auditorName")}</TableHead>
              <TableHead className="text-right">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id as string}>
                <TableCell className="font-medium">{item.title as string}</TableCell>
                <TableCell>{(item.auditArea as string) || "\u2014"}</TableCell>
                <TableCell>
                  <StatusBadge status={item.status as string} config={statusConfig} label={t(`status.${item.status as string}`)} />
                </TableCell>
                <TableCell>{item.scheduledDate ? new Date(item.scheduledDate as string).toLocaleDateString() : "\u2014"}</TableCell>
                <TableCell>{item.completedAt ? new Date(item.completedAt as string).toLocaleDateString() : "\u2014"}</TableCell>
                <TableCell>{(item.auditorName as string) || "\u2014"}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(item)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(item.id as string)}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </CrudPage>
  );
}
