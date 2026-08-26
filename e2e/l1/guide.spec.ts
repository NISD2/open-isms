/**
 * The one-time onboarding surfaces, driven against the real app.
 *
 * These are gated server-side on `user.login_count`, so this spec owns that
 * column for the duration of the file: it arms each surface by hand, checks
 * the behaviour, then hands the user back to the rest of the suite retired.
 * auth.setup.ts re-retires both harness users unconditionally on every run,
 * so a crash here cannot poison the next one.
 */
import { test, expect } from "@playwright/test";
import { e2eQuery } from "../lib/db";
import { E2E_USER_EMAIL } from "../lib/env";

async function setGuideState(sql: string): Promise<void> {
  await e2eQuery(`UPDATE "user" SET ${sql} WHERE email = $1`, [E2E_USER_EMAIL]);
}

/** Both surfaces persist their dismissal through a mutation, so a reload
 *  issued straight after the click would race the write it is meant to test. */
async function dismissalLanded(column: string): Promise<void> {
  await expect
    .poll(async () => {
      const [row] = await e2eQuery<Record<string, Date | null>>(
        `SELECT ${column} AS stamped FROM "user" WHERE email = $1`,
        [E2E_USER_EMAIL],
      );
      return row?.stamped !== null;
    })
    .toBe(true);
}

const retire = () =>
  setGuideState(
    "tour_dismissed_at = NOW(), requirement_tour_dismissed_at = NOW(), help_offer_dismissed_at = NOW()",
  );

test.afterAll(retire);

test("the tour runs on a first login, and stays gone once dismissed", async ({
  page,
}) => {
  await setGuideState("login_count = 1, tour_dismissed_at = NULL, requirement_tour_dismissed_at = NULL");

  await page.goto("/journey");
  const card = page.getByTestId("tour-card");
  await expect(card).toBeVisible();

  // Step forward once to prove the tour advances rather than showing one fixed
  // card, then leave from the middle. Asserted on the step counter, which is
  // digits in every locale, because the suite runs the German UI.
  const progress = page.getByTestId("tour-progress");
  await expect(progress).toContainText("1");
  await page.getByTestId("tour-next").click();
  await expect(progress).toContainText("2");

  await page.getByTestId("tour-skip").click();
  await expect(card).toBeHidden();
  await dismissalLanded("tour_dismissed_at");

  // Dismissal is a stamped column, not a client flag, so it survives a reload.
  await page.reload();
  await expect(card).toBeHidden();
});

test("every tour card lands fully on screen, and the tour opens on the board", async ({
  page,
}) => {
  await setGuideState("login_count = 1, tour_dismissed_at = NULL, requirement_tour_dismissed_at = NULL");

  await page.goto("/journey");
  const card = page.getByTestId("tour-card");
  await expect(card).toBeVisible();

  // The opening step lights up the whole board rather than floating a card
  // over a dimmed screen, so the spotlight is there from step one and it is
  // the board it sits on.
  const ring = page.locator(".ring-primary");
  await expect(ring).toHaveCount(1);

  const ringBox = await ring.boundingBox();
  const boardBox = await page.locator('[data-tour="journey-board"]').boundingBox();
  if (!ringBox || !boardBox) throw new Error("board or spotlight not rendered");
  // Same box, give or take the spotlight padding, and clamped to the viewport
  // because the board runs off the bottom of the screen.
  expect(Math.abs(ringBox.x - boardBox.x)).toBeLessThanOrEqual(12);
  expect(Math.abs(ringBox.width - boardBox.width)).toBeLessThanOrEqual(24);

  const viewport = page.viewportSize();
  if (!viewport) throw new Error("headless run has no viewport size");

  const total = Number(
    (await page.getByTestId("tour-progress").textContent())?.match(
      /(\d+)\s*$/,
    )?.[1],
  );
  expect(total).toBeGreaterThan(4);

  for (let step = 1; step <= total; step++) {
    await expect(page.getByTestId("tour-progress")).toContainText(String(step));

    // The regression: `firstStep` preferred a horizontal side while sitting on
    // a row that spans the whole content column, so Radix flipped it left and
    // parked it at a negative x. On the shipped build this assertion fails at
    // that step with the card half off the screen.
    //
    // Clicking through each step covers the other half: a click is hit-tested,
    // so a card painting behind the scrim would fail here rather than pass.
    const box = await card.boundingBox();
    if (!box) throw new Error(`step ${step} rendered no card`);
    expect(box.x, `step ${step} card left edge`).toBeGreaterThanOrEqual(0);
    expect(box.y, `step ${step} card top edge`).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width, `step ${step} card right edge`).toBeLessThanOrEqual(
      viewport.width,
    );
    expect(
      box.y + box.height,
      `step ${step} card bottom edge`,
    ).toBeLessThanOrEqual(viewport.height);

    if (step < total) await page.getByTestId("tour-next").click();
  }

  // The last step closes the tour rather than advancing past the end.
  await page.getByTestId("tour-next").click();
  await expect(card).toBeHidden();
  await dismissalLanded("tour_dismissed_at");
});

