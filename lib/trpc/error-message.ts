"use client";

import { TRPCClientError } from "@trpc/client";

/**
 * Error codes carried by a `TRPCError` the application raised on purpose.
 * Their messages are written for the person reading the screen ("This
 * requirement requires sign-off by CEO"), so they are safe to show.
 *
 * INTERNAL_SERVER_ERROR is deliberately absent. The server's errorFormatter
 * (packages/isms-trpc/src/error-formatter.ts) sends it with a fixed English
 * line, never the original exception, so the translated fallback is the
 * better thing to show.
 */
const INTENTIONAL_CODES = new Set([
  "BAD_REQUEST",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "PRECONDITION_FAILED",
  "PAYLOAD_TOO_LARGE",
  "UNPROCESSABLE_CONTENT",
  "TOO_MANY_REQUESTS",
]);

/**
 * The tRPC error code a caught error carries, or null for anything that is not
 * a tRPC error. For callers that show their own translated text for one code,
 * such as TOO_MANY_REQUESTS, instead of the server's English message.
 */
export function trpcErrorCode(err: unknown): string | null {
  if (!(err instanceof TRPCClientError)) return null;
  return (err.data as { code?: string } | null)?.code ?? null;
}

/**
 * The message to show a user for a failed mutation.
 *
 * Returns the server's own wording when the server chose it, and the caller's
 * translated fallback otherwise. This exists because the two useful halves
 * pull in opposite directions: a fixed "something went wrong" string leaves a
 * refused action unexplainable (which is how "upload failed" became
 * impossible to act on), while passing every message straight through leaks
 * whatever an unhandled exception happened to say.
 */
export function userFacingError(err: unknown, fallback: string): string {
  if (!(err instanceof TRPCClientError)) return fallback;
  const code = (err.data as { code?: string } | null)?.code;
  if (!code || !INTENTIONAL_CODES.has(code)) return fallback;
  return err.message.trim() || fallback;
}
