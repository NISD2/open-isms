/**
 * What reaches a person's timeline in Close is a closed list. Codes that log someone
 * in, and mail that is routine noise, must stay off it.
 */
import { describe, expect, test } from "bun:test";
import { EMAIL_TYPES } from "@/lib/mail/email-types";
import { CLOSE_MAIL_NOTES, closeMailNote, isLoggedEmailType } from "./mail-notes";

describe("close mail notes", () => {
  test("every listed type is a real message in the catalogue", () => {
    for (const type of Object.keys(CLOSE_MAIL_NOTES)) {
      expect(Object.hasOwn(EMAIL_TYPES, type)).toBe(true);
    }
  });

  test.each([
    "auth.verification_code",
    "auth.password_reset_code",
    "auth.registration_attempt",
    "reminders.daily_digest",
    "reminders.weekly_management_digest",
    "internal.new_signup_alert",
    "toString",
  ])("%s is never recorded", (type) => {
    expect(isLoggedEmailType(type)).toBe(false);
    expect(closeMailNote(type)).toBeNull();
  });

  test("a listed type reads as one plain sentence", () => {
    expect(closeMailNote("product.course_followup")).toBe(
      "Platform email sent: Course follow-up email",
    );
  });
});
