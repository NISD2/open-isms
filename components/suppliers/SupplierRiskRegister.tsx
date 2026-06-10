"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { trpc } from "@/lib/trpc/client";
import { BSI_ELEMENTARY_THREATS, BSI_THREAT_CATEGORIES, type BsiThreat } from "@/lib/compliance/bsi-threats";
import { getRiskScoreColor, RISK_SCORE_COLORS, type ScaleLevel } from "@/lib/compliance/risk-methodology-defaults";
import { RiskMatrixPicker } from "../risks/RiskMatrixPicker";
import type { companyRiskMethodology, risk as riskSchema, riskSupplier as rsSchema, supplier as supplierSchema } from "@/schema";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown, ChevronRight, Plus, Trash2, X, Loader2, Building2 } from "lucide-react";

type MethodologyRow = typeof companyRiskMethodology.$inferSelect;
type RiskRow = typeof riskSchema.$inferSelect;

interface SupplierRiskRegisterProps {
  initialData?: Record<string, unknown> | null;
  disabled?: boolean;
  guidance?: unknown;
}

type RiskSupplierWithSupplier = typeof rsSchema.$inferSelect & {
  supplier: Pick<typeof supplierSchema.$inferSelect, "id" | "name" | "riskLevel">;
};

type RiskWithSuppliers = RiskRow & {
  riskSuppliers: RiskSupplierWithSupplier[];
};

interface Supplier {
  id: string;
  name: string;
  riskLevel: string | null;
}

const TREATMENTS = ["mitigate", "accept", "transfer", "avoid"] as const;

function scoreColor(score: number, maxScore: number) {
  return RISK_SCORE_COLORS[getRiskScoreColor(score, maxScore)];
}

