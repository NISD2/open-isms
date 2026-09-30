import type { TRPCDefaultErrorShape, TRPCError } from "@trpc/server";
import { ZodError } from "zod";

/**
 * What a client reads for a failure nobody wrote a message for. The original error goes to the
 * server log (the route's onError), which is the only place it belongs: a Drizzle failure carries
 * the SQL and its parameters, an AWS SDK failure its endpoint and object key.
 */
export const UNEXPECTED_ERROR_MESSAGE = "Something went wrong. Please try again.";

/**
 * Whether whoever threw wrote this message. tRPC turns anything that is not a TRPCError into
 * INTERNAL_SERVER_ERROR carrying the original message, and a TRPCError built with a cause but no
 * message takes the cause's message, so a message copied from the cause is one nobody chose.
 *
 * Input validation is the exception: its message is zod's issue list, the path and the rule that
 * failed, which a form can use and which says nothing the public source does not. It carries no
 * submitted value, only the caller's own key names where a strict object refuses an unknown key.
 */
function isChosenMessage(error: TRPCError): boolean {
  if (error.code === "INTERNAL_SERVER_ERROR") return false;
  if (error.cause instanceof ZodError) return true;
  return error.cause === undefined || error.message !== error.cause.message;
}

/**
 * tRPC's error shape with every unchosen message replaced, and nothing in `data` but the code,
 * the status and the path: no stack, which tRPC adds whenever NODE_ENV is not "production", and
 * no cause.
 */
export function formatError({
  shape,
  error,
}: {
  shape: TRPCDefaultErrorShape;
  error: TRPCError;
}): TRPCDefaultErrorShape {
  return {
    message: isChosenMessage(error) ? shape.message : UNEXPECTED_ERROR_MESSAGE,
    code: shape.code,
    data: {
      code: shape.data.code,
      httpStatus: shape.data.httpStatus,
      path: shape.data.path,
    },
  };
}
