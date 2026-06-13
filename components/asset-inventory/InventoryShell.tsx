"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

import {
  classifyInventory,
  defaultQuestionsFor,
  emptyInventory,
} from "@/lib/asset-inventory/classify";
import type { AssetLayer, Inventory } from "@/lib/asset-inventory/types";

import { OutputCard } from "./OutputCard";
import { QuestionStep } from "./QuestionStep";
import { SectorPicker } from "./SectorPicker";

/**
 * Top-level client shell for the asset-inventory wizard.
 *
 * State shape mirrors what a server-persistent version would store, so the
 * same shell can later wrap with TRPC mutations in the portal. Step state
 * lives here; the wizard advances linearly: Sector picker → universal
 * questions → output.
 */
export function InventoryShell() {
  const t = useTranslations("assetInventory");
  const [inventory, setInventory] = useState<Inventory>(emptyInventory());
  const [stepIndex, setStepIndex] = useState(0);

  const questions = useMemo(() => defaultQuestionsFor(inventory), [inventory]);
  // Steps: [sector picker, ...question steps, output]
  const totalSteps = 1 + questions.length + 1;
  const isSectorStep = stepIndex === 0;
  const isOutputStep = stepIndex === totalSteps - 1;
  const currentQuestion = isSectorStep || isOutputStep
    ? null
    : questions[stepIndex - 1];

  const progress = Math.round((stepIndex / (totalSteps - 1)) * 100);

  const output = useMemo(() => {
    return classifyInventory(inventory, questions, {
      resolveAssetName: (questionId, optionId, _layer: AssetLayer) =>
        t(`questions.${questionId}.options.${optionId}`),
    });
  }, [inventory, questions, t]);

  function setSectors(next: string[]) {
    setInventory({ ...inventory, sectors: next });
  }

  function setAnswers(questionId: string, optionIds: string[]) {
    setInventory({
      ...inventory,
      answers: { ...inventory.answers, [questionId]: optionIds },
    });
  }

  function goNext() {
    if (stepIndex < totalSteps - 1) setStepIndex(stepIndex + 1);
  }

  function goBack() {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  }

  function restart() {
    setInventory(emptyInventory());
    setStepIndex(0);
  }

  // Sector step requires at least one selection to advance.
  // Question steps don't require selections (user might not have any).
  const canAdvance = isSectorStep ? inventory.sectors.length > 0 : true;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {t("steps.label", {
            current: stepIndex + 1,
            total: totalSteps,
          })}
        </span>
        {!isSectorStep && (
          <Button variant="ghost" size="sm" onClick={restart}>
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            {t("steps.restart")}
          </Button>
        )}
      </div>
      <Progress value={progress} />

      {isSectorStep && (
        <div className="space-y-3">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold leading-tight">
              {t("sectorPicker.question")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("sectorPicker.helpText")}
            </p>
          </div>
          <SectorPicker selected={inventory.sectors} onChange={setSectors} />
        </div>
      )}

      {currentQuestion && (
        <QuestionStep
          step={currentQuestion}
          selected={inventory.answers[currentQuestion.id] ?? []}
          onChange={(next) => setAnswers(currentQuestion.id, next)}
        />
      )}

      {isOutputStep && <OutputCard output={output} />}

      <div className="flex items-center justify-between gap-2 print:hidden">
        <Button variant="outline" onClick={goBack} disabled={stepIndex === 0}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("steps.back")}
        </Button>
        {!isOutputStep && (
          <Button onClick={goNext} disabled={!canAdvance}>
            {t("steps.next")}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