test("skipping the journey walkthrough leaves the requirement one armed", async ({
  page,
}) => {
  await setGuideState(
    "login_count = 1, tour_dismissed_at = NULL, requirement_tour_dismissed_at = NULL",
  );

  // Skip out of the journey walkthrough entirely.
  await page.goto("/journey");
  const card = page.getByTestId("tour-card");
  await expect(card).toBeVisible();
  await page.getByTestId("tour-skip").click();
  await expect(card).toBeHidden();
  await dismissalLanded("tour_dismissed_at");

  // The requirement page still runs its own, which is the whole point of the
  // split: one shared flag used to make this second card never appear.
  await page.goto("/compliance/risk-management/2.1");
  await expect(card).toBeVisible();
  await expect(page.getByTestId("tour-progress")).toContainText("1");

  // And dismissing that one stamps only its own column.
  await page.getByTestId("tour-skip").click();
  await expect(card).toBeHidden();
  await dismissalLanded("requirement_tour_dismissed_at");
});

test("the requirement walkthrough survives arriving from the journey", async ({
  page,
}) => {
  await setGuideState(
    "login_count = 1, tour_dismissed_at = NOW(), requirement_tour_dismissed_at = NULL",
  );

  await page.goto("/journey");
  await expect(page.getByTestId("journey-node-2.1")).toBeVisible();

  // Hold the requirement page back so its loading skeleton is what is on
  // screen while the portal header — which owns the walkthrough and stays
  // mounted across the navigation — is already hydrated.
  //
  // That gap is the regression. The guide used to sample the DOM once, a
  // single frame after the route changed, and keep whatever it found. On this
  // path it found the skeleton, ended up with no steps, and had nothing left
  // to re-run the check, so the walkthrough was silently gone until the page
  // was reloaded by hand a couple of times.
  await page.route("**/compliance/**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 2_000));
    await route.continue();
  });

  await page.getByTestId("journey-node-2.1").click();

  const card = page.getByTestId("tour-card");
  await expect(card).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("tour-progress")).toContainText("1");

  await page.getByTestId("tour-skip").click();
  await expect(card).toBeHidden();
  await dismissalLanded("requirement_tour_dismissed_at");
});

test("a second login offers help, and does not offer it twice", async ({
  page,
}) => {
  await setGuideState("login_count = 2, help_offer_dismissed_at = NULL");

  await page.goto("/journey");
  const dialog = page.getByTestId("help-dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("cory@nisd2.eu");

  // The address is a copy button rather than a mailto, so it has to actually
  // put something on the clipboard.
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await dialog.getByTestId("help-copy-email").click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe("cory@nisd2.eu");

  // Exactly one close control: the explicit button, with the built-in corner
  // cross suppressed, so "close" and "never again" cannot disagree.
  await expect(dialog.locator('[data-slot="dialog-close"]')).toHaveCount(0);
  await dialog.getByTestId("help-close").click();
  await expect(dialog).toBeHidden();
  await dismissalLanded("help_offer_dismissed_at");

  await page.reload();
  await expect(page.getByTestId("help-dialog")).toBeHidden();
});

test("the tour does not arm itself on a later login", async ({ page }) => {
  await setGuideState("login_count = 5, tour_dismissed_at = NULL");

  await page.goto("/journey");
  await expect(page.getByTestId("tour-card")).toBeHidden();
});
