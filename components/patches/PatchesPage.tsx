"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc/client";
import { patchRecordInsertSchema } from "@/schema/validators";
import { CrudPage } from "@/components/shared/CrudPage";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Pencil, Trash2 } from "lucide-react";

const severityConfig: Record<string, { variant: "destructive" | "default" | "secondary" | "outline"; className?: string }> = {
  critical: { variant: "destructive" },
  high: { variant: "default" },
  medium: { variant: "secondary" },
  low: { variant: "outline" },
};

const statusConfig: Record<string, { variant: "secondary" | "default" | "destructive" | "outline"; className?: string }> = {
  pending: { variant: "secondary" },
  applied: { variant: "default", className: "bg-green-600 text-white" },
  exception: { variant: "destructive" },
  not_applicable: { variant: "outline" },
};

export function PatchesPage({ items, inline }: { items: Record<string, unknown>[]; inline?: boolean }) {
  const t = useTranslations("patches");
  const router = useRouter();
  const refresh = () => router.refresh();
  const createMut = trpc.patch.create.useMutation({ onSuccess: refresh });
  const updateMut = trpc.patch.update.useMutation({ onSuccess: refresh });
  const deleteMut = trpc.patch.delete.useMutation({ onSuccess: refresh });

  return (
    <CrudPage
      items={items}
      icon={<ShieldCheck className="h-8 w-8 text-primary" />}
      inline={inline}
      namespace="patches"
      schema={patchRecordInsertSchema}
      omit={["id", "companyId", "createdAt", "updatedAt", "exceptionApprovedBy", "exceptionExpiresAt"]}
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
              <TableHead>{t("fields.patchIdentifier")}</TableHead>
              <TableHead>{t("fields.title")}</TableHead>
              <TableHead>{t("fields.severity")}</TableHead>
              <TableHead>{t("fields.status")}</TableHead>
              <TableHead>{t("fields.releaseDate")}</TableHead>
              <TableHead>{t("fields.appliedAt")}</TableHead>
              <TableHead className="text-right">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id as string}>
                <TableCell className="font-medium">{item.patchIdentifier as string}</TableCell>
                <TableCell>{(item.title as string) || "\u2014"}</TableCell>
                <TableCell>
                  <StatusBadge status={item.severity as string} config={severityConfig} label={t(`severity.${item.severity as string}`)} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={item.status as string} config={statusConfig} label={t(`status.${item.status as string}`)} />
                </TableCell>
                <TableCell>{item.releaseDate ? new Date(item.releaseDate as string).toLocaleDateString() : "\u2014"}</TableCell>
                <TableCell>{item.appliedAt ? new Date(item.appliedAt as string).toLocaleDateString() : "\u2014"}</TableCell>
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
