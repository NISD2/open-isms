/**
 * The footer used to be the only part of an English email that came out in
 * German. `preferenceFooterFor`'s locale was optional, all five call sites
 * omitted it, and the layout fell back to `?? "de"` — so a digest arrived
 * with English copy above a German opt-out line, and the preference centre
 * link carried no `&lang=`, so the page a recipient landed on to opt out was
 * in the wrong language too.
 *
 * A required locale is the real guard, and the type enforces it. These pin
 * the two things a type cannot: that the language reaches both the rendered
 * footer and the link, and that each language renders its own copy rather
 * than silently sharing one.
 */
import { describe, expect, mock, test } from "bun:test";

mock.module("@/lib/env", () => ({
  env: {
    DATABASE_URL: "postgres://unused:unused@localhost:5432/unused",
    AUTH_SECRET: "test-secret-test-secret-test-secret",
    NEXT_PUBLIC_APP_URL: "https://example.test",
  },
  mailSupportEmail: () => "support@example.test",
}));

const { preferenceFooterFor } = await import("./footer");
const { preferenceFooterHtml, preferenceFooterText } = await import("./layout");

const LOCALES = ["de", "en", "nl"] as const;

describe("preferenceFooterFor", () => {
  for (const locale of LOCALES) {
    test(`carries ${locale} to the footer and the preference-centre link`, () => {
      const footer = preferenceFooterFor("user-1", "reminders.daily_digest", locale);

      expect(footer.locale).toBe(locale);
      // The opt-out page has to open in the language the email was written in.
      expect(footer.preferencesUrl).toContain(`lang=${locale}`);
    });
  }

  test("each language renders its own footer copy, in HTML and in text", () => {
    const footers = LOCALES.map((locale) =>
      preferenceFooterFor("user-1", "reminders.daily_digest", locale),
    );

    expect(new Set(footers.map(preferenceFooterHtml)).size).toBe(LOCALES.length);
    expect(new Set(footers.map(preferenceFooterText)).size).toBe(LOCALES.length);
  });

  test("an English footer says nothing in German", () => {
    const english = preferenceFooterHtml(
      preferenceFooterFor("user-1", "reminders.daily_digest", "en"),
    );

    expect(english).toContain("Unsubscribe from these emails");
    expect(english).not.toContain("Diese E-Mails abbestellen");
  });
});
