"use client";

import { TRPCClientError } from "@trpc/client";

/**
 * Error codes carried by a `TRPCError` the application raised on purpose.
 * Their messages are written for the person reading the screen ("This
 * requirement requires sign-off by CEO"), so they are safe to show.
 *
 * INTERNAL_SERVER_ERROR is deliberately absent. tRPC is configured without an
 * `errorFormatter`, so an unexpected exception reaches the client with its
 * original message attached — an AWS SDK failure, a Postgres error, a stack
 * from somewhere in the storage layer. Those can carry endpoints, object keys
 * and signed-URL fragments, none of which belong in a toast.
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
