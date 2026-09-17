"use client";

import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { AdvisoryTopic } from "@/lib/advisory-options";
import { AdvisoryDetailStep } from "./AdvisoryDetailStep";
import { AdvisoryRequestStep } from "./AdvisoryRequestStep";

/**
 * Where the three screens of the request live, and nothing else.
 *
 * The state is a union rather than a nullable id plus a done flag, so "finished
 * a request that was never saved" cannot be spelled. The id is carried by the
 * one state that has one, which is also the only state that can use it.
 */
type Step =
  | { kind: "request" }
  | { kind: "detail"; requestId: string }
  | { kind: "done" };

/**
 * The request form on /hilfe, replacing a mailto that left nothing to count,
 * nothing to time and nothing to bill for, and that failed silently on any
 * device with no mail client configured.
 *
 * The shape that matters is the order: subject and address first, everything
 * else after the row exists. See the two step components for why.
 */
export function AdvisoryRequestForm({
  defaultTopic,
  requirementCode,
  sourcePath,
}: {
  defaultTopic?: AdvisoryTopic;
  requirementCode?: string | null;
  sourcePath?: string | null;
}) {
  const t = useTranslations("help.request");
  const [step, setStep] = useState<Step>({ kind: "request" });

  if (step.kind === "request") {
    return (
      <AdvisoryRequestStep
        defaultTopic={defaultTopic}
        requirementCode={requirementCode}
        sourcePath={sourcePath}
        onSaved={(requestId) => setStep({ kind: "detail", requestId })}
      />
    );
  }

  if (step.kind === "detail") {
    return (
      <AdvisoryDetailStep
        requestId={step.requestId}
        onDone={() => setStep({ kind: "done" })}
      />
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card p-5" role="status">
      <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
      <div className="space-y-1">
        <p className="font-semibold">{t("success.heading")}</p>
        <p className="text-sm text-muted-foreground">{t("success.body")}</p>
      </div>
    </div>
  );
}
