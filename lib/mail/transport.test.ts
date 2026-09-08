/**
 * Which transport a send goes out on is a decision an operator makes by
 * setting one variable, and getting it wrong is invisible: mail still leaves,
 * from the wrong system, signed by the wrong domain. These tests pin the
 * selection and the precedence.
 *
 * They import the pure rule rather than the env-reading wrapper on purpose:
 * the unit suite runs without DATABASE_URL or AUTH_SECRET, so importing
 * ./transport here would fail env validation before the first assertion.
 */
import { describe, expect, test } from "bun:test";
import { selectTransport } from "./transport-rules";

describe("selectTransport", () => {
  test("no configuration means no transport, not a silent default", () => {
    expect(selectTransport({})).toBeNull();
  });

  test("a Resend key alone selects Resend", () => {
    expect(selectTransport({ resendApiKey: "re_test" })).toBe("resend");
  });

  test("an SMTP host alone selects SMTP", () => {
    expect(selectTransport({ smtpHost: "smtp.example.test" })).toBe("smtp");
  });

  test("SMTP wins when both are set, so a leftover key cannot hijack the From line", () => {
    expect(
      selectTransport({ smtpHost: "smtp.example.test", resendApiKey: "re_test" }),
    ).toBe("smtp");
  });

  test("an empty string is not configuration", () => {
    expect(selectTransport({ smtpHost: "", resendApiKey: "" })).toBeNull();
  });
});
