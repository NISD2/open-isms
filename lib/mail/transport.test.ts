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
import {
  hasOwnFromAddress,
  implicitTlsForPort,
  preferConfigured,
  selectTransport,
} from "./transport-rules";

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

  // Compose has no way to pass "unset": `SMTP_HOST: ${SMTP_HOST:-}` puts an
  // empty string on the container environment. A blank host that selected the
  // SMTP transport would take every existing Resend deployment offline.
  test("a blank host does not select SMTP over a real Resend key", () => {
    expect(selectTransport({ smtpHost: "   ", resendApiKey: "re_test" })).toBe("resend");
  });
});

describe("preferConfigured", () => {
  test("the new name wins when it carries a value", () => {
    expect(preferConfigured("new@example.test", "old@example.test")).toBe(
      "new@example.test",
    );
  });

  test("unset falls back to the name existing deployments already set", () => {
    expect(preferConfigured(undefined, "old@example.test")).toBe("old@example.test");
  });

  // The regression this pins: compose passes MAIL_FROM_EMAIL as "" for every
  // operator who has not adopted the new name, and an empty From address is
  // an email nobody receives.
  test("blank falls back too, rather than becoming an empty From address", () => {
    expect(preferConfigured("", "old@example.test")).toBe("old@example.test");
    expect(preferConfigured("  ", "old@example.test")).toBe("old@example.test");
  });
});

/**
 * The hosted instance's own From address is a default in lib/env, which was
 * safe only because Resend refuses to send from an unverified domain. A
 * self-hoster's relay has no such check, so the same default would put mail
 * on the wire claiming to come from nisd2.eu.
 */
describe("hasOwnFromAddress", () => {
  test("the project's default address is not the operator's", () => {
    expect(hasOwnFromAddress("noreply@nisd2.eu")).toBe(false);
    expect(hasOwnFromAddress("  NoReply@NISD2.eu  ")).toBe(false);
  });

  // The case that actually happens, and the one the first version of this
  // guard let through. Both compose files write MAIL_FROM_EMAIL as an empty
  // string, which satisfies z.string() so Zod's .default() never fires — so
  // the literal default never arrives here, and checking only for it made the
  // guard inert in every containerised deployment.
  test("blank is not the operator's address either", () => {
    expect(hasOwnFromAddress("")).toBe(false);
    expect(hasOwnFromAddress("   ")).toBe(false);
  });

  test("any address the operator chose is theirs, including another nisd2 mailbox", () => {
    expect(hasOwnFromAddress("noreply@acme.test")).toBe(true);
    expect(hasOwnFromAddress("isms@nisd2.eu")).toBe(true);
  });
});

describe("implicitTlsForPort", () => {
  test("465 is implicit TLS, 587 and 25 are not", () => {
    expect(implicitTlsForPort(465, undefined)).toBe(true);
    expect(implicitTlsForPort(587, undefined)).toBe(false);
    expect(implicitTlsForPort(25, undefined)).toBe(false);
  });

  test("an explicit value overrides the port pairing in both directions", () => {
    expect(implicitTlsForPort(587, "true")).toBe(true);
    expect(implicitTlsForPort(587, "1")).toBe(true);
    expect(implicitTlsForPort(465, "false")).toBe(false);
  });

  // Same blank-is-not-an-answer rule: read as an explicit "false", this would
  // open port 465 in the clear and the connection would hang rather than fail.
  test("blank is not an override, so 465 keeps its implicit TLS", () => {
    expect(implicitTlsForPort(465, "")).toBe(true);
    expect(implicitTlsForPort(465, "   ")).toBe(true);
  });
});
