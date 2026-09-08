/**
 * L2 requirement detail: the four things a reader needs from the page and
 * that it silently failed to provide. Every case here is a defect Corey hit
 * while doing NIS 2 for a real company on this platform, and none of them
 * showed as an error — the page rendered, it just left something out.
 *
 *  1. What the requirement asks for. `description` and the pre-generated
 *     guidance were both resolved server-side and never rendered.
 *  2. Somewhere to put evidence. The uploader was gated on evidenceType
 *     "document" or "proof", which left 15 of the 49 NIS 2 requirements with
 *     no attachment control at all — including the management-training
 *     duties, whose entire evidence is a certificate.
 *  3. A way onward. prev/next were built from the current category only, so
 *     the last requirement of every category dead-ended.
 *  4. Keeping what was typed. Next was a plain link, so a dirty form was
 *     discarded on the way out.
 */
import { test, expect } from "@playwright/test";
import { gotoRequirement, requirementUrl } from "../lib/journey";

/** Management cybersecurity training: evidenceType "training", intake fields,
 *  moduleRef "training_record". One page, three of the four defects. */
const TRAINING_CODE = "1.1";
/** Last requirement of cryptography. The next one is 10.1, in access-control. */
const LAST_IN_CATEGORY = "9.3";
const FIRST_OF_NEXT_CATEGORY = "10.1";
/** Roles and responsibilities: moduleRef "team", which was wired nowhere. */
const ROLES_CODE = "1.2";

test("guidance: the page says what the requirement asks for", async ({ page }) => {
  await gotoRequirement(page, TRAINING_CODE);

  const guidance = page.getByTestId("requirement-guidance");
  await expect(guidance).toBeVisible({ timeout: 20_000 });

  // Requirement text and the generated summary are separate sources and both
  // were dropped. Assert on real length, not mere presence: an empty <p>
  // renders and would satisfy a visibility check.
  const text = (await guidance.innerText()).trim();
  expect(text.length, "guidance block renders substantive text").toBeGreaterThan(120);

  // The implementation steps sit behind a disclosure. Opening it is the
  // "how do I actually do this" path.
  const toggle = page.getByTestId("requirement-guidance-toggle");
  await expect(toggle).toBeVisible();
  await toggle.click();
  const expanded = (await guidance.innerText()).trim();
  expect(
    expanded.length,
    "opening the steps reveals more than the summary alone",
  ).toBeGreaterThan(text.length);
});

test("evidence: a training requirement can take an attachment", async ({ page }) => {
  await gotoRequirement(page, TRAINING_CODE);

  // The control itself. Gated on evidenceType, this was absent entirely.
  await expect(page.getByTestId("evidence-file-input")).toBeVisible({
    timeout: 20_000,
  });

  // And it says what kind of evidence belongs here, which is what the
  // evidenceType is actually good for.
  await expect(
    page.getByTestId("requirement-evidence"),
    "evidence section names the expected artefact",
  ).toContainText(/Schulungsnachweis|Zertifikat|training record|certificate/i);
});

test("navigation: the last requirement of a category leads into the next one", async ({
  page,
}) => {
  await gotoRequirement(page, LAST_IN_CATEGORY);

  const next = page.getByTestId("requirement-next");
  await expect(next, "9.3 must offer a way forward").toBeVisible({
    timeout: 20_000,
  });

  await next.click();

  // Compare paths with the locale prefix stripped from both sides:
  // localePrefix is "as-needed" and German is the default, so the canonical
  // German URL carries no /de segment even though the prefixed form resolves
  // too. The expected path still comes from the framework data, so reordering
  // a category there moves this assertion with it.
  const expected = requirementUrl(FIRST_OF_NEXT_CATEGORY).replace(/^\/de/, "");
  await expect
    .poll(() => new URL(page.url()).pathname.replace(/^\/de/, ""), {
      message: "9.3 leads to the first requirement of the next category",
      timeout: 20_000,
    })
    .toBe(expected);

  // Crossing a category is worth announcing, so the button carries the
  // section name rather than a bare "Next".
  await gotoRequirement(page, LAST_IN_CATEGORY);
  await expect(page.getByTestId("requirement-next")).not.toHaveText(/^Nächste$/);
});

test("navigation: leaving with unsaved input keeps it", async ({ page }) => {
  const typed = `Schulungsanbieter ${Date.now()}`;

  await gotoRequirement(page, TRAINING_CODE);

  const edit = page.getByTestId("requirement-edit");
  if (await edit.isVisible().catch(() => false)) await edit.click();

  const field = page
    .locator('[data-field="managementTrainingProvider"]')
    .locator("input, textarea")
    .first();
  await expect(field).toBeEditable({ timeout: 20_000 });
  await field.fill(typed);

  // Deliberately do NOT press Save. This is the exact sequence that used to
  // lose the work: type, then press Next.
  await Promise.all([
    page.waitForResponse(
      (r) =>
        r.url().includes("intake.saveRequirementAnswers") &&
        r.request().method() === "POST",
      { timeout: 20_000 },
    ),
    page.getByTestId("requirement-next").click(),
  ]);

  // Come back the long way round: a fresh load proves it was persisted, not
  // merely retained in client state.
  await gotoRequirement(page, TRAINING_CODE);
  await expect(
    page
      .locator('[data-field="managementTrainingProvider"]')
      .locator("input, textarea")
      .first(),
  ).toHaveValue(typed, { timeout: 20_000 });
});

test("module: roles and responsibilities reaches the team register", async ({ page }) => {
  await gotoRequirement(page, ROLES_CODE);

  // moduleRef "team" had no route, and ModuleRefPanel returned null on a
  // missing one, so this whole section rendered as blank space.
  const link = page.getByRole("link", { name: /öffnen|open/i }).first();
  await expect(link, "the team register must be reachable").toBeVisible({
    timeout: 20_000,
  });
  await expect(link).toHaveAttribute("href", /\/team$/);
});
