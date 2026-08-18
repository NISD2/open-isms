import { getTranslations, getLocale } from "next-intl/server";
import { api } from "@/lib/trpc/server";
import { getComplianceMessages } from "@/lib/messages";
import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default async function ExportPage() {
  const [t, locale, assessments] = await Promise.all([
    getTranslations("export"),
    getLocale(),
    api.assessment.listAssessments(),
  ]);
  const compliance = await getComplianceMessages(locale);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <FileDown className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      {assessments.length === 0 ? (
        <p className="text-muted-foreground">{t("noAssessments")}</p>
      ) : (
        <div className="space-y-4">
          {assessments.map((assessment) => {
            const completed = assessment.completedRequirements ?? 0;
            const total = assessment.totalRequirements ?? 0;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <Card key={assessment.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">
                        {compliance.compliance.frameworkName}
                      </CardTitle>
                      <CardDescription>
                        {t("started")}{" "}
                        {new Date(assessment.startedAt).toLocaleDateString(
                          locale === "de" ? "de-DE" : "en-US",
                        )}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="font-mono text-xs">
                      {assessment.framework.code.toUpperCase()}{" "}
                      {assessment.framework.version}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t("progress", { completed, total })}
                      </span>
                      <span className="font-medium">
                        {pct}% {t("compliance")}
                      </span>
                    </div>
                    <Progress value={pct} className="h-2" />
                    <div className="flex justify-end">
                      <Button asChild>
                        <a
                          href={`/api/export/report?assessmentId=${assessment.id}&locale=${locale}`}
                        >
                          <FileDown className="mr-2 h-4 w-4" />
                          {t("download")}
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
