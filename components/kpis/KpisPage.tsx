"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc/client";
import { kpiMeasurementInsertSchema } from "@/schema/validators";
import { CrudPage } from "@/components/shared/CrudPage";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { BarChart3 } from "lucide-react";

const kpiStatusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
  green: { variant: "default", className: "bg-green-600 text-white" },
  amber: { variant: "secondary", className: "bg-amber-500 text-white" },
  red: { variant: "destructive" },
};

export function KpisPage({ items, inline }: { items: Record<string, unknown>[]; inline?: boolean }) {
  const t = useTranslations("kpis");
  const router = useRouter();
  const createMut = trpc.kpi.create.useMutation({ onSuccess: () => router.refresh() });

  return (
    <CrudPage
      items={items}
      icon={<BarChart3 className="h-8 w-8 text-primary" />}
      inline={inline}
      namespace="kpis"
      schema={kpiMeasurementInsertSchema}
      omit={["id", "companyId", "createdAt"]}
      onCreate={(data) => createMut.mutate(data)}
      isSubmitting={createMut.isPending}
      llmPrefill
    >
      {({ items }) => (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("fields.kpiName")}</TableHead>
              <TableHead>{t("fields.measuredAt")}</TableHead>
              <TableHead>{t("fields.value")}</TableHead>
              <TableHead>{t("fields.target")}</TableHead>
              <TableHead>{t("fields.unit")}</TableHead>
              <TableHead>{t("fields.status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id as string}>
                <TableCell className="font-medium">{item.kpiName as string}</TableCell>
                <TableCell>{item.measuredAt ? new Date(item.measuredAt as string).toLocaleDateString() : "\u2014"}</TableCell>
                <TableCell>{String(item.value ?? "\u2014")}</TableCell>
                <TableCell>{String(item.target ?? "\u2014")}</TableCell>
                <TableCell>{String(item.unit ?? "\u2014")}</TableCell>
                <TableCell>
                  {(item.status as string) ? (
                    <StatusBadge status={item.status as string} config={kpiStatusConfig} label={t(`status.${item.status as string}`)} />
                  ) : "\u2014"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </CrudPage>
  );
}
