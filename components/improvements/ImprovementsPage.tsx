"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc/client";
import { improvementItemInsertSchema } from "@/schema/validators";
import { CrudPage } from "@/components/shared/CrudPage";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { TrendingUp, Pencil, Trash2 } from "lucide-react";

const priorityConfig: Record<string, { variant: "destructive" | "default" | "secondary" | "outline"; className?: string }> = {
  P0: { variant: "destructive" },
  P1: { variant: "default" },
  P2: { variant: "secondary" },
  P3: { variant: "outline" },
};

const statusConfig: Record<string, { variant: "secondary" | "default" | "outline"; className?: string }> = {
  open: { variant: "secondary" },
  in_progress: { variant: "default" },
  resolved: { variant: "default", className: "bg-green-600 text-white" },
  verified: { variant: "default", className: "bg-green-700 text-white" },
  deferred: { variant: "outline" },
};

export function ImprovementsPage({ items, inline }: { items: Record<string, unknown>[]; inline?: boolean }) {
  const t = useTranslations("improvements");
  const router = useRouter();
  const refresh = () => router.refresh();
  const createMut = trpc.improvement.create.useMutation({ onSuccess: refresh });
  const updateMut = trpc.improvement.update.useMutation({ onSuccess: refresh });
  const deleteMut = trpc.improvement.delete.useMutation({ onSuccess: refresh });

  return (
    <CrudPage
      items={items}
      icon={<TrendingUp className="h-8 w-8 text-primary" />}
      inline={inline}
      namespace="improvements"
      schema={improvementItemInsertSchema}
      omit={["id", "companyId", "createdAt", "updatedAt", "sourceReferenceId", "assignedTo", "completedAt", "verificationNotes"]}
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
              <TableHead>{t("fields.source")}</TableHead>
              <TableHead>{t("fields.priority")}</TableHead>
              <TableHead>{t("fields.status")}</TableHead>
              <TableHead>{t("fields.targetDate")}</TableHead>
              <TableHead className="text-right">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id as string}>
                <TableCell className="font-medium">{item.title as string}</TableCell>
                <TableCell><Badge variant="outline">{item.source as string}</Badge></TableCell>
                <TableCell>
                  <StatusBadge status={item.priority as string} config={priorityConfig} label={t(`priority.${item.priority as string}`)} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={item.status as string} config={statusConfig} label={t(`status.${item.status as string}`)} />
                </TableCell>
                <TableCell>{item.targetDate ? new Date(item.targetDate as string).toLocaleDateString() : "\u2014"}</TableCell>
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
