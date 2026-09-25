"use client";

import type { ComponentType } from "react";
import { AssetsPage } from "@/components/assets/AssetsPage";
import { RisksPage } from "@/components/risks/RisksPage";
import { SuppliersPage } from "@/components/suppliers/SuppliersPage";
import { PoliciesPage } from "@/components/policies/PoliciesPage";
import { ExercisesPage } from "@/components/exercises/ExercisesPage";
import { KpisPage } from "@/components/kpis/KpisPage";
import { InternalAuditsPage } from "@/components/internal-audits/InternalAuditsPage";
import { ManagementReviewsPage } from "@/components/management-reviews/ManagementReviewsPage";
import { ImprovementsPage } from "@/components/improvements/ImprovementsPage";
import { ChangesPage } from "@/components/changes/ChangesPage";
import { PatchesPage } from "@/components/patches/PatchesPage";
import { VulnerabilitiesPage } from "@/components/vulnerabilities/VulnerabilitiesPage";
import { ModuleRefPanel } from "./ModuleRefPanel";

type InlineComponent = ComponentType<{ items: Record<string, unknown>[]; inline?: boolean }>;

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

// CIR 5.2: per-supplier contract & monitoring fields
const SUPPLIER_FOCUS: Record<string, string[]> = {
  "5.2": [
    "contractSecurityClauses", "auditFrequency", "monitoringMethod",
    "lastReviewDate", "dueDiligenceProcess",
  ],
};

// CIR/BSIG-grounded field groups per requirement code
const ASSET_FOCUS: Record<string, string[]> = {
  // CIR 4(1): disaster recovery targets per asset
  "4.3": ["rto", "rpo"],
  // CIR 4(2): backup management per asset (OPS.1.2.2)
  "4.4": ["hasBackup", "backupFrequency", "backupLocation", "lastBackupTestDate"],
  // §34 BSIG: compliance evidence — asset lifecycle
  "12.4": ["endOfLife", "lastPatchDate", "lastVulnScanDate"],
};

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
    const focus = SUPPLIER_FOCUS[requirementCode];
    if (focus) {
      return <SuppliersPage items={items} inline focus={focus} />;
    }
  }

  // AssetsPage: per-requirement field focus for enrichment requirements
  if (moduleRef === "asset" && requirementCode) {
    const focus = ASSET_FOCUS[requirementCode];
    if (focus) {
      const needsCryptoPolicy = focus.includes("encryptionAtRest");
      return (
        <AssetsPage
          items={items}
          inline
          focus={focus}
          policyData={needsCryptoPolicy ? editorInitialData : undefined}
        />
      );
    }
  }

  return <InlineComp items={items} inline />;
}
