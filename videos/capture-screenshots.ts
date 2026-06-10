import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { encode } from "@auth/core/jwt";

const BASE_URL = process.env.BASE_URL || "http://localhost:3026";
const AUTH_SECRET = process.env.AUTH_SECRET;
if (!AUTH_SECRET) throw new Error("AUTH_SECRET env var required");
const VIEWPORT = { width: 1440, height: 900 };

const PAGES = [
  { name: "dashboard", path: "/dashboard", waitFor: 3000 },
  { name: "compliance", path: "/compliance", waitFor: 3000 },
  { name: "risks", path: "/risks", waitFor: 3000 },
  { name: "audit-readiness", path: "/audit-readiness", waitFor: 3000 },
];

async function createSessionToken(): Promise<string> {
  const token = await encode({
    token: {
      name: "Dev Admin",
      email: "dev@nis2.local",
      sub: "dev-user-id",
    },
    secret: AUTH_SECRET,
    salt: "authjs.session-token",
  });
  return token;
}

async function capture() {
  mkdirSync("public/screenshots", { recursive: true });

  console.log("Creating NextAuth session token...");
  const sessionToken = await createSessionToken();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
  });

  // Set session cookie + English locale
  await context.addCookies([
    {
      name: "authjs.session-token",
      value: sessionToken,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
    {
      name: "locale",
      value: "en",
      domain: "localhost",
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    },
  ]);

  const page = await context.newPage();

  for (const { name, path, waitFor } of PAGES) {
    console.log(`Capturing ${name}...`);
    try {
      await page.goto(`${BASE_URL}${path}`, {
        waitUntil: "networkidle",
        timeout: 20000,
      });
      await page.waitForTimeout(waitFor);

      // Dismiss Next.js error overlay if present
      try {
        const closeBtn = page.locator('[data-nextjs-errors-dialog-close]');
        if (await closeBtn.isVisible({ timeout: 500 })) {
          await closeBtn.click();
          await page.waitForTimeout(500);
        }
      } catch {
        // No error overlay
      }

      // Also try clicking the dismiss button on the bottom-left error indicator
      try {
        const issuesBadge = page.locator('button:has-text("Issues")');
        if (await issuesBadge.isVisible({ timeout: 500 })) {
          // Hide the Next.js dev indicator by injecting CSS
          await page.evaluate(() => {
            const style = document.createElement("style");
            style.textContent = `
              [data-nextjs-dialog-overlay],
              [data-nextjs-toast],
              nextjs-portal { display: none !important; }
            `;
            document.head.appendChild(style);
          });
          await page.waitForTimeout(300);
        }
      } catch {
        // No issues badge
      }

      // Hide the Next.js dev tools indicator at bottom
      await page.evaluate(() => {
        const style = document.createElement("style");
        style.textContent = `
          nextjs-portal,
          [data-nextjs-dialog-overlay],
          [data-nextjs-toast] { display: none !important; }
        `;
        document.head.appendChild(style);
      });
      await page.waitForTimeout(200);

      const currentUrl = page.url();
      if (currentUrl.includes("/auth/signin")) {
        console.log(`  WARNING: Redirected to signin`);
      } else {
        console.log(`  OK: ${currentUrl}`);
      }

      await page.screenshot({
        path: `public/screenshots/${name}.png`,
        fullPage: false,
      });
      console.log(`  Saved public/screenshots/${name}.png`);
    } catch (err) {
      console.log(`  Error: ${err}`);
    }
  }

  await browser.close();
  console.log("\nDone!");
}

capture().catch(console.error);
