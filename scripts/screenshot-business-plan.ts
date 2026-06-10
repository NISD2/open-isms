/**
 * Capture screenshots of the /platform-admin/business-plan dashboard for
 * both DE and EN locales into business/plan/visuals/rendered/platform/{de,en}/.
 *
 * Usage (dev server must already be running on PORT=3026):
 *   ENABLE_DEV_AUTH=true bun run scripts/screenshot-business-plan.ts
 */

import { chromium, type Page, type BrowserContext } from "playwright";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const BASE_URL = process.env.SCREENSHOT_BASE_URL ?? "http://localhost:3026";
const ADMIN_EMAIL = process.env.SCREENSHOT_ADMIN_EMAIL ?? "simon@nisd2.eu";
const OUTPUT_ROOT = resolve(
  process.cwd(),
  "business/plan/visuals/rendered/platform"
);

interface SectionTarget {
  filename: string;
  selector: string;
  description: string;
}

const sections: SectionTarget[] = [
  { filename: "REF-01_geschaeftsmodell-fluss.png", selector: "section:has(span:text-is('REF-01'))", description: "REF-01" },
  { filename: "REF-02_tam-sam-som.png", selector: "section:has(span:text-is('REF-02'))", description: "REF-02" },
  { filename: "REF-03_wettbewerber-matrix.png", selector: "section:has(span:text-is('REF-03'))", description: "REF-03" },
  { filename: "REF-04_swot.png", selector: "section:has(span:text-is('REF-04'))", description: "REF-04" },
  { filename: "REF-05_umsatz-mix.png", selector: "section:has(span:text-is('REF-05'))", description: "REF-05" },
  { filename: "REF-06_break-even.png", selector: "section:has(span:text-is('REF-06'))", description: "REF-06" },
  { filename: "REF-07_realisierungsfahrplan.png", selector: "section:has(span:text-is('REF-07'))", description: "REF-07" },
  { filename: "REF-08_engagement.png", selector: "section:has(span:text-is('REF-08'))", description: "REF-08" },
  { filename: "REF-09_kostenvergleich.png", selector: "section:has(span:text-is('REF-09'))", description: "REF-09" },
  { filename: "REF-10_audit-coverage.png", selector: "section:has(span:text-is('REF-10'))", description: "REF-10" },
  { filename: "REF-11_reichweite-funnel.png", selector: "section:has(span:text-is('REF-11'))", description: "REF-11" },
  { filename: "REF-12_sensitivitaet.png", selector: "section:has(span:text-is('REF-12'))", description: "REF-12" },
];

async function signIn(page: Page) {
  await page.goto(`${BASE_URL}/api/auth/csrf`, { waitUntil: "networkidle" });
  const csrfBody = await page.evaluate(() => document.body.innerText);
  const parsed: unknown = JSON.parse(csrfBody);
  if (
    !parsed ||
    typeof parsed !== "object" ||
    !("csrfToken" in parsed) ||
    typeof (parsed as { csrfToken: unknown }).csrfToken !== "string"
  ) {
    throw new Error("csrfToken missing from /api/auth/csrf response");
  }
  const csrfToken = (parsed as { csrfToken: string }).csrfToken;

  const callbackStatus = await page.evaluate(
    async ({ baseUrl, csrf, email }) => {
      const body = new URLSearchParams({
        csrfToken: csrf,
        email,
        callbackUrl: `${baseUrl}/platform-admin/business-plan`,
        json: "true",
      });
      const res = await fetch(`${baseUrl}/api/auth/callback/dev`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
        credentials: "include",
      });
      return res.status;
    },
    { baseUrl: BASE_URL, csrf: csrfToken, email: ADMIN_EMAIL }
  );
  if (callbackStatus >= 400) {
    throw new Error(`Dev sign-in failed: HTTP ${callbackStatus}`);
  }
}

