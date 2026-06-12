"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Download, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import type { MatrixResult } from "@/lib/risk-assessment/types";

import { ResultCard } from "./ResultCard";
import { ResultPanel } from "./ResultPanel";
import { RiskAssessmentTool } from "./RiskAssessmentTool";

interface RiskAssessmentShellProps {
  exampleResult: MatrixResult;
}

/**
 * Top-level client shell for the risk assessment page.
 *
 * Owns the result state so the SAME ResultCard at the top of the page can
 * show an example before the user starts, then update to their live result
 * once they complete the quiz. No double-render of "result here vs result
 * there"; one card, two states.
 *
 * Below the card: either the questionnaire (when no result yet) or the
 * detailed breakdown sections (after completion). Restart resets to the
 * example.
 */
export function RiskAssessmentShell({ exampleResult }: RiskAssessmentShellProps) {
  const t = useTranslations("riskAssessment");
  const [result, setResult] = useState<MatrixResult | null>(null);

  const isExample = !result;
  const displayResult = result ?? exampleResult;

  function handlePrint() {
    if (typeof window !== "undefined") {
      window.print();
    }
  }

  function handleRestart() {
    setResult(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-2 print:hidden">
        {result && (
          <Button variant="outline" size="sm" onClick={handleRestart}>
            <RotateCcw className="w-4 h-4 mr-2" />
            {t("steps.restart")}
          </Button>
        )}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={result ? -1 : 0}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  disabled={!result}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {t("actions.exportPdf")}
                </Button>
              </span>
            </TooltipTrigger>
            {!result && (
              <TooltipContent>{t("actions.exportPdfDisabled")}</TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      <ResultCard result={displayResult} isExample={isExample} />

      {result ? (
        <ResultPanel result={result} />
      ) : (
        <div className="print:hidden">
          <RiskAssessmentTool onComplete={setResult} />
        </div>
      )}
    </div>
  );
}
