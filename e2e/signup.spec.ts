/**
 * Signup: a correct code has to end with the person signed in.
 *
 * The regression this pins cost real signups. /api/auth/register refuses to
 * touch passwordHash on an address that already exists and is pending
 * verification (audit C-1: without proof of ownership that overwrite is an
 * account takeover). The consequence was that signing up a second time kept
 * the FIRST password silently, so the card verified the code (which worked)
 * and then signed in with the password the person had just typed (which could
 * not). A correct code landed on "Something went wrong", the account was left
 * verified under a password nobody knew, and "Resend code" then sent nothing
 * because the address was no longer pending.
 *
 * Signing up twice is not an edge case: it is what someone does after
 * mistyping the password, or after forgetting they started weeks ago.
 *
 * The fix moved the password write onto the request that carries the code,
 * which is the ownership proof /register lacks. Both halves are asserted —
 * the session, and the stored hash — because a session alone would still pass
 * if the second password were dropped and the first one happened to work.
 */
import { expect, test } from "@playwright/test";
import bcrypt from "bcryptjs";
import { assertE2eTargets } from "./lib/env";
import { e2eQuery } from "./lib/db";

// Anonymous: every other project inherits the signed-in admin storage state,
// and this spec is about arriving with no session at all.
test.use({ storageState: { cookies: [], origins: [] } });

const FIRST_PASSWORD = "FirstPassword1!";
const SECOND_PASSWORD = "SecondPassword2!";

/**
 * Put one known live code in play for `email`, the way a resend does.
 *
 * The harness instance has no mail transport, so the real code is only ever
 * printed to the server log. Planting the row instead keeps the assertion on
 * the flow rather than on log scraping, and consuming the earlier rows first
 * reproduces requestOtp's own "newest code wins" invariant.
 */
async function plantCode(email: string, code: string): Promise<void> {
  assertE2eTargets();
  await e2eQuery(
    `update email_otp set consumed_at = now()
      where email = $1 and purpose = 'email_verify' and consumed_at is null`,
    [email],
  );
  await e2eQuery(
    `insert into email_otp (email, code_hash, purpose, expires_at)
      values ($1, $2, 'email_verify', now() + interval '10 minutes')`,
    [email, await bcrypt.hash(code, 10)],
  );
}

async function registerWith(page: import("@playwright/test").Page, email: string, password: string) {
  // "Use a different email" returns to the form but leaves it in register
  // mode, so the switch is only there on the first pass.
  const toRegister = page.getByRole("button", {
    name: "Noch kein Konto? Jetzt registrieren",
  });
  if (await toRegister.isVisible().catch(() => false)) await toRegister.click();
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.locator('input[type="checkbox"]').check();
  await page.getByRole("button", { name: "Konto erstellen" }).click();
  await expect(page.locator("#code")).toBeVisible({ timeout: 30_000 });
}

test("signing up a second time signs in with the password typed that time", async ({ page }) => {
  const email = `signup-twice-${Date.now()}@e2e.local`;

  await page.goto("/de/auth/signin");
  await registerWith(page, email, FIRST_PASSWORD);

  // Back out and sign up again, as someone does after mistyping the password.
  await page.getByRole("button", { name: "Andere E-Mail verwenden" }).click();
  await registerWith(page, email, SECOND_PASSWORD);

  await plantCode(email, "123456");
  await page.locator("#code").fill("123456");
  await page.getByRole("button", { name: "Bestätigen und anmelden" }).click();

  await page.waitForURL(/\/(journey|dashboard)/, { timeout: 30_000 });

  const [row] = await e2eQuery<{ password_hash: string; email_verified_at: string | null }>(
    `select password_hash, email_verified_at from "user" where email = $1`,
    [email],
  );
  expect(row.email_verified_at).not.toBeNull();
  expect(await bcrypt.compare(SECOND_PASSWORD, row.password_hash)).toBe(true);
});

/**
 * The other half of the same incident: reaching the code step from the LOGIN
 * form used to fire an automatic resend, which invalidates every earlier code.
 * The code in the mail the person was reading was dead before they finished
 * typing it, and asking for another lost that one the same way — which is why
 * the report was "I have to send it two or three times".
 *
 * Asserted through the DB rather than the UI: a resend is only observable as a
 * new email_otp row, and the point is that reaching this step creates none.
 */
test("reaching the code step from the login form does not invalidate the code already sent", async ({
  page,
}) => {
  const email = `signup-login-nudge-${Date.now()}@e2e.local`;

  await page.goto("/de/auth/signin");
  await registerWith(page, email, FIRST_PASSWORD);

  await plantCode(email, "654321");
  const before = await e2eQuery<{ id: string }>(
    `select id from email_otp where email = $1 and consumed_at is null`,
    [email],
  );
  expect(before).toHaveLength(1);

  // Start over at the login form with the correct password: the account is
  // real but unverified, so authorize() answers EMAIL_NOT_VERIFIED and the
  // card moves to the code step.
  await page.reload();
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(FIRST_PASSWORD);
  await page.getByRole("button", { name: "Anmelden" }).click();
  await expect(page.locator("#code")).toBeVisible({ timeout: 30_000 });

  // The resend this guards against was fired after the step switch, not
  // before it, so the code field appearing does not mean the request is done.
  // Proving a request never happens means giving it time to happen first.
  await page.waitForTimeout(3000);

  const after = await e2eQuery<{ id: string }>(
    `select id from email_otp where email = $1 and consumed_at is null`,
    [email],
  );
  expect(after).toHaveLength(1);
  expect(after[0].id).toBe(before[0].id);

  // And the code that was already in the inbox still works.
  await page.locator("#code").fill("654321");
  await page.getByRole("button", { name: "Bestätigen und anmelden" }).click();
  await page.waitForURL(/\/(journey|dashboard)/, { timeout: 30_000 });
});
