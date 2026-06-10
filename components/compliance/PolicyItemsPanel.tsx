"use client";

import { AccessItemRows } from "./AccessItemRows";
import { CryptoItemRows } from "./CryptoItemRows";
import { ProcurementItemRows } from "./ProcurementItemRows";
import { PatchSlaItemRows } from "./PatchSlaItemRows";
import type { Asset } from "@/schema/types";

/**
 * Requirements where InlineModulePanel should NOT render — either because
 * PolicyItemsPanel handles the UI (CRY:9.2, ACC:10.2) or because the
 * requirement is intake-only (CRY:9.3, ACC:10.3). A small link button shows instead.
 *
 * Only relevant for requirements that have moduleRef set in the DB.
 * PRO:6.1/6.2 have no moduleRef so they don't need to be here.
 */
export const SKIP_INLINE_MODULE = new Set(["CRY:9.2", "CRY:9.3", "ACC:10.2", "ACC:10.3"]);

interface PolicyItemsPanelProps {
  editorKey: string;
  disabled?: boolean;
  assets?: Asset[];
}

export function PolicyItemsPanel({ editorKey, disabled, assets }: PolicyItemsPanelProps) {
  switch (editorKey) {
    case "ACC:10.2":
      return <AccessItemRows disabled={disabled} initialItems={assets} />;
    case "CRY:9.2":
      return <CryptoItemRows disabled={disabled} initialItems={assets} />;
    case "PRO:6.1":
      return <ProcurementItemRows />;
    case "PRO:6.4":
      return <PatchSlaItemRows />;
    default:
      return null;
  }
}
