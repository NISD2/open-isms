"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  ChevronDown,
  Flame,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Server,
  ShieldCheck,
  Target,
  TrendingUp,
  Truck,
  GitBranch,
  Search,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";

interface DashboardSummary {
  risks: { total: number; high: number; byTreatment: Record<string, number> };
  assets: { total: number; critical: number; ot: number };
  incidents: { total: number; bySeverity: Record<string, number> };
  suppliers: { total: number; byRiskLevel: Record<string, number> };
  policies: { total: number; byStatus: Record<string, number> };
  training: { total: number; management: number };
  exercises: { total: number; completed: number };
  kpis: { total: number };
  changes: { total: number; open: number };
  patches: { total: number; pending: number };
  audits: { total: number; planned: number };
  improvements: { total: number; open: number };
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  href,
}: {
  title: string;
  value: number;
  subtitle?: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link href={href as never} prefetch={false}>
      <Card className="hover:border-foreground/20 hover:bg-accent/50 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <span className="text-muted-foreground">{icon}</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function RiskMatrix({
  byTreatment,
  t,
}: {
  byTreatment: Record<string, number>;
  t: (key: string) => string;
}) {
  const treatments = [
    { key: "mitigate", color: "bg-blue-500" },
    { key: "accept", color: "bg-green-500" },
    { key: "transfer", color: "bg-amber-500" },
    { key: "avoid", color: "bg-red-500" },
  ];

  const total = Object.values(byTreatment).reduce((a, b) => a + b, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{t("riskTreatmentDistribution")}</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noRisksRegistered")}</p>
        ) : (
          <div className="space-y-3">
            {treatments.map((tr) => {
              const count = byTreatment[tr.key] ?? 0;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={tr.key} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{t(`treatmentLabel.${tr.key}`)}</span>
                    <span className="text-muted-foreground">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${tr.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SeverityBreakdown({
  title,
  data,
  labels,
  noDataLabel,
}: {
  title: string;
  data: Record<string, number>;
  labels: Record<string, string>;
  noDataLabel: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {Object.keys(data).length === 0 ? (
          <p className="text-sm text-muted-foreground">{noDataLabel}</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(data).map(([key, count]) => (
              <div key={key} className="flex justify-between text-sm">
                <span>{labels[key] ?? key}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ComplianceProgress {
  completed: number;
  total: number;
}

export function DashboardPage({
  summary,
  complianceProgress,
}: {
  summary: DashboardSummary;
  complianceProgress: ComplianceProgress;
}) {
  const t = useTranslations("dashboard");
  const [modulesOpen, setModulesOpen] = useState(false);
  const pct = complianceProgress.total > 0
    ? Math.round((complianceProgress.completed / complianceProgress.total) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        icon={<LayoutDashboard className="h-8 w-8 text-primary" />}
        title={t("title")}
        description={t("description")}
      />

      {/* Compliance Progress */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{t("complianceProgress")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Progress value={pct} className="flex-1" />
            <span className="text-2xl font-bold shrink-0">{pct}%</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {t("requirementsCompleted", {
              completed: complianceProgress.completed,
              total: complianceProgress.total,
            })}
          </p>
        </CardContent>
      </Card>

      {/* Row 1: Key summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          title={t("risks")}
          value={summary.risks.total}
          subtitle={`${summary.risks.high} ${t("highRisks").toLowerCase()}`}
          icon={<AlertTriangle className="h-4 w-4" />}
          href="/risks"
        />
        <StatCard
          title={t("assets")}
          value={summary.assets.total}
          subtitle={`${summary.assets.critical} ${t("criticalAssets").toLowerCase()}, ${summary.assets.ot} ${t("otAssets")}`}
          icon={<Server className="h-4 w-4" />}
          href="/assets"
        />
        <StatCard
          title={t("incidents")}
          value={summary.incidents.total}
          icon={<Flame className="h-4 w-4" />}
          href="/incidents"
        />
        <StatCard
          title={t("policies")}
          value={summary.policies.total}
          subtitle={`${summary.policies.byStatus["approved"] ?? 0} ${t("approved").toLowerCase()}`}
          icon={<FileText className="h-4 w-4" />}
          href="/policies"
        />
      </div>

      {/* Row 2: Distribution cards */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <RiskMatrix byTreatment={summary.risks.byTreatment} t={t} />
        <SeverityBreakdown
          title={t("incidentsBySeverity")}
          data={summary.incidents.bySeverity}
          labels={{
            near_miss: t("severity.nearMiss"),
            incident: t("severity.incident"),
            significant: t("severity.significant"),
          }}
          noDataLabel={t("noData")}
        />
      </div>

      {/* Rows 3+4: Collapsible module cards */}
      <Collapsible open={modulesOpen} onOpenChange={setModulesOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between mb-4 text-muted-foreground">
            <span className="text-sm font-medium">{t("allModules")}</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${modulesOpen ? "rotate-180" : ""}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <StatCard
              title={t("suppliers")}
              value={summary.suppliers.total}
              subtitle={`${summary.suppliers.byRiskLevel["critical"] ?? 0} ${t("criticalSuppliers").toLowerCase()}`}
              icon={<Truck className="h-4 w-4" />}
              href="/suppliers"
            />
            <StatCard
              title={t("training")}
              value={summary.training.total}
              subtitle={`${summary.training.management} ${t("managementTraining").toLowerCase()}`}
              icon={<GraduationCap className="h-4 w-4" />}
              href="/training"
            />
            <StatCard
              title={t("exercises")}
              value={summary.exercises.total}
              subtitle={`${summary.exercises.completed} ${t("completed").toLowerCase()}`}
              icon={<Target className="h-4 w-4" />}
              href="/exercises"
            />
            <StatCard
              title={t("kpis")}
              value={summary.kpis.total}
              icon={<BarChart3 className="h-4 w-4" />}
              href="/kpis"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title={t("changes")}
              value={summary.changes.total}
              subtitle={`${summary.changes.open} ${t("openChanges").toLowerCase()}`}
              icon={<GitBranch className="h-4 w-4" />}
              href="/changes"
            />
            <StatCard
              title={t("patches")}
              value={summary.patches.total}
              subtitle={`${summary.patches.pending} ${t("pendingPatches").toLowerCase()}`}
              icon={<ShieldCheck className="h-4 w-4" />}
              href="/patches"
            />
            <StatCard
              title={t("audits")}
              value={summary.audits.total}
              subtitle={`${summary.audits.planned} ${t("plannedAudits").toLowerCase()}`}
              icon={<Search className="h-4 w-4" />}
              href="/internal-audits"
            />
            <StatCard
              title={t("improvements")}
              value={summary.improvements.total}
              subtitle={`${summary.improvements.open} ${t("openImprovements").toLowerCase()}`}
              icon={<TrendingUp className="h-4 w-4" />}
              href="/improvements"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
