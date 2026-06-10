"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc/client";
import { incidentInsertSchema } from "@/schema/validators";
import { CrudPage } from "@/components/shared/CrudPage";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Flame, Pencil, Trash2 } from "lucide-react";

interface BsiDeadline {
  id: string;
  reportType: string;
  incidentTitle: string;
  daysRemaining: number;
}

function urgencyColor(days: number): string {
  if (days < 0) return "text-red-600 dark:text-red-400";
  if (days < 1) return "text-orange-600 dark:text-orange-400";
  if (days <= 3) return "text-amber-600 dark:text-amber-400";
  return "text-muted-foreground";
}

function urgencyBorder(days: number): string {
  if (days < 0) return "border-red-500/50 bg-red-50/50 dark:bg-red-950/20";
  if (days < 1) return "border-orange-500/50 bg-orange-50/50 dark:bg-orange-950/20";
  if (days <= 3) return "border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20";
  return "";
}

function BsiDeadlinesBanner({ deadlines }: { deadlines: BsiDeadline[] }) {
  const t = useTranslations("incidents");

  if (deadlines.length === 0) return null;

  return (
    <Card className={`mb-6 ${urgencyBorder(Math.min(...deadlines.map((d) => d.daysRemaining)))}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          {t("bsiDeadlines.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {deadlines.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between py-2 px-3 rounded-md bg-accent/30 text-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono text-xs text-muted-foreground shrink-0">
                  {t(`bsiDeadlines.reportType.${d.reportType}`)}
                </span>
                <span className="truncate">{d.incidentTitle}</span>
              </div>
              <span className={`text-xs font-medium shrink-0 ml-3 ${urgencyColor(d.daysRemaining)}`}>
                {d.daysRemaining < 0
                  ? t("bsiDeadlines.overdue")
                  : d.daysRemaining === 0
                    ? t("bsiDeadlines.dueToday")
                    : t("bsiDeadlines.dueIn", { days: d.daysRemaining })}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

const severityConfig: Record<string, { variant: "secondary" | "default" | "destructive"; className?: string }> = {
  near_miss: { variant: "secondary" },
  incident: { variant: "default" },
  significant: { variant: "destructive" },
};

export function IncidentsPage({
  items,
  bsiDeadlines,
  inline,
}: {
  items: Record<string, unknown>[];
  bsiDeadlines: BsiDeadline[];
  inline?: boolean;
}) {
  const t = useTranslations("incidents");
  const router = useRouter();
  const refresh = () => router.refresh();
  const createMut = trpc.incident.create.useMutation({ onSuccess: refresh });
  const updateMut = trpc.incident.update.useMutation({ onSuccess: refresh });
  const deleteMut = trpc.incident.delete.useMutation({ onSuccess: refresh });

  return (
    <>
    <BsiDeadlinesBanner deadlines={bsiDeadlines} />
    <CrudPage
      items={items}
      icon={<Flame className="h-8 w-8 text-primary" />}
      inline={inline}
      namespace="incidents"
      schema={incidentInsertSchema}
      omit={["id", "companyId", "createdAt", "updatedAt", "createdBy", "affectedCountries"]}
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
              <TableHead>{t("fields.severity")}</TableHead>
              <TableHead>{t("fields.discoveredAt")}</TableHead>
              <TableHead>{t("fields.resolvedAt")}</TableHead>
              <TableHead className="text-right">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id as string}>
                <TableCell className="font-medium">{item.title as string}</TableCell>
                <TableCell>
                  <StatusBadge status={item.severity as string} config={severityConfig} label={t(`severity.${item.severity as string}`)} />
                </TableCell>
                <TableCell>{item.discoveredAt ? new Date(item.discoveredAt as string).toLocaleDateString() : "\u2014"}</TableCell>
                <TableCell>{item.resolvedAt ? new Date(item.resolvedAt as string).toLocaleDateString() : "\u2014"}</TableCell>
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
    </>
  );
}
