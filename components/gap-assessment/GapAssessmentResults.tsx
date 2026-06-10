"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, RotateCcw, AlertTriangle, Scale, Download } from "lucide-react";
import type { AssessmentScores, GapDomain, GapQuestion } from "@/lib/gap-assessment/schema";

const MATURITY_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-700",
  initial: "bg-orange-100 text-orange-700",
  developing: "bg-amber-100 text-amber-700",
  managed: "bg-blue-100 text-blue-700",
  optimized: "bg-green-100 text-green-700",
};

export function GapAssessmentResults({
  sessionId,
  scores,
  domains,
  questions,
  locale: pageLocale,
}: {
  sessionId: string;
  scores: AssessmentScores;
  domains: GapDomain[];
  questions: GapQuestion[];
  locale: string;
}) {
  const t = useTranslations("gap-assessment");
  const locale = useLocale();

  const criticalGaps = scores.gaps.filter((g) => g.criticality === 3).length;
  const fineExposed = scores.gaps.filter((g) => g.fineExposure).length;
  const personalLiability = scores.gaps.filter((g) => g.consequence === 3).length;
  const quickWins = scores.gaps.filter((g) => g.timeToFix === 0).length;

  function getDomainName(domainId: number): string {
    const d = domains.find((dom) => dom.id === domainId);
    if (!d) return `Domain ${domainId}`;
    return locale === "de" ? d.name.de : d.name.en;
  }

  function getQuestionText(questionId: string): string {
    const q = questions.find((qu) => qu.id === questionId);
    if (!q) return questionId;
    return locale === "de" ? q.text.de : q.text.en;
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("results.heading")}</h1>
          <p className="text-sm text-muted-foreground">
            {scores.totalAnswered} / {scores.totalQuestions} {t("results.answered")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href={`/api/export/gap-assessment?sessionId=${sessionId}&locale=${pageLocale}`}>
              <Download className="mr-2 h-4 w-4" />
              {t("results.exportPdf")}
            </a>
          </Button>
        </div>
      </header>

      {/* Overall score */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-5xl font-bold">{scores.overall}%</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("results.overallScore")}</p>
            </div>
            <div className="flex-1 space-y-2">
              <Progress value={scores.overall} className="h-3" />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="text-center text-xs">
                  <p className="font-semibold text-red-600">{criticalGaps}</p>
                  <p className="text-muted-foreground">{t("results.summary.criticalGaps", { count: criticalGaps })}</p>
                </div>
                <div className="text-center text-xs">
                  <p className="font-semibold text-amber-600">{fineExposed}</p>
                  <p className="text-muted-foreground">{t("results.summary.fineExposed", { count: fineExposed })}</p>
                </div>
                <div className="text-center text-xs">
                  <p className="font-semibold text-orange-600">{personalLiability}</p>
                  <p className="text-muted-foreground">{t("results.summary.personalLiability", { count: personalLiability })}</p>
                </div>
                <div className="text-center text-xs">
                  <p className="font-semibold text-green-600">{quickWins}</p>
                  <p className="text-muted-foreground">{t("results.summary.quickWins", { count: quickWins })}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Domain scores */}
      <Card>
        <CardHeader>
          <CardTitle>{t("results.domainScores")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {scores.domains.map((d) => (
              <div key={d.domainId} className="flex items-center gap-3">
                <div className="w-48 shrink-0">
                  <p className="text-sm font-medium truncate">{getDomainName(d.domainId)}</p>
                </div>
                <div className="flex-1">
                  <Progress value={d.percentage} className="h-2" />
                </div>
                <div className="w-12 text-right text-sm font-medium">{d.percentage}%</div>
                <Badge className={MATURITY_COLORS[d.maturity] ?? ""} variant="secondary">
                  {t(`results.maturityLevels.${d.maturity}`)}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Priority gaps */}
      <Card>
        <CardHeader>
          <CardTitle>{t("results.priorityGaps")}</CardTitle>
        </CardHeader>
        <CardContent>
          {scores.gaps.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("results.noGaps")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>{t("results.gapQuestion")}</TableHead>
                  <TableHead>{t("results.gapDomain")}</TableHead>
                  <TableHead>{t("results.gapConsequence")}</TableHead>
                  <TableHead>{t("results.gapTimeToFix")}</TableHead>
                  <TableHead className="w-8">{t("results.fineRisk")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scores.gaps.slice(0, 30).map((gap, i) => (
                  <TableRow key={gap.questionId}>
                    <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="text-sm max-w-xs">
                      {getQuestionText(gap.questionId)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {getDomainName(gap.domain)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {t(`results.consequenceLevels.${gap.consequence}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {t(`results.timeToFixLevels.${gap.timeToFix}`)}
                    </TableCell>
                    <TableCell>
                      {gap.fineExposure && <Scale className="h-3.5 w-3.5 text-red-500" />}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/dashboard">
            {t("results.startCompliance")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/gap-assessment">
            <RotateCcw className="mr-2 h-4 w-4" />
            {t("results.retakeAssessment")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
