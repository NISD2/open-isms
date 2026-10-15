import "@/lib/server-guard";
import { z } from "zod";
import { CATALOG } from "@/lib/asset-inventory/catalog";
import { CATALOG_LABELS } from "@/lib/asset-inventory/catalog-labels";
import type { CountableModule } from "@/lib/compliance/module-tables";
import { POLICY_CONFIG_SCHEMAS } from "@/lib/compliance/policy-config-schemas";
import type { ScreenKind, WalkLocale } from "@/lib/durchgang";
import {
  addAssetsInput,
  rateInput,
  recordAgreementsInput,
  recordBackupsInput,
  recordCriticalInput,
  recordLoginsInput,
  specifyAssetsInput,
  writePolicyInput,
} from "@/server/trpc/helpers/durchgang-inputs";
import type { Caller } from "./context";

/**
 * A walk screen an assistant fills: what it sends, what the screen shows now, and the save the
 * screen's own component calls, with the same schema. The procedure checks the ids it is sent
 * against the company's own rows, as it does for the app.
 */
export interface ScreenFill {
  /** What the assistant sends for the screen. */
  readonly input: z.ZodType;
  /**
   * The registers a save may change. A signed item that relies on one goes back to management
   * when it changes (`invalidateModuleSignOffs`), so a save is refused while any is signed.
   */
  readonly modules: readonly CountableModule[];
  readonly shows: (
    caller: Caller,
    code: string,
    language: WalkLocale,
  ) => Promise<unknown>;
  readonly save: (caller: Caller, code: string, input: unknown) => Promise<unknown>;
}

/** A screen fill whose save receives what its own schema parsed. */
const fill = <S extends z.ZodType>(screen: {
  readonly input: S;
  readonly modules: readonly CountableModule[];
  readonly shows: ScreenFill["shows"];
  readonly save: (caller: Caller, code: string, input: z.output<S>) => Promise<unknown>;
}): ScreenFill => ({
  ...screen,
  save: (caller, code, input) => screen.save(caller, code, screen.input.parse(input)),
});

const nothing = z.object({});

/** Provider names one `specify` call may carry, each a supplier when the list lacks it. */
const MAX_NEW_SUPPLIERS = 50;

/**
 * The company's assets with every column the asset screens ask about. A save writes each row as
 * sent, so an assistant sends back what is stored for what it does not mean to change; it can do
 * that only if it sees it, as the app's own screens prefill it.
 */
const assetsOf = async (caller: Caller) =>
  (await caller.asset.list()).map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    catalogId: a.catalogId,
    description: a.description,
    hosting: a.hosting,
    hasMfa: a.hasMfa,
    mfaMethod: a.mfaMethod,
    backupFrequency: a.backupFrequency,
    lastBackupTestDate: a.lastBackupTestDate,
    isCritical: a.isCritical,
  }));

/** The catalogue the asset list is ticked from, in the walk's language. */
const catalogOf = (language: WalkLocale) =>
  CATALOG.map((item) => ({
    id: item.id,
    layer: item.layer,
    label: CATALOG_LABELS[language][item.id]?.label ?? item.id,
  }));

/**
 * The screens an assistant fills besides an item's fields and its register (walk.ts), keyed by
 * kind. Files go through `upload_file` instead (tools.ts). What is left out stays with a person:
 * the approval is management's signature.
 */
