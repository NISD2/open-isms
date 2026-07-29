"use client";

import { cn } from "@/lib/utils";
import { getRiskScoreColor, RISK_SCORE_COLORS, type ScaleLevel } from "@/lib/compliance/risk-methodology-defaults";
import { useTranslations } from "next-intl";

interface RiskMatrixPickerProps {
  likelihoodLevels: ScaleLevel[];
  impactLevels: ScaleLevel[];
  selectedLikelihood?: number;
  selectedImpact?: number;
  onChange: (likelihood: number, impact: number) => void;
  disabled?: boolean;
  compact?: boolean;
}

export function RiskMatrixPicker({
  likelihoodLevels,
  impactLevels,
  selectedLikelihood,
  selectedImpact,
  onChange,
  disabled,
  compact,
}: RiskMatrixPickerProps) {
  const t = useTranslations("methodology");
  const maxScore = likelihoodLevels.length * impactLevels.length;
  const selectedScore =
    selectedLikelihood != null && selectedImpact != null
      ? selectedLikelihood * selectedImpact
      : null;

  return (
    <div className="space-y-1.5">
      {selectedScore != null && (
        <p className="text-sm font-medium">
          {t("selectedScore")}: <span className={cn("inline-block rounded px-1.5 py-0.5 text-xs font-mono", RISK_SCORE_COLORS[getRiskScoreColor(selectedScore, maxScore)])}>{selectedScore}</span>
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="text-xs">
          <thead>
            <tr>
              <th className="px-1 py-1" />
              {impactLevels.map((imp) => (
                <th
                  key={imp.value}
                  className="px-1 py-1 text-center font-normal text-muted-foreground"
                  title={imp.description}
                >
                  {imp.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...likelihoodLevels].reverse().map((lik) => (
              <tr key={lik.value}>
                <td
                  className="px-1 py-1 text-right font-normal text-muted-foreground whitespace-nowrap pr-2"
                  title={lik.description}
                >
                  {lik.label}
                </td>
                {impactLevels.map((imp) => {
                  const score = lik.value * imp.value;
                  const color = getRiskScoreColor(score, maxScore);
                  const isSelected =
                    selectedLikelihood === lik.value && selectedImpact === imp.value;
                  return (
                    <td key={imp.value} className="px-1 py-1">
                      <button
                        type="button"
                        data-testid={`matrix-cell-${lik.value}-${imp.value}`}
                        disabled={disabled}
                        onClick={() => onChange(lik.value, imp.value)}
                        className={cn(
                          compact ? "w-8 h-7" : "w-10 h-8",
                          "rounded flex items-center justify-center font-mono font-medium text-xs transition-all",
                          RISK_SCORE_COLORS[color],
                          isSelected && "ring-2 ring-offset-2 ring-foreground scale-110",
                          !disabled && "hover:opacity-80 cursor-pointer",
                          disabled && "opacity-50 cursor-not-allowed",
                        )}
                      >
                        {score}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!compact && (
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>{t("clickToSelect")}</span>
        </div>
      )}
    </div>
  );
}
