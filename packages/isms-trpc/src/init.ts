import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { AuditEntry } from "./audit";

/**
 * Minimum session shape required by the auth-gated procedures.
 * Consumers' session types may extend this with additional fields
 * (email, name, etc.); width-subtyping keeps them compatible.
 */
export interface BaseSession {
  user: { id: string };
  role: string;
  companyId: string | null;
}

/**
 * Minimum context shape required by `createTRPCSetup`. Consumers
 * pass a concrete `TContext extends BaseContext` so their router
 * handlers see the full context — including their own `db` field
 * with the consumer-specific schema generic — while the procedures
 * still enforce the auth/audit invariants.
 *
 * `db` is intentionally NOT part of BaseContext: tRPC's middleware
 * here never reads it (logAudit is injected via TRPCSetupOptions),
 * and excluding it lets consumers keep their full-schema NodePgDatabase
 * type without a cast at the context boundary.
 */
export interface BaseContext {
  session: BaseSession | null;
  userId: string | null;
  companyId: string | null;
  ip: string;
  userAgent: string | null;
}

/**
 * Per-consumer dependencies injected into the procedure middlewares.
 * `logAudit` is fire-and-forget — set to a no-op in unauthenticated/OSS
 * deployments. `hasReviewAccess` decides which roles pass the
 * `reviewerProcedure` gate.
 */
export interface TRPCSetupOptions {
  logAudit: (entry: AuditEntry) => Promise<void>;
  hasReviewAccess: (role: string) => boolean;
}

/**
 * Build the tRPC instance + procedure ladder against a consumer's context.
 * Returns the same surface as a hand-written `init.ts` so existing
 * routers can keep importing `protectedProcedure` etc. unchanged.
 */
export function createTRPCSetup<TContext extends BaseContext>(
  options: TRPCSetupOptions,
) {
  const t = initTRPC.context<TContext>().create({ transformer: superjson });

  const protectedProcedure = t.procedure.use(
    async ({ ctx, next, type, path, getRawInput }) => {
      if (!ctx.userId || !ctx.session) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const result = await next({
        ctx: {
          ...ctx,
          userId: ctx.userId,
          companyId: ctx.companyId,
          session: ctx.session,
        },
      });

      if (type === "mutation") {
        const rawInput = await getRawInput();
        options.logAudit({
          companyId: ctx.companyId,
          userId: ctx.userId,
          action: path,
          entityType: path.split(".")[0] ?? path,
          entityId: extractEntityId(rawInput),
          description: path,
          newValue: scrubSensitiveValues(rawInput),
          ipAddress: ctx.ip === "unknown" ? null : ctx.ip,
          userAgent: ctx.userAgent,
        });
      }

      return result;
    },
  );

  const companyProcedure = protectedProcedure.use(({ ctx, next }) => {
    if (!ctx.companyId) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Company required" });
    }
    return next({ ctx: { ...ctx, companyId: ctx.companyId } });
  });

  const adminProcedure = companyProcedure.use(({ ctx, next }) => {
    if (ctx.session.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Admin access required",
      });
    }
    return next({ ctx });
  });

  const reviewerProcedure = companyProcedure.use(({ ctx, next }) => {
    if (!options.hasReviewAccess(ctx.session.role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Reviewer access required",
      });
    }
    return next({ ctx });
  });

  return {
    router: t.router,
    mergeRouters: t.mergeRouters,
    createCallerFactory: t.createCallerFactory,
    publicProcedure: t.procedure,
    protectedProcedure,
    companyProcedure,
    adminProcedure,
    reviewerProcedure,
  };
}

/** Extract the most likely entity ID from a mutation's input */
function extractEntityId(input: unknown): string | null {
  if (!input || typeof input !== "object") return null;
  const obj = input as Record<string, unknown>;
  for (const key of [
    "id",
    "statusId",
    "evidenceId",
    "categoryId",
    "assessmentId",
  ]) {
    const v = obj[key];
    if (typeof v === "string") return v;
  }
  return null;
}

/**
 * Field names whose VALUES must be scrubbed before being logged to audit_log.
 * Match is case-insensitive against the JSON property name. The audit row still
 * captures the field NAMES so reviewers can see WHAT was changed without seeing
 * the secret itself.
 *
 * Required for: GDPR Art. 5(1)(c) data minimization, ISO 27001 A.8.11 data masking.
 */
const AUDIT_REDACT_KEYS = new Set([
  "password",
  "passwordhash",
  "newpassword",
  "currentpassword",
  "token",
  "secret",
  "apikey",
  "api_key",
  "accesstoken",
  "access_token",
  "refreshtoken",
  "refresh_token",
  "clientsecret",
  "client_secret",
  "privatekey",
  "private_key",
  "sessionid",
  "session_id",
  "cookie",
  "authorization",
  "iban",
  "bic",
  "creditcard",
  "credit_card",
  "cardnumber",
  "card_number",
  "cvv",
  "cvc",
  "pin",
  "answers",
  "text",
  "prompt",
  "context",
  // GDPR erasure: the erase-user mutation echoes the subject's email as a typed
  // confirmation; it must never be persisted in the (non-retention-managed)
  // audit log, which would defeat the erasure.
  "confirmemail",
]);

function scrubSensitiveValues(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(scrubSensitiveValues);
  if (typeof value !== "object") return value;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (AUDIT_REDACT_KEYS.has(k.toLowerCase())) {
      out[k] = "[REDACTED]";
    } else {
      out[k] = scrubSensitiveValues(v);
    }
  }
  return out;
}
