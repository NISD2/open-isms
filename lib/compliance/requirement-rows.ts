/**
 * Which fields a requirement asks **per row of a register**.
 *
 * Lifted out of `components/compliance/InlineModulePanel.tsx`, where these two maps were declared
 * inline. They are data about requirements, not about rendering, and two things needed them: the
 * inline panel, which focuses the register's table, and the guided form, which has to know that
 * requirement 5.2 is not one question but five questions per supplier.
 *
 * This is the shape of the work in this product. An item backed by a register costs
 * `rows x fields` screens, so an empty supplier register costs nothing and a forty-supplier one
 * costs forty screens of five. That is the reduction mvnis2.md §4.11 is about, and it happens at
 * the step where the register is read rather than in an interview beforehand.
 *
 * The comments naming the legal source are kept verbatim from the component.
 */

import type { z } from "zod";
import { assetInsertSchema, supplierInsertSchema } from "@/schema/validators";

/** CIR 5.2: per-supplier contract and monitoring fields. */
const SUPPLIER_ROW_FIELDS: Readonly<Record<string, readonly string[]>> = {
  "5.2": [
    "contractSecurityClauses",
    "auditFrequency",
    "monitoringMethod",
    "lastReviewDate",
    "dueDiligenceProcess",
  ],
};

/** CIR and BSIG grounded field groups per requirement code, asked once per asset. */
const ASSET_ROW_FIELDS: Readonly<Record<string, readonly string[]>> = {
  // CIR 4(1): disaster recovery targets per asset
  "4.3": ["rto", "rpo"],
  // CIR 4(2): backup management per asset (OPS.1.2.2)
  "4.4": ["hasBackup", "backupFrequency", "backupLocation", "lastBackupTestDate"],
  // §34 BSIG: compliance evidence, asset lifecycle
  "12.4": ["endOfLife", "lastPatchDate", "lastVulnScanDate"],
};

const BY_MODULE: Readonly<Record<string, Readonly<Record<string, readonly string[]>>>> = {
  supplier: SUPPLIER_ROW_FIELDS,
  asset: ASSET_ROW_FIELDS,
};

/**
 * The per-row fields for one requirement, or an empty list when it asks nothing per row.
 *
 * An empty list does not mean the register is irrelevant: it means the requirement is satisfied by
 * the register existing and being confirmed, not by answering something about each entry.
 */
export const rowFieldsFor = (
  moduleRef: string | null | undefined,
  requirementCode: string,
): readonly string[] =>
  moduleRef ? (BY_MODULE[moduleRef]?.[requirementCode] ?? []) : [];

/**
 * Which schema validates a row of each register.
 *
 * These are the drizzle-zod schemas in `schema/validators.ts`, so a row field is typed by the
 * database column it is stored in and nothing is hand-written. Only the registers that actually
 * carry per-row questions appear; adding one here is what makes its fields askable.
 */
export const ROW_SCHEMA: Readonly<Record<string, z.ZodObject<z.ZodRawShape>>> = {
  supplier: supplierInsertSchema as unknown as z.ZodObject<z.ZodRawShape>,
  asset: assetInsertSchema as unknown as z.ZodObject<z.ZodRawShape>,
};

/** True where an item's screen count depends on how many rows the company has. */
export const isPerRow = (
  moduleRef: string | null | undefined,
  requirementCode: string,
): boolean => rowFieldsFor(moduleRef, requirementCode).length > 0;
