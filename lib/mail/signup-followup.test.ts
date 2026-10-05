import { describe, expect, test } from "bun:test";
import { BOOKING_URL } from "@/lib/booking";
import { signupFollowUp } from "./signup-followup";

describe("signupFollowUp", () => {
  test("German signups get the German offer with the German approval page", () => {
    const mail = signupFollowUp({ name: "Anna Beispiel", locale: "de" });
    expect(mail.locale).toBe("de");
    expect(mail.body.startsWith("Guten Tag Anna Beispiel,")).toBe(true);
    expect(mail.body).toContain(
      "4.800 € netto im Jahr, auf Rechnung, 30 Tage Geld zurück.",
    );
    expect(mail.body).toContain("/preise/freigabe");
  });

  test("everyone else gets English, including Dutch", () => {
    const mail = signupFollowUp({ name: "Jan", locale: "nl" });
    expect(mail.locale).toBe("en");
    expect(mail.body.startsWith("Hello Jan,")).toBe(true);
    expect(mail.body).toContain("/en/pricing/approval");
  });

  test("the booking link carries the follow-up's campaign tags", () => {
    const mail = signupFollowUp({ name: "Anna", locale: "de" });
    expect(mail.body).toContain(
      `${BOOKING_URL}?utm_source=signup&utm_medium=email&utm_campaign=follow-up`,
    );
  });

  test("a name that is an email address stays out of the greeting", () => {
    expect(signupFollowUp({ name: "anna@example.test", locale: "de" }).body).toMatch(
      /^Guten Tag,\n/,
    );
    expect(signupFollowUp({ name: null, locale: "en" }).body).toMatch(/^Hello,\n/);
  });

  test("no dash pairs or em dashes in either language", () => {
    for (const locale of ["de", "en"] as const) {
      const { body } = signupFollowUp({ name: "A", locale });
      expect(body).not.toContain("—");
      expect(body).not.toContain(" - ");
    }
  });
});
