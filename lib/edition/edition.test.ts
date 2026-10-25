/**
 * The self-hosted image's list of nisd2.eu's own pages stays true to the code: every entry exists
 * to be left out, and every public page is a decision, either nisd2.eu's alone or kept on
 * installs. A new public page fails here until someone makes that choice.
 */
import { describe, expect, test } from "bun:test";
import { CANONICAL_PUBLIC_EXACT, CANONICAL_PUBLIC_PREFIXES } from "@/lib/public-paths";
import { planStrip } from "@/scripts/self-host-strip.mjs";
import { isNisd2Only, nisd2Url, routeOf } from ".";

/** Public pages a self-hosted install keeps: signing in, its own invites, its own newsletter. */
const KEPT_PUBLIC = [
  // The install's home: the proxy sends it to the app.
  "/",
  "/anmelden",
  "/auth",
  "/gap-assessment/share",
  "/newsletter",
  "/partner-agreement",
];

describe("the self-hosted image", () => {
  test("leaves out only what the tree has, so a moved page cannot slip back in", () => {
    expect(planStrip(process.cwd()).missing).toEqual([]);
  });

  test("decides every public page", () => {
    const undecided = [...CANONICAL_PUBLIC_EXACT, ...CANONICAL_PUBLIC_PREFIXES].filter(
      (path) => !isNisd2Only(path) && !KEPT_PUBLIC.includes(path),
    );
    expect(undecided).toEqual([]);
  });

  test("keeps no public page it also sends to nisd2.eu", () => {
    expect(KEPT_PUBLIC.filter(isNisd2Only)).toEqual([]);
  });

  test("keeps the app: the walkthrough's training records, suppliers, the dashboard", () => {
    expect(["/training", "/suppliers", "/dashboard"].filter(isNisd2Only)).toEqual([]);
  });
});

describe("routeOf", () => {
  test("drops the locale segment and route groups", () => {
    expect(routeOf("app/[locale]/(info)/training/nis2-ceo")).toBe("/training/nis2-ceo");
    expect(routeOf("app/docs")).toBe("/docs");
  });
});

describe("isNisd2Only", () => {
  test("covers a page and everything below it, on whole segments only", () => {
    expect(isNisd2Only("/wiki/nis2")).toBe(true);
    expect(isNisd2Only("/training/courses/nis2-ceo")).toBe(true);
    expect(isNisd2Only("/wikipedia")).toBe(false);
  });
});

describe("nisd2Url", () => {
  test("names the install it came from", () => {
    expect(nisd2Url("/", "https://isms.example.com")).toBe(
      "https://nisd2.eu/?utm_source=isms.example.com",
    );
  });

  test("leaves the install out when its address is not a URL", () => {
    expect(nisd2Url("/kurse", "")).toBe("https://nisd2.eu/kurse");
  });
});
