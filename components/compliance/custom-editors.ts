import type { ComponentType } from "react";
import type { RequirementGuidanceData } from "@/lib/ai/guidance-types";
import type { CustomEditorKey } from "@/lib/compliance/requirement-fields";
import { AssetRiskRegister } from "../risks/AssetRiskRegister";
import { RiskTreatmentView } from "../risks/RiskTreatmentView";
import { SupplierRiskRegister } from "../suppliers/SupplierRiskRegister";
import { AccessControlEditor } from "./AccessControlEditor";
import { CryptoPolicyEditor } from "./CryptoPolicyEditor";
import { PatchPolicyEditor } from "./PatchPolicyEditor";
import { ProcurementEditor } from "./ProcurementEditor";
import { RiskMethodologyEditor } from "./RiskMethodologyEditor";
import { SecureDevEditor } from "./SecureDevEditor";

// ---------------------------------------------------------------------------
// Custom editor lookup — requirement code → structured editor component
// ---------------------------------------------------------------------------
// Typed against CUSTOM_EDITOR_KEYS (lib/compliance/requirement-fields.ts):
// an editor added or removed on one side without the other is a compile error.
const CUSTOM_EDITORS: Record<
  CustomEditorKey,
  ComponentType<{
    disabled?: boolean;
    guidance?: RequirementGuidanceData | null;
    initialData?: Record<string, unknown> | null;
  }>
> = {
  "RSK:2.1": RiskMethodologyEditor,
  "RSK:2.3": AssetRiskRegister,
  "RSK:2.4": RiskTreatmentView,
  "SUP:5.3": SupplierRiskRegister,
  "CRY:9.1": CryptoPolicyEditor,
  "ACC:10.1": AccessControlEditor,
  "PRO:6.1": ProcurementEditor,
  "PRO:6.2": SecureDevEditor,
  "PRO:6.4": PatchPolicyEditor,
};

// Widened view for lookups with runtime-built keys.
export const CUSTOM_EDITOR_LOOKUP: Partial<
  Record<string, (typeof CUSTOM_EDITORS)[CustomEditorKey]>
> = CUSTOM_EDITORS;