async function captureLocale(
  context: BrowserContext,
  locale: "de" | "en",
  outputDir: string
) {
  await mkdir(outputDir, { recursive: true });
  const page = await context.newPage();

  console.log(`[${locale}] Setting locale cookie ...`);
  await context.addCookies([
    {
      name: "locale",
      value: locale,
      domain: new URL(BASE_URL).hostname,
      path: "/",
    },
  ]);

  console.log(`[${locale}] Loading dashboard ...`);
  const localePath = locale === "de" ? "" : "/en";
  await page.goto(`${BASE_URL}${localePath}/platform-admin/business-plan`, {
    waitUntil: "networkidle",
  });

  await page.waitForSelector("h1:has-text('Business Plan')", { timeout: 10000 });
  await page.waitForSelector("svg.recharts-surface", { timeout: 10000 });
  // 2-second settle window for recharts entry animations (pie sweep, bar grow,
  // line draw). The .recharts-surface mount above only guarantees the SVG
  // exists, not that its content has finished animating.
  await page.waitForTimeout(2000);

  await page.addStyleTag({
    content: `
      [data-nextjs-toast],
      [data-next-mark],
      nextjs-portal,
      [data-nextjs-dev-tools],
      [data-nextjs-dialog-overlay],
      .__nextjs_original-stack-frame,
      #__next-build-watcher { display: none !important; visibility: hidden !important; opacity: 0 !important; }
    `,
  });

  await page.addStyleTag({
    content: `
      section.business-plan-section,
      section[class*="space-y-3"] {
        padding: 2rem !important;
        background: white !important;
        border-radius: 0.75rem;
      }
    `,
  });

  await page.addStyleTag({
    content: `
      .mx-auto.max-w-7xl { max-width: none !important; }
      [class*="overflow-x-auto"],
      [class*="overflow-x-scroll"],
      [class*="overflow-clip"] { overflow: visible !important; }
    `,
  });
  await page.evaluate(() => {
    const scrollables = Array.from(
      document.querySelectorAll<HTMLElement>("div")
    ).filter((el) => {
      const style = getComputedStyle(el);
      return (
        (style.overflowX === "auto" || style.overflowX === "scroll") &&
        el.scrollWidth > el.clientWidth
      );
    });
    for (const el of scrollables) {
      el.style.overflow = "visible";
      el.style.width = "max-content";
    }
    document
      .querySelectorAll<HTMLElement>(
        '[class*="h-[900px]"][class*="overflow-hidden"], [class*="h-[820px]"][class*="overflow-hidden"], [class*="h-[640px]"][class*="overflow-hidden"]'
      )
      .forEach((el) => {
        el.style.height = "auto";
        el.style.overflow = "visible";
      });
  });
  await page.waitForTimeout(600);

  for (const target of sections) {
    const locator = page.locator(target.selector).first();
    const found = await locator.count();
    if (!found) {
      console.warn(`[${locale}] Skipping ${target.filename} - selector not matched.`);
      continue;
    }
    const outPath = resolve(outputDir, target.filename);
    await locator.screenshot({ path: outPath, omitBackground: false });
    console.log(`[${locale}] Wrote ${outPath} (${target.description})`);
  }

  const fullPath = resolve(outputDir, "business-plan-fullpage.png");
  await page.screenshot({ path: fullPath, fullPage: true });
  console.log(`[${locale}] Wrote ${fullPath} (full page)`);

  await page.close();
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1800, height: 1400 },
    // 2x for prod-ready assets (retina-sharp, IHK PDF embed clarity).
    // The chat-preview API rejects images above 2000px per side, so when
    // re-previewing in a chat tool, fall back to deviceScaleFactor: 1.
    deviceScaleFactor: 2,
  });

  const signInPage = await context.newPage();
  console.log(`Signing in as ${ADMIN_EMAIL} via dev provider ...`);
  await signIn(signInPage);
  await signInPage.close();

  await captureLocale(context, "de", resolve(OUTPUT_ROOT, "de"));
  await captureLocale(context, "en", resolve(OUTPUT_ROOT, "en"));

  await browser.close();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
