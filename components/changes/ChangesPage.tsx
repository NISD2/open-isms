"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc/client";
import { changeRequestInsertSchema } from "@/schema/validators";
import { CrudPage } from "@/components/shared/CrudPage";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { GitBranch, Pencil, Trash2 } from "lucide-react";

const changeTypeConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
  standard: { variant: "outline" },
  normal: { variant: "secondary" },
  emergency: { variant: "destructive" },
};

const changeStatusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
  draft: { variant: "secondary" },
  submitted: { variant: "outline" },
  approved: { variant: "default" },
  implementing: { variant: "default", className: "bg-blue-600 text-white" },
  implemented: { variant: "default", className: "bg-green-600 text-white" },
  rolled_back: { variant: "destructive" },
  closed: { variant: "outline" },
};

export function ChangesPage({ items, inline }: { items: Record<string, unknown>[]; inline?: boolean }) {
  const t = useTranslations("changes");
  const router = useRouter();
  const refresh = () => router.refresh();
  const createMut = trpc.change.create.useMutation({ onSuccess: refresh });
  const updateMut = trpc.change.update.useMutation({ onSuccess: refresh });
  const deleteMut = trpc.change.delete.useMutation({ onSuccess: refresh });

  return (
    <CrudPage
      items={items}
      icon={<GitBranch className="h-8 w-8 text-primary" />}
      inline={inline}
      namespace="changes"
      schema={changeRequestInsertSchema}
      omit={["id", "companyId", "createdAt", "updatedAt", "requestedBy", "approvedBy", "approvedAt", "implementedBy", "implementedAt", "testedAt", "rolledBackAt", "closedAt", "assetId"]}
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
              <TableHead>{t("fields.changeType")}</TableHead>
              <TableHead>{t("fields.status")}</TableHead>
              <TableHead>{t("fields.createdAt")}</TableHead>
              <TableHead className="text-right">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id as string}>
                <TableCell className="font-medium">{item.title as string}</TableCell>
                <TableCell>
                  <StatusBadge status={item.changeType as string} config={changeTypeConfig} label={t(`changeType.${item.changeType as string}`)} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={item.status as string} config={changeStatusConfig} label={t(`status.${item.status as string}`)} />
                </TableCell>
                <TableCell>{item.createdAt ? new Date(item.createdAt as string).toLocaleDateString() : "\u2014"}</TableCell>
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
