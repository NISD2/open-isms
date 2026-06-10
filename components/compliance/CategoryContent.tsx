"use client";

import { useTranslations } from "next-intl";
import { RequirementCard } from "./RequirementCard";

export interface StatusRow {
  requirementId: string;
  currentStatus: string;
  nextReviewDate?: string | null;
  assigneeName?: string | null;
  completionPct?: number | null;
}

export interface RequirementRow {
  id: string;
  code: string;
  title: string;
  description: string;
  priority: string;
  frequency: string;
  legalRef: string | null;
  moduleRef: string | null;
}

interface CategoryContentProps {
  requirements: RequirementRow[];
  statuses: StatusRow[];
  categorySlug: string;
}

export function CategoryContent({
  requirements,
  statuses,
  categorySlug,
}: CategoryContentProps) {
  const t = useTranslations("compliance");

  const statusMap = new Map(statuses.map((s) => [s.requirementId, s]));

  if (requirements.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">{t("noRequirements")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {requirements.map((req) => {
        const status = statusMap.get(req.id);
        const currentStatus = (status?.currentStatus ?? "not_started") as
          | "not_started"
          | "in_progress"
          | "completed"
          | "not_applicable"
          | "needs_review"
          | "approved"
          | "rejected";

        return (
          <RequirementCard
            key={req.id}
            code={req.code}
            title={req.title}
            description={req.description}
            priority={req.priority}
            frequency={req.frequency}
            legalRef={req.legalRef}
            nextReviewDate={status?.nextReviewDate ?? null}
            moduleRef={req.moduleRef}
            status={currentStatus}
            assigneeName={status?.assigneeName ?? null}
            completionPct={status?.completionPct ?? null}
            href={`/compliance/${categorySlug}/${req.code}`}
          />
        );
      })}
    </div>
  );
}
