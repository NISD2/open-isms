// Package entry. Subpath exports (./audit, ./audit/*) carry the per-domain
// surface; this barrel re-exports the tRPC setup factory + audit helpers
// so `import { createTRPCSetup } from "@nisd2/isms-trpc"` works.

export * from "./audit";
export { UNEXPECTED_ERROR_MESSAGE } from "./error-formatter";
export * from "./init";
