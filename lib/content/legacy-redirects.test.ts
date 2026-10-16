import { describe, expect, test } from "bun:test";
import { routing } from "@/i18n/routing";
import { ORDER_SLUGS, PRICING_SLUGS, PROMO_SIGNIN_SLUGS } from "@/i18n/slugs";
import {
  LEGACY_REDIRECTS,
  movedWikiRedirects,
  translatedSlugRedirects,
} from "./legacy-redirects";
import { wikiSitemapPaths } from "./wiki-toc";

describe("movedWikiRedirects", () => {
  const moved = movedWikiRedirects();

  test("every locale of a moved page lands on the target in its own language", () => {
    expect(moved).toContainEqual({
      source: "/en/wiki/implementation/nis2-registration-portals",
      destination: "/en/wiki/timelines-and-status/nis2-eu-implementation#portals",
      permanent: true,
    });
    expect(moved).toContainEqual({
      source: "/wiki/anwendungsbereich/nis2-mehrere-eu-laender",
      destination: "/wiki/zeit-und-status/nis2-umsetzung-europa",
      permanent: true,
    });
    const locales = (path: string) => path.split("/")[1];
    expect(moved.filter((r) => locales(r.source) !== locales(r.destination))).toEqual([]);
  });

  test("a moved page is not in the sitemap", () => {
    const listed = new Set(wikiSitemapPaths().map((p) => p.path));
    expect(listed.has("/wiki/anwendungsbereich/nis2-mehrere-eu-laender")).toBe(false);
    expect(listed.has("/wiki/umsetzung/nis2-registration-portals")).toBe(false);
  });
});

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

  test("a Czech URL never redirects to a page in another language", () => {
    const czech = (path: string) => path === "/cs" || path.startsWith("/cs/");
    const leaving = LEGACY_REDIRECTS.filter(
      (r) => czech(r.source) && !czech(r.destination),
    );
    expect(leaving).toEqual([]);
  });
});
