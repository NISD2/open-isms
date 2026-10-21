import type { AppCaller } from "./context";

/**
 * Every procedure an AI assistant's key may reach, by router: the ones the MCP tools call
 * (tools.ts, screens.ts, walk.ts) and nothing else. Two rules come from this one list: the tools'
 * caller is typed to it (`KeyCaller`), so a tool calling anything else does not compile, and every
 * procedure refuses a key call whose path is not on it (`keyMayCall`, in server/trpc/init.ts), so
 * a slip in the tools cannot reach billing, the team or a sign-off either.
 */
export const KEY_PROCEDURES = {
  assessment: ["getActiveAssessment", "getStatusesByCategory"],
  asset: ["list"],
  durchgang: [
    "walk",
    "resume",
    "addAssets",
    "specifyAssets",
    "providers",
    "rate",
    "recordAgreements",
    "recordLogins",
    "recordBackups",
    "recordCritical",
    "policyDraft",
    "writePolicy",
    "walkPolicies",
    "cryptoList",
    "adoptCrypto",
    "adoptMethod",
  ],
  evidence: ["createUploadUrl", "confirmUpload", "listByRequirementStatus"],
  intake: ["getRequirementAnswers", "saveRequirementAnswers"],
  managementReview: ["list", "create"],
  policyConfig: ["update"],
  records: ["readPart"],
  requirement: ["getByCode"],
  risk: ["listWithAssets", "listWithSuppliers"],
  supplier: ["list", "create", "update"],
  supplierInvite: ["create"],
  training: ["list", "create", "update", "getCertificateUploadUrl"],
} as const satisfies {
  readonly [R in keyof AppCaller]?: readonly (keyof AppCaller[R])[];
};

type Listed = typeof KEY_PROCEDURES;

/** The caller the MCP tools get: only the procedures on the list. */
export type KeyCaller = {
  readonly [R in keyof Listed]: Pick<AppCaller[R], Listed[R][number]>;
};

const KEY_PATHS: ReadonlySet<string> = new Set(
  Object.entries(KEY_PROCEDURES).flatMap(([router, procedures]) =>
    procedures.map((procedure) => `${router}.${procedure}`),
  ),
);

/** Whether a call made with a key may reach the procedure at this tRPC path. */
export const keyMayCall = (path: string): boolean => KEY_PATHS.has(path);
