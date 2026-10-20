/**
 * The notice a person gets when an AI assistant is connected as them: in their language, naming
 * the company, where the assistant returns to and how to end it, with the assistant's self-given
 * name made unlinkable like every other name someone else typed.
 */
import { describe, expect, mock, test } from "bun:test";
import { isApprovedMailLocale } from "./locale";

// Until Czech is in APPROVED_MAIL_LOCALES the copy is switched off, not deleted.
const whenLocalised = isApprovedMailLocale("cs") ? test : test.skip;

mock.module("../env", () => ({
  env: {
    DATABASE_URL: "postgres://unused:unused@localhost:5432/unused",
    AUTH_SECRET: "test-secret-test-secret-test-secret",
  },
  mailSupportEmail: () => "support@example.com",
}));

const { assistantConnectedEmail } = await import("./templates");

const SETTINGS = "https://nisd2.eu/de/settings";

describe("the notice when an assistant is connected", () => {
  test("a sign-in names the assistant, the company and where it returns, with the way out", async () => {
    const mail = await assistantConnectedEmail({
      companyName: "Stadtwerke Musterstadt",
      how: { kind: "signin", assistant: "Claude Code", returnHost: "localhost:33418" },
      settingsUrl: SETTINGS,
      locale: "en",
    });
    expect(mail.subject).toContain("Stadtwerke Musterstadt");
    expect(mail.text).toContain("Claude Code");
    expect(mail.text).toContain("localhost:33418");
    expect(mail.text).toContain(SETTINGS);
    expect(mail.html).toContain(SETTINGS);
  });

  test("a self-given assistant name cannot carry a link", async () => {
    const mail = await assistantConnectedEmail({
      companyName: "Stadtwerke Musterstadt",
      how: {
        kind: "signin",
        assistant: "Support https://evil.example",
        returnHost: "evil.example",
      },
      settingsUrl: SETTINGS,
      locale: "en",
    });
    expect(mail.text).not.toContain("https://evil.example");
  });

  whenLocalised("a Czech reader gets it in Czech", async () => {
    const mail = await assistantConnectedEmail({
      companyName: "Teplárna Brno",
      how: { kind: "key" },
      settingsUrl: "https://nisd2.eu/cs/settings",
      locale: "cs",
    });
    expect(mail.subject).toContain("asistent AI");
    expect(mail.text).toContain("Teplárna Brno");
    expect(mail.text).toContain("Nastavení");
  });
});
