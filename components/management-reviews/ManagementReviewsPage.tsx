"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc/client";
import { managementReviewInsertSchema } from "@/schema/validators";
import { CrudPage } from "@/components/shared/CrudPage";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ClipboardList, Pencil, Trash2 } from "lucide-react";

const truncate = (text: unknown, max: number) => {
  if (!text) return "\u2014";
  const s = String(text);
  return s.length > max ? `${s.slice(0, max)}...` : s;
};

export function ManagementReviewsPage({ items, inline }: { items: Record<string, unknown>[]; inline?: boolean }) {
  const t = useTranslations("managementReviews");
  const router = useRouter();
  const refresh = () => router.refresh();
  const createMut = trpc.managementReview.create.useMutation({ onSuccess: refresh });
  const updateMut = trpc.managementReview.update.useMutation({ onSuccess: refresh });
  const deleteMut = trpc.managementReview.delete.useMutation({ onSuccess: refresh });

  return (
    <CrudPage
      items={items}
      icon={<ClipboardList className="h-8 w-8 text-primary" />}
      inline={inline}
      namespace="managementReviews"
      schema={managementReviewInsertSchema}
      omit={["id", "companyId", "createdAt", "updatedAt", "attendees", "topicsCovered", "minutesFileKey"]}
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
              <TableHead>{t("fields.reviewDate")}</TableHead>
              <TableHead>{t("fields.nextReviewDate")}</TableHead>
              <TableHead>{t("fields.decisions")}</TableHead>
              <TableHead className="text-right">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id as string}>
                <TableCell className="font-medium">{item.title as string}</TableCell>
                <TableCell>{item.reviewDate ? new Date(item.reviewDate as string).toLocaleDateString() : "\u2014"}</TableCell>
                <TableCell>{item.nextReviewDate ? new Date(item.nextReviewDate as string).toLocaleDateString() : "\u2014"}</TableCell>
                <TableCell>{truncate(item.decisions, 50)}</TableCell>
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
