import { describe, expect, test } from "bun:test";
import { TRPCClientError } from "@trpc/client";
import { userFacingError } from "./error-message";

const FALLBACK = "Speichern fehlgeschlagen";

/** A client-side tRPC error as the react-query client surfaces it, with the
 *  `data.code` the server's error shape carries. */
function clientError(code: string, message: string): TRPCClientError<never> {
  const err = new TRPCClientError<never>(message);
  Object.assign(err, { data: { code } });
  return err;
}

describe("userFacingError", () => {
  // The reason this helper exists on the useful side: a refused action has to
  // be explainable, or the user is left with "it failed" and no next move.
  test("shows the message when the server chose it", () => {
    expect(
      userFacingError(
        clientError("FORBIDDEN", "This requirement requires sign-off by CEO."),
        FALLBACK,
      ),
    ).toBe("This requirement requires sign-off by CEO.");
  });

  test("shows deliberate messages for every intentional code", () => {
    for (const code of ["BAD_REQUEST", "NOT_FOUND", "CONFLICT", "PAYLOAD_TOO_LARGE"]) {
      expect(userFacingError(clientError(code, `refused: ${code}`), FALLBACK)).toBe(
        `refused: ${code}`,
      );
    }
  });

  /**
   * The reason it exists on the safe side. tRPC runs without an
   * errorFormatter, so an unhandled exception reaches the browser with its
   * original text — and the storage layer's exceptions carry endpoints,
   * object keys and signed-URL fragments. None of that belongs in a toast.
   */
  test("hides the message behind the fallback for an internal error", () => {
    const leaky = clientError(
      "INTERNAL_SERVER_ERROR",
      "PutObject failed: https://minio.internal:9000/bucket/key?X-Amz-Signature=deadbeef",
    );
    expect(userFacingError(leaky, FALLBACK)).toBe(FALLBACK);
  });

  test("hides anything that is not a tRPC client error", () => {
    expect(userFacingError(new Error("ECONNREFUSED 10.0.0.5:5432"), FALLBACK)).toBe(FALLBACK);
    expect(userFacingError("connection string leaked", FALLBACK)).toBe(FALLBACK);
    expect(userFacingError(null, FALLBACK)).toBe(FALLBACK);
    expect(userFacingError(undefined, FALLBACK)).toBe(FALLBACK);
  });

  // A shape with no code is not a message the server wrote on purpose.
  test("hides the message when no code is attached", () => {
    expect(userFacingError(new TRPCClientError("bare failure"), FALLBACK)).toBe(FALLBACK);
  });

  test("falls back rather than showing an empty message", () => {
    expect(userFacingError(clientError("FORBIDDEN", "   "), FALLBACK)).toBe(FALLBACK);
  });
});
