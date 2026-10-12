import { TRPCError } from "@trpc/server";
import { z } from "zod";

/**
 * A refusal or a failed check as an assistant should read it; null for anything unexpected, which
 * stays in our log. An internal error's message is the failure itself (a failed query carries its
 * values), which an HTTP caller would only see after the error formatter replaced it.
 */
export function describeError(error: unknown): string | null {
  if (error instanceof z.ZodError) return z.prettifyError(error);
  if (error instanceof TRPCError && error.code !== "INTERNAL_SERVER_ERROR") {
    return error.cause instanceof z.ZodError
      ? z.prettifyError(error.cause)
      : error.message;
  }
  return null;
}
