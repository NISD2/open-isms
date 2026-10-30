/**
 * The mails about a person's own second factor: one per event, each naming the instance, each with
 * an address a person reads, none carrying a code.
 */
import { describe, expect, mock, test } from "bun:test";

// lib/mail reads a validated environment at load, and CI runs this suite without one.
mock.module("@/lib/env", () => ({
  env: {
    DATABASE_URL: "postgres://unused:unused@localhost:5432/unused",
    AUTH_SECRET: "test-secret-test-secret-test-secret",
    NEXT_PUBLIC_APP_URL: "https://example.test",
  },
  mailSupportEmail: () => "support@example.test",
}));

const { twoFactorNoticeEmail, twoFactorResetEmail } = await import(
  "./two-factor-templates"
);
const { TWO_FACTOR_NOTICE_COPY } = await import("./emails/two-factor-notice");

describe("two-factor mails", () => {
  test("each notice has its own subject naming the instance, and a reply address", async () => {
    const kinds = ["enabled", "disabled", "failures", "locked"] as const;
    const mails = await Promise.all(
      kinds.map((kind) => twoFactorNoticeEmail({ kind, host: "isms.example.test" })),
    );
    expect(new Set(mails.map((m) => m.subject)).size).toBe(kinds.length);
    for (const mail of mails) {
      expect(mail.subject).toContain("isms.example.test");
      expect(mail.text).toContain(mail.replyTo);
      expect(mail.html).toContain("isms.example.test");
    }
  });

  test("Czech copy exists for every notice, sent once Czech mail is approved", () => {
    for (const kind of ["enabled", "disabled", "failures", "locked"] as const) {
      expect(TWO_FACTOR_NOTICE_COPY.cs[kind]("h").subject).toContain("h");
    }
  });

  test("the reset notice names the instance", async () => {
    const mail = await twoFactorResetEmail({ host: "isms.example.test" });
    expect(mail.subject).toContain("isms.example.test");
  });
});
