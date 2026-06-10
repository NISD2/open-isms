"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { trpc } from "@/lib/trpc/client";
import { BSI_ELEMENTARY_THREATS, BSI_THREAT_CATEGORIES, type BsiThreat } from "@/lib/compliance/bsi-threats";
import { getRiskScoreColor, RISK_SCORE_COLORS, type ScaleLevel } from "@/lib/compliance/risk-methodology-defaults";
import { RiskMatrixPicker } from "./RiskMatrixPicker";
import type { companyRiskMethodology, risk as riskSchema, riskAsset as raSchema, asset as assetSchema } from "@/schema";
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
import { ChevronDown, ChevronRight, Plus, Trash2, X, Loader2, Server } from "lucide-react";

type MethodologyRow = typeof companyRiskMethodology.$inferSelect;
type RiskRow = typeof riskSchema.$inferSelect;

interface AssetRiskRegisterProps {
  initialData?: Record<string, unknown> | null;
  disabled?: boolean;
  guidance?: unknown;
}

type RiskAssetWithAsset = typeof raSchema.$inferSelect & {
  asset: Pick<typeof assetSchema.$inferSelect, "id" | "name" | "type">;
};

type RiskWithAssets = RiskRow & {
  riskAssets: RiskAssetWithAsset[];
};

interface Asset {
  id: string;
  name: string;
  type: string | null;
  isCritical: boolean | null;
  isOT: boolean | null;
}

const TREATMENTS = ["mitigate", "accept", "transfer", "avoid"] as const;

function scoreColor(score: number, maxScore: number) {
  return RISK_SCORE_COLORS[getRiskScoreColor(score, maxScore)];
}

