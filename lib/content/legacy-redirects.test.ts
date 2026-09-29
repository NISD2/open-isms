import { describe, expect, test } from "bun:test";
import { routing } from "@/i18n/routing";
import { ORDER_SLUGS, PRICING_SLUGS, PROMO_SIGNIN_SLUGS } from "@/i18n/slugs";
import { LEGACY_REDIRECTS, translatedSlugRedirects } from "./legacy-redirects";

describe("translatedSlugRedirects", () => {
  test("sends each locale's old slug to its new one, and skips locales that kept it", () => {
    const redirects = translatedSlugRedirects("/bestellen", ORDER_SLUGS);
    expect(redirects).toContainEqual({
      source: "/en/bestellen",
      destination: "/en/order",
      permanent: true,
    });
    expect(redirects).toContainEqual({
      source: "/fr/bestellen",
      destination: "/fr/commander",
      permanent: true,
    });
    // German and Dutch already read /bestellen.
    expect(redirects.map((r) => r.source)).not.toContain("/bestellen");
    expect(redirects.map((r) => r.source)).not.toContain("/nl/bestellen");
  });

  test("German, the unprefixed default, moves from /pricing to /preise", () => {
    expect(translatedSlugRedirects("/pricing", PRICING_SLUGS)).toContainEqual({
      source: "/pricing",
      destination: "/preise",
      permanent: true,
    });
  });
});

describe("the routing map and the redirects agree", () => {
  const pathnames = routing.pathnames as Record<string, string | Record<string, string>>;

  test("pricing, order and the promo page serve the slugs in i18n/slugs.ts", () => {
    expect(pathnames["/pricing"]).toEqual(PRICING_SLUGS);
    expect(pathnames["/bestellen"]).toEqual(ORDER_SLUGS);
    expect(pathnames["/anmelden"]).toEqual(PROMO_SIGNIN_SLUGS);
  });

  test("no redirect points at a URL that itself redirects", () => {
    const sources = new Set(LEGACY_REDIRECTS.map((r) => r.source));
    const chained = LEGACY_REDIRECTS.filter((r) => sources.has(r.destination));
    expect(chained).toEqual([]);
  });
});
