"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc/client";
import { policyInsertSchema } from "@/schema/validators";
import { CrudPage } from "@/components/shared/CrudPage";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileText, Pencil, Trash2 } from "lucide-react";

const statusConfig: Record<string, { variant: "secondary" | "default" | "outline"; className?: string }> = {
  draft: { variant: "secondary" },
  approved: { variant: "default" },
  archived: { variant: "outline" },
};

export function PoliciesPage({ items, inline }: { items: Record<string, unknown>[]; inline?: boolean }) {
  const t = useTranslations("policies");
  const router = useRouter();
  const refresh = () => router.refresh();
  const createMut = trpc.policy.create.useMutation({ onSuccess: refresh });
  const updateMut = trpc.policy.update.useMutation({ onSuccess: refresh });
  const deleteMut = trpc.policy.delete.useMutation({ onSuccess: refresh });

  return (
    <CrudPage
      items={items}
      icon={<FileText className="h-8 w-8 text-primary" />}
      inline={inline}
      namespace="policies"
      schema={policyInsertSchema}
      omit={["id", "companyId", "createdAt", "updatedAt", "approvedBy", "approvedAt", "approverRole", "archivedAt", "fileKey", "requirementId"]}
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
              <TableHead>{t("fields.type")}</TableHead>
              <TableHead>{t("fields.version")}</TableHead>
              <TableHead>{t("fields.status")}</TableHead>
              <TableHead>{t("fields.effectiveFrom")}</TableHead>
              <TableHead>{t("fields.reviewDue")}</TableHead>
              <TableHead className="text-right">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id as string}>
                <TableCell className="font-medium">{item.title as string}</TableCell>
                <TableCell>{item.type as string}</TableCell>
                <TableCell>{item.version as string}</TableCell>
                <TableCell>
                  {/* policy.status is a free-text varchar (not a DB enum): an
                      unmapped value must fall back, not crash the render. */}
                  <StatusBadge
                    status={item.status as string}
                    config={statusConfig}
                    label={t.has(`status.${item.status as string}`) ? t(`status.${item.status as string}`) : (item.status as string)}
                  />
                </TableCell>
                <TableCell>{item.effectiveFrom ? new Date(item.effectiveFrom as string).toLocaleDateString() : "\u2014"}</TableCell>
                <TableCell>{item.reviewDue ? new Date(item.reviewDue as string).toLocaleDateString() : "\u2014"}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" data-testid="row-edit" onClick={() => onEdit(item)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" data-testid="row-delete" onClick={() => onDelete(item.id as string)}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </CrudPage>
  );
}
