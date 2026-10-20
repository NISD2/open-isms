/**
 * The platform admin's tab addresses. Pinned here: each tab has its own address that leads back to
 * it, and no address takes the name of an admin page that already lives beside the tabs (a static
 * route would win, and the tab could never be reached).
 */
import { describe, expect, test } from "bun:test";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { ADMIN_TAB_SLUGS, type Tab, tabOfSlug } from "./admin-tabs";

const ADMIN_DIR = join(
  import.meta.dir,
  "../../app/[locale]/(platform-admin)/platform-admin",
);

describe("platform admin tab addresses", () => {
  test("each tab's address leads back to it, and no two share one", () => {
    const tabs = Object.keys(ADMIN_TAB_SLUGS) as Tab[];
    for (const tab of tabs) expect(tabOfSlug(ADMIN_TAB_SLUGS[tab])).toBe(tab);
    expect(new Set(Object.values(ADMIN_TAB_SLUGS)).size).toBe(tabs.length);
  });

  test("an address that is no tab names none", () => {
    expect(tabOfSlug("")).toBeNull();
    expect(tabOfSlug("nope")).toBeNull();
  });

  test("no tab takes the name of an admin page beside it", () => {
    const pages = readdirSync(ADMIN_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("["))
      .map((entry) => entry.name);
    expect(pages).toContain("metrics");
    for (const slug of Object.values(ADMIN_TAB_SLUGS)) expect(pages).not.toContain(slug);
  });
});
