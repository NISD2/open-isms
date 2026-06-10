"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc/client";
import { supplierInsertSchema } from "@/schema/validators";
import { CrudPage } from "@/components/shared/CrudPage";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Truck, Pencil, Trash2 } from "lucide-react";

// The `supplier` table is bilateral post-C3 (entity-side inventory + portal-share
// state in one row). The entity-inventory form must hide all bilateral plumbing
// and portal-share fields — those are managed by the supplier portal handlers,
// not the inventory CRUD.
const DEFAULT_OMIT = [
  "id", "createdAt", "updatedAt",
  // Bilateral FK plumbing — set by the tRPC handler, not the form
  "customerCompanyId", "supplierCompanyId",
  // Portal-share metadata — only meaningful when the row originated in the
  // supplier portal flow, not for a manually-entered inventory row
  "customerEmail", "customerOrgName",
  "unsubscribeToken", "status", "source",
  "confirmedAt", "unsubscribedAt",
  // Free-text per-supplier detail fields kept off the default form
  "contractSecurityClauses", "auditFrequency", "monitoringMethod",
  "lastReviewDate", "dueDiligenceProcess",
];

const riskLevelConfig: Record<string, { variant: "destructive" | "default" | "secondary" | "outline"; className?: string }> = {
  critical: { variant: "destructive" },
  high: { variant: "default" },
  medium: { variant: "secondary" },
  low: { variant: "outline" },
};

interface SuppliersPageProps {
  items: Record<string, unknown>[];
  inline?: boolean;
  focus?: string[];
}

export function SuppliersPage({ items, inline, focus }: SuppliersPageProps) {
  const t = useTranslations("suppliers");
  const router = useRouter();
  const refresh = () => router.refresh();
  const createMut = trpc.supplier.create.useMutation({ onSuccess: refresh });
  const updateMut = trpc.supplier.update.useMutation({ onSuccess: refresh });
  const deleteMut = trpc.supplier.delete.useMutation({ onSuccess: refresh });

  const omit = focus
    ? DEFAULT_OMIT.filter((f) => !focus.includes(f))
    : DEFAULT_OMIT;

  return (
    <CrudPage
      items={items}
      icon={<Truck className="h-8 w-8 text-primary" />}
      inline={inline}
      namespace="suppliers"
      schema={supplierInsertSchema}
      omit={omit}
      onCreate={focus ? undefined : (data) => createMut.mutate(data)}
      onUpdate={(id, data) => updateMut.mutate({ id, ...data })}
      onDelete={focus ? undefined : (id) => deleteMut.mutate({ id })}
      isSubmitting={createMut.isPending || updateMut.isPending}
      llmPrefill={!focus}
    >
      {({ items, onEdit, onDelete }) => (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("fields.name")}</TableHead>
              <TableHead>{t("fields.serviceType")}</TableHead>
              <TableHead>{t("fields.riskLevel")}</TableHead>
              <TableHead>{t("fields.contactName")}</TableHead>
              <TableHead>{t("fields.isCritical")}</TableHead>
              <TableHead>{t("fields.hasSecurityCertification")}</TableHead>
              <TableHead className="text-right">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id as string}>
                <TableCell className="font-medium">{item.name as string}</TableCell>
                <TableCell>{item.serviceType as string}</TableCell>
                <TableCell>
                  <StatusBadge status={item.riskLevel as string} config={riskLevelConfig} label={t(`riskLevel.${item.riskLevel as string}`)} />
                </TableCell>
                <TableCell>{(item.contactName as string) || "\u2014"}</TableCell>
                <TableCell>
                  {item.isCritical ? <Badge variant="destructive">{t("critical")}</Badge> : <Badge variant="outline">{t("nonCritical")}</Badge>}
                </TableCell>
                <TableCell>
                  {item.hasSecurityCertification
                    ? <Badge variant="secondary">{(item.securityCertificationType as string) || "Certified"}</Badge>
                    : <span className="text-muted-foreground">{"\u2014"}</span>}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(item)}><Pencil className="h-4 w-4" /></Button>
                  {!focus && <Button variant="ghost" size="icon" onClick={() => onDelete(item.id as string)}><Trash2 className="h-4 w-4" /></Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </CrudPage>
  );
}
