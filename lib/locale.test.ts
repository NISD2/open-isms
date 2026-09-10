/**
 * `isLocaleCode` is the gate on every locale that reaches the database:
 * the three auth routes narrow their request body with it, the OAuth path
 * narrows a cookie a browser can set to anything, and user.setLocale narrows
 * its tRPC input. A guard that said yes too readily would write junk into
 * user.locale, where resolveEmailLocale would quietly turn it into English.
 */
import { describe, expect, test } from "bun:test";
import { routing } from "@/i18n/routing";
import { EMAIL_LOCALES } from "@/lib/mail/locale";
import { isLocaleCode, LOCALE_CODES, LOCALE_COOKIE, LOCALES } from "./locale";

describe("isLocaleCode", () => {
  test("accepts every locale the switcher offers", () => {
    for (const { code } of LOCALES) {
      expect(isLocaleCode(code)).toBe(true);
    }
  });

  test("rejects absent values", () => {
    expect(isLocaleCode(null)).toBe(false);
    expect(isLocaleCode(undefined)).toBe(false);
    expect(isLocaleCode("")).toBe(false);
  });

  test("rejects real locales the app does not serve", () => {
    for (const code of ["da", "sv", "fi", "el", "hu", "en-GB", "de-AT"]) {
      expect(isLocaleCode(code)).toBe(false);
    }
  });

  test("rejects near-misses rather than coercing them", () => {
    // A cookie is attacker-settable and a request body is user-settable, so
    // the guard has to be exact rather than forgiving. "DE" reaching the
    // column would resolve to English mail for a German reader.
    for (const code of ["DE", "De", " de", "de ", "de;en", "../de"]) {
      expect(isLocaleCode(code)).toBe(false);
    }
  });
});

describe("locale sources agree", () => {
  test("the router serves exactly LOCALE_CODES, in that order", () => {
    // routing.locales is now built from LOCALE_CODES, so this is a tripwire
    // against someone re-introducing a second hardcoded list — which is what
    // i18n/routing.ts carried before, agreeing with this one by luck.
    expect(routing.locales).toEqual(LOCALE_CODES);
  });

  test("the switcher offers every code the router serves, no more", () => {
    // Same set, different order: the switcher lists English first, routing
    // lists the default locale first. Sorting is the point of the test.
    const offered = LOCALES.map((l) => l.code).sort();
    expect(offered).toEqual([...LOCALE_CODES].sort());
  });

  test("every switcher entry has a real label", () => {
    // `satisfies Record<LocaleCode, string>` catches a missing label at
    // compile time; this catches an empty or placeholder one.
    for (const { code, label } of LOCALES) {
      expect(label.trim().length).toBeGreaterThan(0);
      expect(label).not.toBe(code);
    }
  });

  test("email locales are a subset of the app's locales", () => {
    // EMAIL_LOCALES is typed `satisfies readonly LocaleCode[]`, so this is the
    // runtime half: mail copy can be narrower than the site, never wider.
    for (const code of EMAIL_LOCALES) {
      expect(isLocaleCode(code)).toBe(true);
    }
  });

  test("the cookie name is the one next-intl is configured with", () => {
    // lib/auth/config.ts reads this cookie by name to seed a signup's locale.
    // If routing stopped passing LOCALE_COOKIE, that read would silently
    // return undefined and every Google signup would land back on null.
    expect(routing.localeCookie).toMatchObject({ name: LOCALE_COOKIE });
  });
});
