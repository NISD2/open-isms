"use client";

import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc/client";
import { getRiskScoreColor, RISK_SCORE_COLORS, type ScaleLevel } from "@/lib/compliance/risk-methodology-defaults";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function RiskScaleModal() {
  const t = useTranslations("methodology");
  const { data: methodology } = trpc.risk.getMethodology.useQuery();

  if (!methodology) return null;

  const likelihood = methodology.likelihoodLevels as ScaleLevel[];
  const impact = methodology.impactLevels as ScaleLevel[];
  const maxScore = likelihood.length * impact.length;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6" type="button">
          <HelpCircle className="h-4 w-4 text-muted-foreground" />
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-2xl flex flex-col gap-6 p-6 overflow-y-auto">
        <SheetHeader className="p-0">
          <SheetTitle>{methodology.name}</SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          <ScaleTable title={t("likelihoodScale")} levels={likelihood} />
          <ScaleTable title={t("impactScale")} levels={impact} />

          <div>
            <h4 className="font-medium mb-2">{t("riskMatrix")}</h4>
            <div className="overflow-x-auto">
              <table className="border-collapse">
                <thead>
                  <tr>
                    <th className="w-20 p-1" />
                    {likelihood.map((l) => (
                      <th key={l.value} className="p-1 text-xs text-center font-normal text-muted-foreground">
                        {l.value}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...impact].reverse().map((imp) => (
                    <tr key={imp.value}>
                      <td className="p-1 text-xs text-right pr-2 text-muted-foreground">{imp.value}</td>
                      {likelihood.map((lik) => {
                        const score = lik.value * imp.value;
                        const color = getRiskScoreColor(score, maxScore);
                        return (
                          <td key={lik.value} className="p-1">
                            <div className={cn("w-10 h-10 flex items-center justify-center rounded text-xs font-medium", RISK_SCORE_COLORS[color])}>
                              {score}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {t("thresholdHelp", { threshold: methodology.acceptanceThreshold })}
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ScaleTable({ title, levels }: { title: string; levels: ScaleLevel[] }) {
  return (
    <div>
      <h4 className="font-medium mb-2">{title}</h4>
      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {levels.map((level) => (
              <tr key={level.value} className="border-b last:border-b-0">
                <td className="px-3 py-2 font-mono text-muted-foreground w-10 text-center">{level.value}</td>
                <td className="px-3 py-2 font-medium w-36">{level.label}</td>
                <td className="px-3 py-2 text-muted-foreground">{level.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