export const SCREEN_FILLS = {
  assets: fill({
    input: addAssetsInput,
    modules: ["asset"],
    shows: async (caller, _code, language) => ({
      catalog: catalogOf(language),
      assets: await assetsOf(caller),
    }),
    save: (caller, _code, input) => caller.durchgang.addAssets(input),
  }),
  specify: fill({
    // A provider name the company's list lacks becomes a new supplier, so one call names at most
    // as many as a register call adds rows; the app's screen never sends more.
    input: specifyAssetsInput.refine(
      (input) =>
        new Set(input.rows.flatMap((r) => r.providers)).size <= MAX_NEW_SUPPLIERS,
      { message: `At most ${MAX_NEW_SUPPLIERS} different provider names per call.` },
    ),
    modules: ["asset", "supplier"],
    shows: async (caller) => {
      const [assets, providers, suppliers] = await Promise.all([
        assetsOf(caller),
        caller.durchgang.providers(),
        caller.supplier.list(),
      ]);
      return {
        assets,
        providers,
        suppliers: suppliers.map((s) => ({ id: s.id, name: s.name })),
      };
    },
    save: (caller, _code, input) => caller.durchgang.specifyAssets(input),
  }),
  rate: fill({
    input: rateInput,
    modules: ["risk", "supplier"],
    shows: async (caller) => {
      const [assets, suppliers, assetRisks, supplierRisks] = await Promise.all([
        assetsOf(caller),
        caller.supplier.list(),
        caller.risk.listWithAssets(),
        caller.risk.listWithSuppliers(),
      ]);
      return {
        assets,
        suppliers: suppliers.map((s) => ({ id: s.id, name: s.name })),
        ratings: [...assetRisks, ...supplierRisks],
      };
    },
    save: (caller, _code, input) => caller.durchgang.rate(input),
  }),
  agreements: fill({
    input: recordAgreementsInput.omit({ code: true }),
    modules: ["supplier"],
    // Only what the screen asks about, so nothing a linked supplier wrote reaches the assistant here.
    shows: async (caller) => ({
      suppliers: (await caller.supplier.list()).map((s) => ({
        id: s.id,
        name: s.name,
        linkedToSupplier: s.supplierCompanyId !== null,
        hasSecurityClauses: s.hasSecurityClauses,
        hasIncidentNotificationClause: s.hasIncidentNotificationClause,
      })),
    }),
    save: (caller, code, input) => caller.durchgang.recordAgreements({ code, ...input }),
  }),
  logins: fill({
    input: recordLoginsInput.omit({ code: true }),
    modules: ["asset"],
    shows: async (caller) => ({ assets: await assetsOf(caller) }),
    save: (caller, code, input) => caller.durchgang.recordLogins({ code, ...input }),
  }),
  backups: fill({
    input: recordBackupsInput.omit({ code: true }),
    modules: ["asset"],
    shows: async (caller) => ({ assets: await assetsOf(caller) }),
    save: (caller, code, input) => caller.durchgang.recordBackups({ code, ...input }),
  }),
  critical: fill({
    input: recordCriticalInput.omit({ code: true }),
    modules: ["asset"],
    // The one-line fallback per process lives in the plan's config, which the policy draft reads.
    shows: async (caller, code) => {
      const [assets, draft] = await Promise.all([
        assetsOf(caller),
        caller.durchgang.policyDraft({ code }),
      ]);
      return { assets, fallbacks: draft.fallbacks };
    },
    save: (caller, code, input) => caller.durchgang.recordCritical({ code, ...input }),
  }),
  policy: fill({
    input: writePolicyInput.omit({ code: true }),
    modules: ["policy"],
    shows: (caller, code) => caller.durchgang.policyDraft({ code }),
    save: (caller, code, input) => caller.durchgang.writePolicy({ code, ...input }),
  }),
  crypto: fill({
    input: z.object({
      list: POLICY_CONFIG_SCHEMAS.crypto
        .optional()
        .describe(
          "The whole list as it should stand, every entry with its status, as the requirement page saves it. Left out, the default list is taken over as it is.",
        ),
    }),
    modules: [],
    shows: (caller) => caller.durchgang.cryptoList(),
    // Taken over first, as the screen does: the list must exist before an entry changes. A list
    // the company keeps already is never overwritten by the default.
    save: async (caller, code, input) => {
      const adopted = await caller.durchgang.adoptCrypto({ code });
      if (!input.list) return adopted;
      await caller.policyConfig.update({ policyType: "crypto", config: input.list });
      return { ...adopted, listSaved: true };
    },
  }),
  adopt: fill({
    input: nothing,
    // Taking the method over replaces the risk scales the register's ratings sit on.
    modules: ["risk"],
    shows: async () => null,
    save: (caller) => caller.durchgang.adoptMethod(),
  }),
} as const satisfies Partial<Record<ScreenKind, ScreenFill>>;

export type FillableKind = keyof typeof SCREEN_FILLS;

export const isFillableKind = (kind: string): kind is FillableKind =>
  Object.hasOwn(SCREEN_FILLS, kind);
