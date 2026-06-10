"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc/client";
import { exerciseInsertSchema } from "@/schema/validators";
import { CrudPage } from "@/components/shared/CrudPage";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Target, Pencil, Trash2 } from "lucide-react";

const exerciseTypeConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
  tabletop: { variant: "outline" },
  technical: { variant: "secondary" },
  red_team: { variant: "destructive" },
  full_scale: { variant: "default" },
};

export function ExercisesPage({ items, inline }: { items: Record<string, unknown>[]; inline?: boolean }) {
  const t = useTranslations("exercises");
  const router = useRouter();
  const refresh = () => router.refresh();
  const createMut = trpc.exercise.create.useMutation({ onSuccess: refresh });
  const updateMut = trpc.exercise.update.useMutation({ onSuccess: refresh });
  const deleteMut = trpc.exercise.delete.useMutation({ onSuccess: refresh });

  return (
    <CrudPage
      items={items}
      icon={<Target className="h-8 w-8 text-primary" />}
      inline={inline}
      namespace="exercises"
      schema={exerciseInsertSchema}
      omit={["id", "companyId", "createdAt", "updatedAt", "participants", "identifiedGaps", "afterActionReportFileKey"]}
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
              <TableHead>{t("fields.exerciseType")}</TableHead>
              <TableHead>{t("fields.domain")}</TableHead>
              <TableHead>{t("fields.scheduledDate")}</TableHead>
              <TableHead>{t("fields.completedAt")}</TableHead>
              <TableHead className="text-right">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id as string}>
                <TableCell className="font-medium">{item.title as string}</TableCell>
                <TableCell>
                  <StatusBadge status={item.exerciseType as string} config={exerciseTypeConfig} label={t(`exerciseType.${item.exerciseType as string}`)} />
                </TableCell>
                <TableCell>{(item.domain as string) || "\u2014"}</TableCell>
                <TableCell>{item.scheduledDate ? new Date(item.scheduledDate as string).toLocaleDateString() : "\u2014"}</TableCell>
                <TableCell>{item.completedAt ? new Date(item.completedAt as string).toLocaleDateString() : "\u2014"}</TableCell>
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
