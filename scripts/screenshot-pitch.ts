#!/usr/bin/env bun
// Regenerates pitch deck screenshots using Playwright (waits for images to load).
// Usage: bun scripts/screenshot-pitch.ts
//        bun scripts/screenshot-pitch.ts --slide 3   (reshoot one slide, 0-indexed)
//        bun scripts/screenshot-pitch.ts --locale en (one locale only)

import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { join } from "path";

const BASE_URL = "https://nisd2.eu/pitch-preview";
const OUT = "public/pitch/slides";
const LOCALES = ["en", "de"] as const;
const TOTAL = 11;
const WIDTH = 896;
const HEIGHT = 504;

// Parse args
const args = process.argv.slice(2);
const slideIdx = args.includes("--slide") ? parseInt(args[args.indexOf("--slide") + 1]) : null;
const localeArg = args.includes("--locale") ? args[args.indexOf("--locale") + 1] : null;
const locales = localeArg ? [localeArg as (typeof LOCALES)[number]] : LOCALES;

const browser = await chromium.launch();

for (const locale of locales) {
  mkdirSync(join(OUT, locale), { recursive: true });
  const slides = slideIdx !== null ? [slideIdx] : Array.from({ length: TOTAL }, (_, i) => i);

  for (const i of slides) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: WIDTH, height: HEIGHT });
    await page.goto(`${BASE_URL}?s=${i}&l=${locale}`, { waitUntil: "networkidle" });
    // Wait for all images to finish loading
    await page.waitForFunction(() =>
      Array.from(document.images).every((img) => img.complete && img.naturalWidth > 0)
    );
    const n = String(i).padStart(2, "0");
    const path = join(OUT, locale, `slide-${n}.png`);
    await page.screenshot({ path, clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
    await page.close();
    console.log(`  ok  ${locale}/slide-${n}.png`);
  }
}

await browser.close();
console.log("Done. Commit public/pitch/slides/ to update mobile screenshots.");
