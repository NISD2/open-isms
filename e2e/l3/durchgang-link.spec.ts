/**
 * L3 walk and journey stay one: a step filled in through the walk waits for sign-off in both, a
 * sign-off on the requirement page shows as signed on the walk home and the journey, and
 * withdrawing it there opens the step again in the walk. Real UI, real Postgres.
 *
 * Runs in L3, after the intake specs saved answers, so 3.1 is signable (as in signoff.spec.ts).
 * Cleanup puts the status rows, the sign-off chain, the walk event and the journey mode back.
 */
import { expect, type Page, test } from "@playwright/test";
import {
  e2eTenant,
  fillWalkItem,
  keepSignOffs,
  payFor,
  requirementStatus,
  type Tenant,
  type Undo,
  undoAll,
} from "../lib/durchgang";
import { gotoRequirement, setJourneyMode, signOffViaUi } from "../lib/journey";

const CODE = "3.1";
const HEADLINE = "Planen, was bei einem Vorfall passiert";

/** The walk home's card for the step, named with the state its circle shows. */
async function walkState(page: Page): Promise<string> {
  await page.goto("/de/durchgang/nis2", { waitUntil: "networkidle" });
  // The state is read out after the headline: "Headline : Wartet auf Freigabe".
  const card = page.getByRole("link", { name: new RegExp(`^${HEADLINE}\\s*:`) });
  await expect(card).toBeVisible({ timeout: 30_000 });
  return (await card.textContent())?.split(":").at(-1)?.trim() ?? "";
}

/** The journey's state label for the step, read off its hover card. */
async function journeyState(page: Page): Promise<string> {
  await page.goto("/de/journey", { waitUntil: "networkidle" });
  const node = page.locator(`a[href$="/${CODE}"]`).first();
  await node.scrollIntoViewIfNeeded();
  await node.hover();
  const card = page.getByText(/^Schritt \d+ von \d+ · /);
  await expect(card).toBeVisible({ timeout: 20_000 });
  return (await card.textContent())?.split(" · ").at(-1)?.trim() ?? "";
}

test.describe("walk and journey link", () => {
  test.describe.configure({ mode: "serial" });
  let tenant: Tenant;
  let undos: readonly Undo[] = [];

  test.beforeAll(async () => {
    tenant = await e2eTenant();
    undos = [
      await keepSignOffs(tenant),
      await payFor(tenant),
      await fillWalkItem(tenant, CODE),
      async () => setJourneyMode("team"),
    ];
    await setJourneyMode("solo");
  });

  test.afterAll(() => undoAll(undos));

  test("a step filled in through the walk waits for sign-off in both", async ({
    page,
  }) => {
    expect(await walkState(page)).toBe("Wartet auf Freigabe");
    expect(await journeyState(page)).toBe("Wartet auf Freigabe");
  });

  test("signed off on its requirement page, it shows signed in both", async ({
    page,
  }) => {
    await signOffViaUi(page, CODE);
    await expect
      .poll(async () => (await requirementStatus(tenant, CODE))?.status)
      .toBe("completed");
    expect(await walkState(page)).toBe("Freigegeben");
    expect(await journeyState(page)).toBe("Freigegeben");
  });

  test("withdrawn on its requirement page, the walk opens it again", async ({ page }) => {
    await gotoRequirement(page, CODE);
    await page.getByTestId("reopen-button").click();
    await page.getByTestId("reopen-confirm").click();
    await expect
      .poll(async () => (await requirementStatus(tenant, CODE))?.status)
      .not.toBe("completed");
    expect(["Offen", "Als Nächstes"]).toContain(await walkState(page));
  });
});
