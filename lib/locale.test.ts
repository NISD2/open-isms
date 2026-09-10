/**
 * `isLocaleCode` is the gate on every locale that reaches the database:
 * the three auth routes narrow their request body with it, the OAuth path
 * narrows a cookie a browser can set to anything, and user.setLocale narrows
 * its tRPC input. A guard that said yes too readily would write junk into
 * user.locale, where resolveEmailLocale would quietly turn it into English.
 */
import { describe, expect, test } from "bun:test";
import { routing } from "@/i18n/routing";
import { isLocaleCode, LOCALE_COOKIE, LOCALES } from "./locale";

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
  test("every switcher code is a locale the router serves", () => {
    // lib/locale.ts says "every `code` must exist in i18n/routing.ts" in a
    // comment. This is that comment as a test: a code that drifts out of
    // routing would render a switcher entry that navigates to a 404.
    const served: readonly string[] = routing.locales;
    for (const { code } of LOCALES) {
      expect(served).toContain(code);
    }
  });

  test("the router serves nothing the switcher hides", () => {
    const offered = LOCALES.map((l) => l.code);
    for (const code of routing.locales) {
      expect(offered).toContain(code);
    }
  });

  test("the cookie name is the one next-intl is configured with", () => {
    // lib/auth/config.ts reads this cookie by name to seed a signup's locale.
    // If routing stopped passing LOCALE_COOKIE, that read would silently
    // return undefined and every Google signup would land back on null.
    expect(routing.localeCookie).toMatchObject({ name: LOCALE_COOKIE });
  });
});
