/**
 * Capture the surfaces that used to show a non-NIS 2 framework, so the
 * "NIS 2 only in the UI" change can be eyeballed rather than trusted.
 *
 * Run against a served e2e state (bun run e2e:serve), which holds the Dev GmbH
 * tenant. Writes PNGs to e2e/screenshots/.
 *
 *   bun run e2e/nis2-only-screenshots.ts
 */
import { chromium, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { assertE2eTargets } from "./lib/env";
import { signInViaForm } from "./lib/signin";

const OUT_DIR = join(process.cwd(), "e2e", "screenshots");
const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3410";
const ADMIN_EMAIL = "dev@nis2.local";

const SHOTS = [
  { name: "01-journey", path: "/de/journey", waitFor: "Ihr Weg" },
  { name: "02-compliance-index", path: "/de/compliance", waitFor: null },
  { name: "03-dashboard-stats", path: "/de/dashboard/stats", waitFor: null },
  { name: "04-export", path: "/de/export", waitFor: null },
  { name: "05-review", path: "/de/review", waitFor: null },
  { name: "06-team", path: "/de/team", waitFor: null },
] as const;

/** Category slugs that must NOT resolve any more, one per hidden framework. */
const HIDDEN_CATEGORY_SLUGS = [
  "gdpr-toms",
  "aiact-literacy",
  "cra-sbom",
  "isms-clauses",
] as const;

async function shoot(page: Page, name: string, path: string, waitFor: string | null) {
  await page.goto(`${BASE_URL}${path}`, { waitUntil: "networkidle" });
  if (waitFor) {
    await page.getByText(waitFor, { exact: false }).first().waitFor({ timeout: 30_000 });
  }
  await page.screenshot({ path: join(OUT_DIR, `${name}.png`), fullPage: true });
  const body = await page.locator("body").innerText();
  const sidebar = page.locator('[data-slot="sidebar"]').first();
  const sidebarText = (await sidebar.count()) > 0 ? await sidebar.innerText() : "";
  return { body, sidebarText };
}

/**
 * Two different checks, because the two surfaces fail differently.
 *
 * The sidebar renders one group per active framework, labelled with the
 * framework's name, so a name appearing there means the group is rendering.
 * Page bodies need the stricter test: NIS 2 requirement prose legitimately
 * cites "ISO 27001" and "DSGVO" as references, so only a requirement CODE
 * prefix proves a foreign requirement is actually being listed.
 */
const FORBIDDEN_IN_SIDEBAR = ["DSGVO", "GDPR", "AI Act", "Cyber Resilience", "ISO 27001"] as const;
const FORBIDDEN_CODE_PREFIXES = ["DSGVO-", "AI-", "CRA-", "ISO27001-"] as const;

async function main() {
  assertE2eTargets();
  mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  // baseURL: lib/signin.ts navigates to the relative "/de/auth/signin", which
  // Playwright only resolves against a context baseURL.
  const context = await browser.newContext({
    baseURL: BASE_URL,
    locale: "de-DE",
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  await signInViaForm(page, ADMIN_EMAIL);

  const findings: string[] = [];

  for (const shot of SHOTS) {
    const { body, sidebarText } = await shoot(page, shot.name, shot.path, shot.waitFor);
    const hits = [
      ...FORBIDDEN_IN_SIDEBAR.filter((f) => sidebarText.includes(f)).map((f) => `sidebar:${f}`),
      ...FORBIDDEN_CODE_PREFIXES.filter((f) => body.includes(f)).map((f) => `body:${f}`),
    ];
    console.log(`  ${shot.name.padEnd(22)} ${shot.path.padEnd(24)} ${hits.length ? `LEAK: ${hits.join(", ")}` : "clean"}`);
    if (hits.length) findings.push(`${shot.path}: ${hits.join(", ")}`);
  }

  // Direct-URL probe: a hidden framework's category page must not render.
  for (const slug of HIDDEN_CATEGORY_SLUGS) {
    const url = `${BASE_URL}/de/compliance/${slug}`;
    const res = await page.goto(url, { waitUntil: "networkidle" });
    const status = res?.status() ?? 0;
    const body = await page.locator("body").innerText();
    // notFound() renders the 404 boundary; either a 404 status or the absence
    // of a requirement table counts as hidden.
    const rendered = status === 200 && !/nicht gefunden|not found|404/i.test(body);
    console.log(`  probe /de/compliance/${slug.padEnd(16)} status=${status} ${rendered ? "STILL RENDERS" : "hidden"}`);
    if (rendered) findings.push(`${url} still renders (status ${status})`);
    await page.screenshot({ path: join(OUT_DIR, `probe-${slug}.png`), fullPage: true });
  }

  await browser.close();

  console.log(findings.length === 0 ? "\nAll captured surfaces clean." : `\n${findings.length} leak(s):`);
  for (const f of findings) console.log(`  - ${f}`);
  process.exit(findings.length === 0 ? 0 : 1);
}

await main();