export function AssetRiskRegister({ initialData, disabled }: AssetRiskRegisterProps) {
  const t = useTranslations("risks");
  const locale = useLocale();
  const router = useRouter();
  const utils = trpc.useUtils();
  const invalidate = () => { utils.risk.listWithAssets.invalidate(); router.refresh(); };

  const methodology = initialData?.methodology as MethodologyRow | undefined;
  const serverAssets = (initialData?.assets ?? []) as Asset[];
  const likelihoodLevels = (methodology?.likelihoodLevels ?? []) as ScaleLevel[];
  const impactLevels = (methodology?.impactLevels ?? []) as ScaleLevel[];
  const maxScore = likelihoodLevels.length * impactLevels.length || 16;

  const { data: risks } = trpc.risk.listWithAssets.useQuery(undefined, {
    initialData: (initialData?.risks ?? []) as RiskWithAssets[],
  });

  const createMut = trpc.risk.create.useMutation({ onSuccess: invalidate });
  const deleteMut = trpc.risk.delete.useMutation({ onSuccess: invalidate });
  const linkMut = trpc.risk.linkAsset.useMutation({ onSuccess: invalidate });

  const [expandedAssets, setExpandedAssets] = useState<Set<string>>(new Set(serverAssets.map(a => a.id)));
  const [addingToAsset, setAddingToAsset] = useState<string | null>(null);

  // Group risks by asset
  const risksByAsset = new Map<string, RiskWithAssets[]>();
  const unlinkedRisks: RiskWithAssets[] = [];
  for (const r of risks ?? []) {
    if (r.riskAssets.length === 0) {
      unlinkedRisks.push(r);
    } else {
      for (const ra of r.riskAssets) {
        const list = risksByAsset.get(ra.assetId) ?? [];
        list.push(r);
        risksByAsset.set(ra.assetId, list);
      }
    }
  }

  const assetsWithRisks = serverAssets.filter(a => risksByAsset.has(a.id));
  const assetsWithout = serverAssets.filter(a => !risksByAsset.has(a.id));

  function toggleAsset(id: string) {
    setExpandedAssets(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      {/* Assets with risks */}
      {assetsWithRisks.map(asset => (
        <AssetSection
          key={asset.id}
          asset={asset}
          risks={risksByAsset.get(asset.id) ?? []}
          expanded={expandedAssets.has(asset.id)}
          onToggle={() => toggleAsset(asset.id)}
          scoreColor={(s) => scoreColor(s, maxScore)}
          onAddRisk={() => setAddingToAsset(asset.id)}
          onDeleteRisk={(id) => {
            if (window.confirm(t("deleteConfirm"))) deleteMut.mutate({ id });
          }}
          addingForm={addingToAsset === asset.id ? (
            <InlineRiskForm
              likelihoodLevels={likelihoodLevels}
              impactLevels={impactLevels}
              locale={locale}
              disabled={disabled}
              onSave={(data) => {
                createMut.mutate(data, {
                  onSuccess: (newRisk) => {
                    if (newRisk) {
                      linkMut.mutate({ riskId: newRisk.id, assetId: asset.id }, {
                        onSettled: () => setAddingToAsset(null),
                      });
                    } else {
                      setAddingToAsset(null);
                    }
                  },
                });
              }}
              onCancel={() => setAddingToAsset(null)}
              isPending={createMut.isPending || linkMut.isPending}
            />
          ) : null}
          disabled={disabled}
        />
      ))}

      {/* Assets without risks */}
      {assetsWithout.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm text-muted-foreground">{t("assetsNoRisks")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {assetsWithout.map(asset => (
              <div key={asset.id} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{asset.name}</span>
                  {asset.type && <Badge variant="outline" className="text-xs">{asset.type}</Badge>}
                </div>
                {!disabled && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setAddingToAsset(asset.id); setExpandedAssets(prev => new Set(prev).add(asset.id)); }}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    {t("addRiskToAsset")}
                  </Button>
                )}
              </div>
            ))}
            {/* Show form if adding to an unrisked asset */}
            {addingToAsset && assetsWithout.some(a => a.id === addingToAsset) && (
              <InlineRiskForm
                likelihoodLevels={likelihoodLevels}
                impactLevels={impactLevels}
                locale={locale}
                disabled={disabled}
                onSave={(data) => {
                  createMut.mutate(data, {
                    onSuccess: (newRisk) => {
                      if (newRisk) {
                        linkMut.mutate({ riskId: newRisk.id, assetId: addingToAsset }, {
                          onSettled: () => setAddingToAsset(null),
                        });
                      } else {
                        setAddingToAsset(null);
                      }
                    },
                  });
                }}
                onCancel={() => setAddingToAsset(null)}
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
            <CardTitle className="text-sm text-muted-foreground">{t("unlinkedRisks")}</CardTitle>
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

      {serverAssets.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {t("noAssetsYet")}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Asset Section (collapsible)
// ---------------------------------------------------------------------------

function AssetSection({
  asset, risks, expanded, onToggle, scoreColor, onAddRisk, onDeleteRisk,
  addingForm, disabled,
}: {
  asset: Asset;
  risks: RiskWithAssets[];
  expanded: boolean;
  onToggle: () => void;
  scoreColor: (s: number) => string;
  onAddRisk: () => void;
  onDeleteRisk: (id: string) => void;
  addingForm: React.ReactNode;
  disabled?: boolean;
}) {
  const t = useTranslations("risks");
  return (
    <Card>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-muted/50 transition-colors"
      >
        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <Server className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium text-sm">{asset.name}</span>
        {asset.type && <Badge variant="outline" className="text-xs">{asset.type}</Badge>}
        {asset.isCritical && <Badge variant="destructive" className="text-xs">{t("critical")}</Badge>}
        {asset.isOT && <Badge variant="secondary" className="text-xs">{t("ot")}</Badge>}
        {risks.length > 0 && (
          <Badge className={cn("text-[10px] font-mono ml-2", scoreColor(Math.max(...risks.map(r => r.riskScore))))}>
            {Math.max(...risks.map(r => r.riskScore))}
          </Badge>
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
              {t("addRiskToAsset")}
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Inline Risk Form (add-only, editing happens in 2.4)
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
        <span className="text-sm font-medium">{t("addRiskToAsset")}</span>
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

      {/* Title (editable after threat selection or manual) */}
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
