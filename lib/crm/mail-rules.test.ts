/**
 * What reaches a person's timeline in Close is a closed rule on sender and subject.
 * Codes, invitations and operator mail must stay off it, and so must anything new.
 */
import { describe, expect, test } from "bun:test";
import { addressOf, classifyMail, type MailSources } from "./mail-rules";
import type { ResendMail } from "./resend-history";

const sources: MailSources = {
  newsletterFrom: "newsletter@nisd2.eu",
  transactionalFrom: "noreply@nisd2.eu",
};
const NOW = new Date("2026-10-21T12:00:00Z");

const mail = (over: Partial<ResendMail> = {}): ResendMail => ({
  id: "re_1",
  from: "NISD2 <newsletter@nisd2.eu>",
  to: ["anna@example.test"],
  subject: "You were early, so this price is yours",
  sentAt: new Date("2026-10-20T08:00:00Z"),
  lastEvent: "delivered",
  ...over,
});

describe("addressOf", () => {
  test("takes the address out of a display name, lowercased", () => {
    expect(addressOf("NISD2 <Newsletter@NISD2.eu>")).toBe("newsletter@nisd2.eu");
    expect(addressOf("noreply@nisd2.eu")).toBe("noreply@nisd2.eu");
  });
});

describe("classifyMail", () => {
  test("a newsletter issue gets a note with its subject", () => {
    expect(classifyMail(mail(), sources, NOW)).toEqual({
      kind: "note",
      text: 'Newsletter sent: "You were early, so this price is yours"',
    });
  });

  test("a listed transactional subject gets a note", () => {
    const welcome = mail({
      from: "nisd2.eu <noreply@nisd2.eu>",
      subject: "Welcome to NISD2",
    });
    expect(classifyMail(welcome, sources, NOW)).toEqual({
      kind: "note",
      text: 'Platform email sent: "Welcome to NISD2"',
    });
  });

  test.each([
    "Your sign-in code",
    "123456 is your NISD2 code",
    "Sign-up attempt with your NISD2 address",
    "devel invited you to Galeola on NISD2",
    "New signup: someone@example.test",
    "Invoice RE-2026-0042",
  ])("%s from the transactional address is never noted", (subject) => {
    const other = mail({ from: "NISD2 <noreply@nisd2.eu>", subject });
    expect(classifyMail(other, sources, NOW)).toEqual({
      kind: "skip",
      outcome: "skipped_not_listed",
    });
  });

  test("a listed subject from another sender is not ours", () => {
    const spoof = mail({ from: "x <someone@else.test>", subject: "Welcome to NISD2" });
    expect(classifyMail(spoof, sources, NOW).kind).toBe("skip");
  });

  test("a test send of an issue is not noted", () => {
    expect(
      classifyMail(mail({ subject: "[Test] You were early" }), sources, NOW).kind,
    ).toBe("skip");
  });

  test("without a newsletter mailbox no issue is recognised", () => {
    const none = { ...sources, newsletterFrom: undefined };
    expect(classifyMail(mail(), none, NOW)).toEqual({
      kind: "skip",
      outcome: "skipped_not_listed",
    });
  });

  test("a bounced or suppressed mail never reached the person", () => {
    for (const lastEvent of ["bounced", "suppressed", "failed"]) {
      expect(classifyMail(mail({ lastEvent }), sources, NOW)).toEqual({
        kind: "skip",
        outcome: "skipped_not_delivered",
      });
    }
  });

  test("a mail still on its way waits, until it is an hour old", () => {
    const fresh = mail({ lastEvent: "sent", sentAt: new Date("2026-10-21T11:50:00Z") });
    expect(classifyMail(fresh, sources, NOW)).toEqual({ kind: "wait" });
    const stale = mail({ lastEvent: "sent", sentAt: new Date("2026-10-21T09:00:00Z") });
    expect(classifyMail(stale, sources, NOW).kind).toBe("skip");
  });

  test("opened, clicked and complained mail was delivered", () => {
    for (const lastEvent of ["opened", "clicked", "complained"]) {
      expect(classifyMail(mail({ lastEvent }), sources, NOW).kind).toBe("note");
    }
  });
});
