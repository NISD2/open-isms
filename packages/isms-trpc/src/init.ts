import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { AuditEntry } from "./audit";
import { failedCallDescription } from "./audit/failed-call";
import { formatError } from "./error-formatter";

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
export function createTRPCSetup<TContext extends BaseContext>(options: TRPCSetupOptions) {
  const t = initTRPC
    .context<TContext>()
    .create({ transformer: superjson, errorFormatter: formatError });

  // The company a row is filed under decides who can read it (audit.list
  // filters on company_id), so the scope is fixed per procedure tier and
  // never left to each handler to remember.
  const authenticatedAndAudited = (auditScope: AuditScope) =>
    t.procedure.use(async ({ ctx, next, type, path, getRawInput }) => {
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
          companyId: auditScope === "callerCompany" ? ctx.companyId : null,
          userId: ctx.userId,
          action: path,
          entityType: path.split(".")[0] ?? path,
          entityId: extractEntityId(rawInput),
          // A refused or failed call still leaves its row, but not its input: nothing
          // validated it, so it holds whatever the caller chose to send.
          ...(result.ok
            ? {
                description: path,
                newValue: auditInput(rawInput, REDACT_KEYS_BY_SCOPE[auditScope]),
              }
            : { description: failedCallDescription(path, result.error.code) }),
          ipAddress: ctx.ip === "unknown" ? null : ctx.ip,
          userAgent: ctx.userAgent,
        });
      }

      return result;
    });

  const protectedProcedure = authenticatedAndAudited("callerCompany");

  /**
   * For operator actions across tenants (platform admin, newsletter). The
   * operator's own open company is a tenant like any other, and these inputs
   * name other customers, so the automatic row carries no company and no
   * tenant's audit.list can return it. A handler that acts on one company
   * writes its own row under that company.
   */
  const platformProcedure = authenticatedAndAudited("platform");

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
    platformProcedure,
    companyProcedure,
    adminProcedure,
    reviewerProcedure,
  };
}

/** Extract the most likely entity ID from a mutation's input */
function extractEntityId(input: unknown): string | null {
  if (!input || typeof input !== "object") return null;
  const obj = input as Record<string, unknown>;
  for (const key of ["id", "statusId", "evidenceId", "categoryId", "assessmentId"]) {
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
  // A one-time email code typed to confirm an action (ownership.start).
  "otp",
  "answers",
  "text",
  "prompt",
  "context",
  // GDPR erasure: the erase-user mutation echoes the subject's email as a typed
  // confirmation; it must never be persisted in the (non-retention-managed)
  // audit log, which would defeat the erasure.
  "confirmemail",
  // An AI assistant's signed consent request (user.allowMcpClient): opaque in
  // the log. The token endpoint records the assistant and where it returns to
  // when the connection opens (mcp.connected).
  "request",
  // A code from an authenticator app or a recovery code (twoFactor.*): the
  // handler records what it was used for, never the code.
  "totpcode",
]);

/**
 * Platform rows only (company_id null), whose inputs belong to other people: a
 * customer's billing identity, the organization name typed to confirm an
 * erasure. Erasure reaches only rows the erased user wrote or their own company
 * holds, so a copy here would outlive it. A tenant's own rows keep these values:
 * its order address, or the customer a supplier invited, is its own record.
 */
const PLATFORM_AUDIT_REDACT_KEYS = new Set([
  ...AUDIT_REDACT_KEYS,
  // An erasure's free text (platformAdmin.eraseUser) can name the requester, and this row outlives
  // the erasure; the erasure record keeps both.
  "notes",
  // Why a platform admin reset someone's second factor (twoFactor.adminReset): free text that can
  // name the requester. The handler's own row keeps it, under the person it is about.
  "reason",
  "rightsinvoked",
  "confirmorgname",
  "customeremail",
  "customername",
  "companyname",
  "vatnumber",
  "street",
  "zip",
  "city",
  "invoiceemail",
  "copytoemail",
  "purchaseorder",
]);

type AuditScope = "callerCompany" | "platform";

const REDACT_KEYS_BY_SCOPE: Record<AuditScope, ReadonlySet<string>> = {
  callerCompany: AUDIT_REDACT_KEYS,
  platform: PLATFORM_AUDIT_REDACT_KEYS,
};

/**
 * Twice the largest automatic row in production (8,570 bytes, durchgang.rate; 8,064 rows measured
 * 30.10.2026, none over 16 KB). No real input is cut; a pasted document is.
 */
export const AUDIT_INPUT_MAX_BYTES = 16_384;

/** Over the cap, the row names at most this many top-level fields, each cut to FIELD_NAME_MAX_CHARS. */
const FIELD_NAMES_MAX = 50;
const FIELD_NAME_MAX_CHARS = 64;
/** The names list's own budget; 50 names of 64 four-byte characters would pass it, so it is then dropped. */
const FIELD_NAMES_MAX_BYTES = 4_096;

/**
 * What the row stores of a successful call's input. Runs after the handler committed, so it must
 * not throw: an input it cannot walk still leaves the row, marked, instead of losing it.
 */
function auditInput(rawInput: unknown, keys: ReadonlySet<string>): unknown {
  try {
    return boundAuditInput(
      scrubSensitiveValues(rawInput, keys, new WeakSet(), new WeakSet()),
    );
  } catch {
    return { unloggable: true };
  }
}

/** The input as logged, or over the cap only its size and a bounded list of top-level field names. */
function boundAuditInput(value: unknown): unknown {
  const bytes = serializedBytes(value);
  if (bytes !== null && bytes <= AUDIT_INPUT_MAX_BYTES) return value;
  const names =
    value !== null && typeof value === "object" && !Array.isArray(value)
      ? Object.keys(value)
      : [];
  // Cut by code point, so a name never ends in half a surrogate pair (jsonb refuses those).
  const fields = names
    .slice(0, FIELD_NAMES_MAX)
    .map((name) => Array.from(name).slice(0, FIELD_NAME_MAX_CHARS).join(""));
  const fieldsBytes = serializedBytes(fields);
  return {
    truncated: true,
    bytes,
    fieldCount: names.length,
    ...(fieldsBytes !== null && fieldsBytes <= FIELD_NAMES_MAX_BYTES ? { fields } : {}),
  };
}

/** Byte length of the JSON form; null when JSON cannot encode it (a BigInt), so the call never fails over its own log row. */
function serializedBytes(value: unknown): number | null {
  try {
    return new TextEncoder().encode(JSON.stringify(value) ?? "").length;
  } catch {
    return null;
  }
}

/**
 * The input with secret values replaced. superjson rebuilds shared and circular references from the
 * caller's meta, so an object met again is not walked again: on its own path it is a cycle
 * ("[CIRCULAR]"), elsewhere a repeat ("[REPEATED]"), which also stops a chain of shared objects
 * from doubling at every level.
 */
function scrubSensitiveValues(
  value: unknown,
  keys: ReadonlySet<string>,
  ancestors: WeakSet<object>,
  seen: WeakSet<object>,
): unknown {
  if (value === null || typeof value !== "object") return value;
  if (ancestors.has(value)) return "[CIRCULAR]";
  if (seen.has(value)) return "[REPEATED]";
  ancestors.add(value);
  seen.add(value);
  const walk = (v: unknown) => scrubSensitiveValues(v, keys, ancestors, seen);
  const out = Array.isArray(value)
    ? value.map(walk)
    : Object.fromEntries(
        Object.entries(value).map(([k, v]) => [
          k,
          keys.has(k.toLowerCase()) ? "[REDACTED]" : walk(v),
        ]),
      );
  ancestors.delete(value);
  return out;
}
