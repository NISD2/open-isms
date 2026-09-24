"use client";

import type { ComponentType } from "react";
import { AssetsPage } from "@/components/assets/AssetsPage";
import { ChangesPage } from "@/components/changes/ChangesPage";
import { ExercisesPage } from "@/components/exercises/ExercisesPage";
import { ImprovementsPage } from "@/components/improvements/ImprovementsPage";
import { InternalAuditsPage } from "@/components/internal-audits/InternalAuditsPage";
import { KpisPage } from "@/components/kpis/KpisPage";
import { ManagementReviewsPage } from "@/components/management-reviews/ManagementReviewsPage";
import { PatchesPage } from "@/components/patches/PatchesPage";
import { PoliciesPage } from "@/components/policies/PoliciesPage";
import { RisksPage } from "@/components/risks/RisksPage";
import { SuppliersPage } from "@/components/suppliers/SuppliersPage";
import { VulnerabilitiesPage } from "@/components/vulnerabilities/VulnerabilitiesPage";
import { rowFieldsFor } from "@/lib/compliance/requirement-rows";
import { ModuleRefPanel } from "./ModuleRefPanel";

type InlineComponent = ComponentType<{
  items: Record<string, unknown>[];
  inline?: boolean;
}>;

const INLINE_MODULES: Record<string, InlineComponent> = {
  asset: AssetsPage,
  risk: RisksPage,
  supplier: SuppliersPage,
  policy: PoliciesPage,
  exercise: ExercisesPage,
  kpi_measurement: KpisPage,
  internal_audit: InternalAuditsPage,
  management_review: ManagementReviewsPage,
  improvement_item: ImprovementsPage,
  change_request: ChangesPage,
  patch_record: PatchesPage,
  vulnerability: VulnerabilitiesPage,
};

// The per-row field maps moved to lib/compliance/requirement-rows.ts. They are data about
// requirements rather than about rendering, and the guided form needs them too: a requirement with
// per-row fields is not one screen, it is one screen per row.

interface InlineModulePanelProps {
  moduleRef: string;
  requirementCode?: string;
  items: Record<string, unknown>[];
  isCompleted: boolean;
  isConfirming?: boolean;
  onConfirm?: () => void;
  editorInitialData?: Record<string, unknown> | null;
}

export function InlineModulePanel({
  moduleRef,
  requirementCode,
  items,
  isCompleted,
  isConfirming,
  onConfirm,
  editorInitialData,
}: InlineModulePanelProps) {
  const InlineComp = INLINE_MODULES[moduleRef];

  if (!InlineComp) {
    return (
      <ModuleRefPanel
        moduleRef={moduleRef}
        count={items.length}
        isCompleted={isCompleted}
        isConfirming={isConfirming}
        onConfirm={onConfirm}
      />
    );
  }

  // RisksPage needs methodology data for scale dropdowns
  if (moduleRef === "risk") {
    return <RisksPage items={items} inline methodology={editorInitialData} />;
  }

  // SuppliersPage: per-requirement field focus for contract/monitoring requirements
  if (moduleRef === "supplier" && requirementCode) {
    const focus = rowFieldsFor(moduleRef, requirementCode);
    if (focus.length > 0) {
      return <SuppliersPage items={items} inline focus={[...focus]} />;
    }
  }

  // AssetsPage: per-requirement field focus for enrichment requirements
  if (moduleRef === "asset" && requirementCode) {
    const focus = rowFieldsFor(moduleRef, requirementCode);
    if (focus.length > 0) {
      const needsCryptoPolicy = focus.includes("encryptionAtRest");
      return (
        <AssetsPage
          items={items}
          inline
          focus={[...focus]}
          policyData={needsCryptoPolicy ? editorInitialData : undefined}
        />
      );
    }
  }

  return <InlineComp items={items} inline />;
}
