/**
 * The journey on a phone.
 *
 * Mobile is not a design target for the portal: the work happens at a desk,
 * and the rail and the legend are deliberately desktop-only. But a
 * Geschäftsführer who opens the link from a mail on their phone has to land on
 * something that reads, so the guarantee here is narrow and absolute. The page
 * must not scroll sideways, and the first step has to be reachable.
 *
 * This is a regression guard, not a fix for a known break: measured on
 * 2026-09-16 the guided path already fits. On a 360px screen the steps span
 * 27px to 354px, so there is about 6px of room on each side, and every width
 * involved is fixed (a 172px caption, a ±88px wave, the portal's 24px
 * padding), so the margin cannot drift with content. What it CAN do is vanish
 * if someone widens the caption or the wave, which is exactly what this file
 * is here to catch.
 *
 * The steps deliberately overflow their own 312px column and are kept on
 * screen by the portal's page padding. That coupling is load-bearing and
 * invisible from either file alone, which is the second reason to pin it here.
 *
 * 360px is the narrowest screen in real use (Galaxy-class Android; an iPhone
 * SE is 375). Below about 350px the path does run off the edge. That is a
 * deliberate floor, not an oversight.
 */
import { expect, type Page, test } from "@playwright/test";
import { setJourneyMode } from "../lib/journey";

const PHONE = { width: 360, height: 740 };

/**
 * A sideways scrollbar is the failure this file exists to catch, and it hides
 * easily: an `overflow-x: hidden` anywhere up the tree silently clips the
 * offending element instead of revealing it. So the document is asked whether
 * it scrolls AND every step is measured against the viewport. One without the
 * other passes a layout that is actually broken.
 *
 * The 1px tolerance is for subpixel rounding on a transformed element, not
 * slack: a real overflow is tens of pixels.
 */
async function expectNoSidewaysScroll(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(
    overflow.scrollWidth,
    `document scrolls sideways: ${overflow.scrollWidth}px of content in ${overflow.clientWidth}px`,
  ).toBeLessThanOrEqual(overflow.clientWidth + 1);
}

test.use({ viewport: PHONE });

test.afterAll(async () => {
  await setJourneyMode("team");
});

test("the guided path fits a phone, and its first step is reachable", async ({
  page,
}) => {
  await setJourneyMode("solo");
  await page.goto("/de/journey", { waitUntil: "networkidle" });

  const steps = page.getByTestId("journey-step");
  await expect(steps.first()).toBeVisible({ timeout: 20_000 });

  await expectNoSidewaysScroll(page);

  // Every step, not just the first: the wave swings both ways and its widest
  // offsets land in the middle of a section, so a first-step-only check would
  // pass a path that runs off the screen four nodes later.
  const boxes = await steps.evaluateAll((nodes) =>
    nodes.map((n) => {
      const r = n.getBoundingClientRect();
      return { left: Math.round(r.left), right: Math.round(r.right) };
    }),
  );
  expect(boxes.length, "the whole path should render, not a page of it").toBe(49);
  const escaped = boxes.filter((b) => b.left < -1 || b.right > PHONE.width + 1);
  expect(
    escaped.length,
    `${escaped.length} of ${boxes.length} steps reach past a ${PHONE.width}px screen: ${JSON.stringify(escaped.slice(0, 3))}`,
  ).toBe(0);

  // Reachable, not merely present. A step that renders off-canvas or under
  // the pinned bar is not a step the reader can take.
  await expect(steps.first()).toBeInViewport();

  // The rail is desktop-only by design, and this asserts the design rather
  // than tolerating it: on a phone the stage belongs in the pinned bar, and
  // a 224px rail beside a 360px screen would be the overflow.
  await expect(page.locator('[data-tour="journey-timeline"]')).toBeHidden();
});

test("the swimlane fits a phone", async ({ page }) => {
  await setJourneyMode("team");
  await page.goto("/de/journey", { waitUntil: "networkidle" });

  await expect(page.locator('[data-tour="journey-filters"]')).toBeVisible({
    timeout: 20_000,
  });
  await expectNoSidewaysScroll(page);
});
