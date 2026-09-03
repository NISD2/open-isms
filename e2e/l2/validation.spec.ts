/**
 * Negative path: validation must actually block bad input. Submitting the
 * risks create form with its required title empty must surface a field
 * error and must NOT create a record. This is the inverse of PR #25's bug
 * class (forms that could never submit); here we prove they also cannot
 * submit what they must not.
 */
import { test, expect } from "@playwright/test";
import { e2eQuery } from "../lib/db";

const countRisks = async () =>
  (await e2eQuery<{ n: string }>(`SELECT count(*)::text AS n FROM risk`))[0].n;

test("empty required field blocks submit with a visible error", async ({ page }) => {
  await page.goto("/de/risks");
  const submit = page.getByTestId("schema-form-submit");
  await expect(submit).toBeVisible({ timeout: 20_000 });

  const before = await countRisks();
  await submit.click();

  // react-hook-form + zod surface a message in the title field's slot and
  // block onSubmit entirely — the form stays in edit state with the error.
  await expect(
    page.locator('[data-field="title"] [id$="form-item-message"]'),
  ).toBeVisible({ timeout: 10_000 });
  await expect(submit).toBeEnabled();

  // The docstring above claimed this and nothing checked it: an error message
  // rendering does not by itself prove the mutation was blocked. A form that
  // both complained and wrote the row would have passed.
  expect(await countRisks(), "a row was created despite the validation error").toBe(before);
});
