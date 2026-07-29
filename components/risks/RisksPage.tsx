"use client";

import { useMemo, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc/client";
import { riskInsertSchema } from "@/schema/validators";
import { getRiskScoreColor, RISK_SCORE_COLORS, type ScaleLevel } from "@/lib/compliance/risk-methodology-defaults";
import type { companyRiskMethodology } from "@/schema";

type MethodologyRow = typeof companyRiskMethodology.$inferSelect;
import type { FieldOverride } from "@/lib/forms/field-renderer";
import { CrudPage } from "@/components/shared/CrudPage";
import { RiskScaleModal } from "./RiskScaleModal";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Pencil, Trash2, Link2 } from "lucide-react";
import { LinkAssetsDialog } from "./LinkAssetsDialog";

const treatmentConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
  mitigate: { variant: "default", className: "bg-blue-600 text-white" },
  accept: { variant: "default", className: "bg-green-600 text-white" },
  transfer: { variant: "secondary", className: "bg-amber-500 text-white" },
  avoid: { variant: "destructive" },
};

function buildScaleOptions(levels: ScaleLevel[]) {
  return levels.map((l) => ({
    value: String(l.value),
    label: `${l.value} — ${l.label}`,
  }));
}

export function RisksPage({ items, inline, methodology: serverMethodology, assets = [] }: { items: Record<string, unknown>[]; inline?: boolean; methodology?: Record<string, unknown> | null; assets?: Record<string, unknown>[] }) {
  const t = useTranslations("risks");
  const router = useRouter();
  const [linkRiskId, setLinkRiskId] = useState<string | null>(null);
  const refresh = () => router.refresh();
  const createMut = trpc.risk.create.useMutation({ onSuccess: refresh });
  const updateMut = trpc.risk.update.useMutation({ onSuccess: refresh });
  const deleteMut = trpc.risk.delete.useMutation({ onSuccess: refresh });
  const { data: methodology } = trpc.risk.getMethodology.useQuery(undefined,
    serverMethodology != null
      ? { initialData: serverMethodology as MethodologyRow }
      : {},
  );

  const likelihoodLevels = (methodology?.likelihoodLevels ?? []) as ScaleLevel[];
  const impactLevels = (methodology?.impactLevels ?? []) as ScaleLevel[];
  const maxScore = likelihoodLevels.length * impactLevels.length || 16;

  const fieldOverrides = useMemo((): Record<string, FieldOverride> => {
    if (!likelihoodLevels.length) return {} as Record<string, FieldOverride>;

    const scaleRender = (levels: ScaleLevel[]): FieldOverride["render"] =>
      (field) => (
        <div className="flex items-center gap-1">
          <Select
            onValueChange={(v) => field.onChange(Number(v))}
            value={field.value != null ? String(field.value) : ""}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {levels.map((l) => (
                <SelectItem key={l.value} value={String(l.value)}>
                  <span className="font-medium">{l.value}</span>
                  <span className="mx-1.5 text-muted-foreground">—</span>
                  <span>{l.label}</span>
                  <span className="ml-1.5 text-xs text-muted-foreground">{l.description}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <RiskScaleModal />
        </div>
      );

    return {
      likelihood: { render: scaleRender(likelihoodLevels) },
      impact: { render: scaleRender(impactLevels) },
      residualLikelihood: {
        render: scaleRender(likelihoodLevels),
      },
      residualImpact: {
        render: scaleRender(impactLevels),
      },
    };
  }, [likelihoodLevels, impactLevels]);

  const scoreColor = (score: number) => {
    const level = getRiskScoreColor(score, maxScore);
    return RISK_SCORE_COLORS[level];
  };

  return (
    <>
    <CrudPage
      items={items}
      icon={<AlertTriangle className="h-8 w-8 text-primary" />}
      inline={inline}
      namespace="risks"
      schema={riskInsertSchema}
      omit={["id", "companyId", "createdAt", "updatedAt", "riskScore", "acceptedBy", "acceptedAt", "lastReviewedAt", "residualRiskScore"]}
      fieldOverrides={fieldOverrides}
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
              <TableHead>{t("fields.category")}</TableHead>
              <TableHead>{t("fields.riskScore")}</TableHead>
              <TableHead>{t("fields.treatment")}</TableHead>
              <TableHead>{t("fields.riskOwner")}</TableHead>
              <TableHead className="text-right">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const score = (Number(item.likelihood) || 0) * (Number(item.impact) || 0);
              return (
                <TableRow key={item.id as string}>
                  <TableCell className="font-medium">{item.title as string}</TableCell>
                  <TableCell>{(item.category as string) || "\u2014"}</TableCell>
                  <TableCell><Badge className={scoreColor(score)}>{score}</Badge></TableCell>
                  <TableCell>
                    <StatusBadge status={item.treatment as string} config={treatmentConfig} label={t(`treatment.${item.treatment as string}`)} />
                  </TableCell>
                  <TableCell>{(item.riskOwner as string) || "\u2014"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => setLinkRiskId(item.id as string)}><Link2 className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" data-testid="row-edit" onClick={() => onEdit(item)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" data-testid="row-delete" onClick={() => onDelete(item.id as string)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </CrudPage>
    {linkRiskId && (
      <LinkAssetsDialog
        riskId={linkRiskId}
        open={!!linkRiskId}
        onOpenChange={(open) => { if (!open) setLinkRiskId(null); }}
        assets={assets}
      />
    )}
    </>
  );
}
