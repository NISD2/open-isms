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
  setGuideState("tour_dismissed_at = NOW(), help_offer_dismissed_at = NOW()");

test.afterAll(retire);

test("the tour runs on a first login, and stays gone once dismissed", async ({
  page,
}) => {
  await setGuideState("login_count = 1, tour_dismissed_at = NULL");

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

test("a second login offers help, and does not offer it twice", async ({
  page,
}) => {
  await setGuideState("login_count = 2, help_offer_dismissed_at = NULL");

  await page.goto("/journey");
  const dialog = page.getByTestId("help-dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("contact@nisd2.eu");

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
