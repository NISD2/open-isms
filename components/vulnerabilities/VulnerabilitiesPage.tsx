"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc/client";
import { vulnerabilityInsertSchema } from "@/schema/validators";
import { CrudPage } from "@/components/shared/CrudPage";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Bug, Pencil, Trash2 } from "lucide-react";

const severityConfig: Record<string, { variant: "destructive" | "default" | "secondary" | "outline" }> = {
  critical: { variant: "destructive" },
  high: { variant: "default" },
  medium: { variant: "secondary" },
  low: { variant: "outline" },
};

const statusConfig: Record<string, { variant: "secondary" | "default" | "destructive" | "outline"; className?: string }> = {
  discovered: { variant: "secondary" },
  assessed: { variant: "outline" },
  treating: { variant: "default", className: "bg-blue-600 text-white" },
  resolved: { variant: "default", className: "bg-green-600 text-white" },
  accepted: { variant: "outline" },
  mitigated: { variant: "default", className: "bg-amber-600 text-white" },
};

export function VulnerabilitiesPage({ items, inline }: { items: Record<string, unknown>[]; inline?: boolean }) {
  const t = useTranslations("vulnerabilities");
  const router = useRouter();
  const refresh = () => router.refresh();
  const createMut = trpc.vulnerability.create.useMutation({ onSuccess: refresh });
  const updateMut = trpc.vulnerability.update.useMutation({ onSuccess: refresh });
  const deleteMut = trpc.vulnerability.delete.useMutation({ onSuccess: refresh });

  return (
    <CrudPage
      items={items}
      icon={<Bug className="h-8 w-8 text-primary" />}
      inline={inline}
      namespace="vulnerabilities"
      schema={vulnerabilityInsertSchema}
      omit={["id", "companyId", "createdAt", "updatedAt"]}
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
              <TableHead>{t("fields.cveId")}</TableHead>
              <TableHead>{t("fields.title")}</TableHead>
              <TableHead>{t("fields.severity")}</TableHead>
              <TableHead>{t("fields.source")}</TableHead>
              <TableHead>{t("fields.status")}</TableHead>
              <TableHead>{t("fields.discoveredAt")}</TableHead>
              <TableHead className="text-right">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id as string}>
                <TableCell className="font-mono text-sm">{(item.cveId as string) || "\u2014"}</TableCell>
                <TableCell className="font-medium">{item.title as string}</TableCell>
                <TableCell>
                  <StatusBadge status={item.severity as string} config={severityConfig} label={t(`severity.${item.severity as string}`)} />
                </TableCell>
                <TableCell>{item.source ? t(`source.${item.source as string}`) : "\u2014"}</TableCell>
                <TableCell>
                  <StatusBadge status={item.status as string} config={statusConfig} label={t(`status.${item.status as string}`)} />
                </TableCell>
                <TableCell>{item.discoveredAt ? new Date(item.discoveredAt as string).toLocaleDateString() : "\u2014"}</TableCell>
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
