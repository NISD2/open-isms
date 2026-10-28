import { OUTAGE_SPANS } from "@nisd2/grc-data-model/enums";
import { z } from "zod";
import { CATALOG_BY_ID } from "@/lib/asset-inventory/catalog";
import { ASSET_LAYERS } from "@/lib/asset-inventory/types";
import { FREQUENCIES, IMPACTS } from "@/lib/compliance/bsi-200-3";
import { BACKUP_FREQUENCIES, HOSTINGS, MFA_METHODS, RATED_KINDS } from "@/lib/durchgang";
import { riskInsertSchema } from "@/schema/validators";

/**
 * What the walk's screens send when they save, one schema per save procedure. They live here,
 * outside the router, because the MCP tools hand the same schemas to an assistant and send what
 * it fills through the same procedures: one shape, checked once, whoever fills the screen.
 */

export const itemCode = z.string().max(10);

/** The longest own addition a policy takes. */
export const OWN_MAX = 2000;

/** 2.2: catalogue items ticked and the company's own entries, each becoming an asset row. */
export const addAssetsInput = z.object({
  catalogIds: z.array(z.string().max(80)).max(CATALOG_BY_ID.size),
  custom: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(255),
        layer: z.enum(ASSET_LAYERS),
      }),
    )
    .max(50)
    .default([]),
});

/** 2.2: which one exactly, what it is for and from whom, per asset. */
export const specifyAssetsInput = z.object({
  rows: z
    .array(
      z.object({
        id: z.string().uuid(),
        name: z.string().trim().min(1).max(255),
        description: z.string().trim().max(2000).optional(),
        providers: z.array(z.string().trim().min(1).max(255)).max(20),
        // Left out by a page loaded before 2.2 asked it, and then kept as stored.
        hosting: z.enum(HOSTINGS).nullable().optional(),
      }),
    )
    .max(500),
});

/** 2.1 and 5.1: how often each asset or supplier could be hit, and how badly. */
export const rateInput = z.object({
  rows: z
    .array(
      z.object({
        kind: z.enum(RATED_KINDS),
        id: z.string().uuid(),
        frequency: z.enum(FREQUENCIES),
        impact: z.enum(IMPACTS),
        note: riskInsertSchema.shape.treatmentDescription
          .unwrap()
          .unwrap()
          .trim()
          .max(1000)
          .optional(),
      }),
    )
    .max(1000),
});

/** 5.2: what each supplier's contract already settles about security and incidents. */
export const recordAgreementsInput = z.object({
  code: itemCode,
  rows: z
    .array(
      z.object({
        supplierId: z.string().uuid(),
        security: z.boolean(),
        incidents: z.boolean(),
      }),
    )
    .min(1)
    .max(500),
});

/** 11.1: whether each sign-in takes a second factor, and which. */
export const recordLoginsInput = z.object({
  code: itemCode,
  rows: z
    .array(
      z.object({
        assetId: z.string().uuid(),
        mfa: z.boolean().nullable(),
        method: z.enum(MFA_METHODS).nullable().default(null),
      }),
    )
    .min(1)
    .max(500),
});

/** 4.4: per backup system, how often it backs up and the day of its last restore that worked. */
export const recordBackupsInput = z.object({
  code: itemCode,
  rows: z
    .array(
      z.object({
        assetId: z.string().uuid(),
        frequency: z.enum(BACKUP_FREQUENCIES).nullable().optional(),
        lastRestore: z.iso.date().nullable(),
      }),
    )
    .min(1)
    .max(100),
});

/**
 * 4.2: which business processes must keep running without IT, how, and how long each may be
 * down at most. The tolerance left out keeps what is stored; null clears it.
 */
export const recordCriticalInput = z.object({
  code: itemCode,
  rows: z
    .array(
      z.object({
        assetId: z.string().uuid(),
        critical: z.boolean(),
        how: z.string().trim().max(300),
        outage: z.enum(OUTAGE_SPANS).nullable().optional(),
      }),
    )
    .min(1)
    .max(200),
});

/** 4.2: per process that must keep running, the systems and rooms on the list it needs. */
export const recordNeedsInput = z.object({
  code: itemCode,
  rows: z
    .array(
      z.object({
        processId: z.string().uuid(),
        assetIds: z.array(z.string().uuid()).max(100),
      }),
    )
    .min(1)
    .max(200),
});

/**
 * 4.4: per needed system, how long it takes to bring it back, or that nobody knows. A row says
 * one or the other, as the column's CHECK does.
 */
export const recordRestoreInput = z.object({
  code: itemCode,
  rows: z
    .array(
      z
        .object({
          assetId: z.string().uuid(),
          restore: z.enum(OUTAGE_SPANS).nullable(),
          unknown: z.boolean(),
        })
        .refine((row) => !(row.restore !== null && row.unknown), {
          message: "A restore time and unknown cannot both be given.",
        }),
    )
    .min(1)
    .max(200),
});

/** A policy written from the walk's template: the clauses chosen and the company's own words. */
export const writePolicyInput = z.object({
  code: itemCode,
  /** Null keeps the stored choice: the text is still written, with no clause or the old ones. */
  clauses: z.array(z.string().min(1).max(60)).max(50).nullable(),
  /** The company's own words; null keeps the stored ones. */
  own: z.string().trim().max(OWN_MAX).nullable(),
});