export function SupplierRiskRegister({ initialData, disabled }: SupplierRiskRegisterProps) {
  const t = useTranslations("risks");
  const ts = useTranslations("suppliers");
  const locale = useLocale();
  const router = useRouter();
  const utils = trpc.useUtils();
  const invalidate = () => { utils.risk.listWithSuppliers.invalidate(); router.refresh(); };

  const methodology = initialData?.methodology as MethodologyRow | undefined;
  const serverSuppliers = (initialData?.suppliers ?? []) as Supplier[];
  const likelihoodLevels = (methodology?.likelihoodLevels ?? []) as ScaleLevel[];
  const impactLevels = (methodology?.impactLevels ?? []) as ScaleLevel[];
  const maxScore = likelihoodLevels.length * impactLevels.length || 16;

  const { data: risks } = trpc.risk.listWithSuppliers.useQuery(undefined, {
    initialData: (initialData?.risks ?? []) as RiskWithSuppliers[],
  });

  const createMut = trpc.risk.create.useMutation({ onSuccess: invalidate });
  const deleteMut = trpc.risk.delete.useMutation({ onSuccess: invalidate });
  const linkMut = trpc.risk.linkSupplier.useMutation({ onSuccess: invalidate });

  const [expandedSuppliers, setExpandedSuppliers] = useState<Set<string>>(new Set(serverSuppliers.map(s => s.id)));
  const [addingToSupplier, setAddingToSupplier] = useState<string | null>(null);

  // Group risks by supplier
  const risksBySupplier = new Map<string, RiskWithSuppliers[]>();
  const unlinkedRisks: RiskWithSuppliers[] = [];
  for (const r of risks ?? []) {
    if (r.riskSuppliers.length === 0) {
      unlinkedRisks.push(r);
    } else {
      for (const rs of r.riskSuppliers) {
        const list = risksBySupplier.get(rs.supplierId) ?? [];
        list.push(r);
        risksBySupplier.set(rs.supplierId, list);
      }
    }
  }

  const suppliersWithRisks = serverSuppliers.filter(s => risksBySupplier.has(s.id));
  const suppliersWithout = serverSuppliers.filter(s => !risksBySupplier.has(s.id));

  function toggleSupplier(id: string) {
    setExpandedSuppliers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      {/* Suppliers with risks */}
      {suppliersWithRisks.map(sup => (
        <SupplierSection
          key={sup.id}
          supplier={sup}
          risks={risksBySupplier.get(sup.id) ?? []}
          expanded={expandedSuppliers.has(sup.id)}
          onToggle={() => toggleSupplier(sup.id)}
          scoreColor={(s) => scoreColor(s, maxScore)}
          onAddRisk={() => setAddingToSupplier(sup.id)}
          onDeleteRisk={(id) => {
            if (window.confirm(t("deleteConfirm"))) deleteMut.mutate({ id });
          }}
          addingForm={addingToSupplier === sup.id ? (
            <InlineRiskForm
              likelihoodLevels={likelihoodLevels}
              impactLevels={impactLevels}
              locale={locale}
              disabled={disabled}
              onSave={(data) => {
                createMut.mutate(data, {
                  onSuccess: (newRisk) => {
                    if (newRisk) {
                      linkMut.mutate({ riskId: newRisk.id, supplierId: sup.id }, {
                        onSettled: () => setAddingToSupplier(null),
                      });
                    } else {
                      setAddingToSupplier(null);
                    }
                  },
                });
              }}
              onCancel={() => setAddingToSupplier(null)}
              isPending={createMut.isPending || linkMut.isPending}
            />
          ) : null}
          disabled={disabled}
        />
      ))}

      {/* Suppliers without risks */}
      {suppliersWithout.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm text-muted-foreground">{ts("suppliersNoRisks")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {suppliersWithout.map(sup => (
              <div key={sup.id} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{sup.name}</span>
                  {sup.riskLevel && (
                    <Badge variant="outline" className="text-xs">{ts(`riskLevel.${sup.riskLevel}`)}</Badge>
                  )}
                </div>
                {!disabled && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setAddingToSupplier(sup.id); setExpandedSuppliers(prev => new Set(prev).add(sup.id)); }}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    {ts("addRiskToSupplier")}
                  </Button>
                )}
              </div>
            ))}
            {addingToSupplier && suppliersWithout.some(s => s.id === addingToSupplier) && (
              <InlineRiskForm
                likelihoodLevels={likelihoodLevels}
                impactLevels={impactLevels}
                locale={locale}
                disabled={disabled}
                onSave={(data) => {
                  createMut.mutate(data, {
                    onSuccess: (newRisk) => {
                      if (newRisk) {
                        linkMut.mutate({ riskId: newRisk.id, supplierId: addingToSupplier }, {
                          onSettled: () => setAddingToSupplier(null),
                        });
                      } else {
                        setAddingToSupplier(null);
                      }
                    },
                  });
                }}
                onCancel={() => setAddingToSupplier(null)}
                isPending={createMut.isPending || linkMut.isPending}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Unlinked risks */}
      {unlinkedRisks.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm text-muted-foreground">{ts("unlinkedRisks")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 pt-0">
            {unlinkedRisks.map(r => (
              <div key={r.id} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{r.title}</span>
                  <Badge className={cn("text-xs", scoreColor(r.riskScore, maxScore))}>{r.riskScore}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {serverSuppliers.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {ts("noSuppliersYet")}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Supplier Section (collapsible)
// ---------------------------------------------------------------------------

function SupplierSection({
  supplier, risks, expanded, onToggle, scoreColor, onAddRisk, onDeleteRisk,
  addingForm, disabled,
}: {
  supplier: Supplier;
  risks: RiskWithSuppliers[];
  expanded: boolean;
  onToggle: () => void;
  scoreColor: (s: number) => string;
  onAddRisk: () => void;
  onDeleteRisk: (id: string) => void;
  addingForm: React.ReactNode;
  disabled?: boolean;
}) {
  const t = useTranslations("risks");
  const ts = useTranslations("suppliers");
  return (
    <Card>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-muted/50 transition-colors"
      >
        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium text-sm">{supplier.name}</span>
        {supplier.riskLevel && (
          <Badge variant="outline" className="text-xs">{ts(`riskLevel.${supplier.riskLevel}`)}</Badge>
        )}
        <span className="ml-auto text-xs text-muted-foreground">{t("riskCount", { count: risks.length })}</span>
      </button>

      {expanded && (
        <CardContent className="pt-0 space-y-1">
          {risks.map(r => (
            <div key={r.id} className="flex items-center justify-between py-1.5 pl-6 border-l-2 border-muted ml-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">{r.title}</span>
                <Badge className={cn("text-xs font-mono", scoreColor(r.riskScore))}>{r.riskScore}</Badge>
                {r.treatment && <Badge variant="outline" className="text-xs">{t(`treatment.${r.treatment}`)}</Badge>}
              </div>
              {!disabled && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDeleteRisk(r.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
          {addingForm}
          {!addingForm && !disabled && (
            <Button variant="ghost" size="sm" className="ml-6 mt-1" onClick={onAddRisk}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              {ts("addRiskToSupplier")}
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Inline Risk Form (same as AssetRiskRegister)
// ---------------------------------------------------------------------------

function InlineRiskForm({
  likelihoodLevels,
  impactLevels,
  locale,
  disabled,
  onSave,
  onCancel,
  isPending,
}: {
  likelihoodLevels: ScaleLevel[];
  impactLevels: ScaleLevel[];
  locale: string;
  disabled?: boolean;
  onSave: (data: { title: string; description: string; category: string; likelihood: number; impact: number; treatment: typeof TREATMENTS[number] }) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const t = useTranslations("risks");
  const ts = useTranslations("suppliers");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [likelihood, setLikelihood] = useState<number | undefined>();
  const [impact, setImpact] = useState<number | undefined>();
  const [treatment, setTreatment] = useState<typeof TREATMENTS[number]>("mitigate");
  const [threatOpen, setThreatOpen] = useState(false);

  function selectThreat(threat: BsiThreat) {
    const label = locale === "de" ? threat.labelDe : threat.labelEn;
    setTitle(`${threat.code} — ${label}`);
    setDescription(label);
    const catLabel = locale === "de"
      ? BSI_THREAT_CATEGORIES[threat.category].labelDe
      : BSI_THREAT_CATEGORIES[threat.category].labelEn;
    setCategory(catLabel);
    setThreatOpen(false);
  }

  function handleSubmit() {
    if (!title || likelihood == null || impact == null) return;
    onSave({
      title,
      description: description || title,
      category,
      likelihood,
      impact,
      treatment,
    });
  }

  return (
    <div className="ml-6 mt-2 p-4 border rounded-lg bg-muted/30 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{ts("addRiskToSupplier")}</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCancel}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* BSI Threat Selector */}
      <div className="space-y-1.5">
        <Label className="text-xs">{t("selectThreat")}</Label>
        <Popover open={threatOpen} onOpenChange={setThreatOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="w-full justify-start font-normal">
              {title || t("selectThreat")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <Command>
              <CommandInput placeholder={t("searchThreats")} />
              <CommandList>
                <CommandEmpty>{t("noThreatsFound")}</CommandEmpty>
                {Object.entries(BSI_THREAT_CATEGORIES).map(([cat, labels]) => (
                  <CommandGroup key={cat} heading={locale === "de" ? labels.labelDe : labels.labelEn}>
                    {BSI_ELEMENTARY_THREATS.filter(th => th.category === cat).map(th => (
                      <CommandItem
                        key={th.code}
                        value={`${th.code} ${th.labelEn} ${th.labelDe}`}
                        onSelect={() => selectThreat(th)}
                      >
                        <span className="font-mono text-xs text-muted-foreground mr-2">{th.code}</span>
                        {locale === "de" ? th.labelDe : th.labelEn}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <Label className="text-xs">{t("fields.title")}</Label>
        <Input value={title} onChange={e => setTitle(e.target.value)} disabled={disabled} />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">{t("fields.description")}</Label>
        <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} disabled={disabled} />
      </div>

      {/* Risk Matrix */}
      <div className="space-y-1.5">
        <Label className="text-xs">{t("riskAssessment")}</Label>
        <RiskMatrixPicker
          likelihoodLevels={likelihoodLevels}
          impactLevels={impactLevels}
          selectedLikelihood={likelihood}
          selectedImpact={impact}
          onChange={(l, i) => { setLikelihood(l); setImpact(i); }}
          disabled={disabled}
        />
      </div>

      {/* Treatment + Category */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">{t("fields.treatment")}</Label>
          <Select value={treatment} onValueChange={(v) => setTreatment(v as typeof TREATMENTS[number])} disabled={disabled}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TREATMENTS.map(tr => (
                <SelectItem key={tr} value={tr}>{t(`treatment.${tr}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t("fields.category")}</Label>
          <Input value={category} onChange={e => setCategory(e.target.value)} disabled={disabled} />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>{t("cancel")}</Button>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!title || likelihood == null || impact == null || isPending || disabled}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("addRisk")}
        </Button>
      </div>
    </div>
  );
}
