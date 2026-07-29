/**
 * L2 module edit + delete: the CrudPage sweep is create-only, so the
 * onUpdate/onDelete paths (the PR #25 bug class in the edit dialog, and
 * silent-corruption on update) were untested. This drives edit and delete
 * through the real UI on two representative CrudPage modules (risks,
 * policies); the flow — row action -> SchemaForm defaultValues -> update
 * mutation / delete confirm -> refresh — is shared by all twelve.
 *
 * The row edit/delete buttons carry data-testid row-edit / row-delete
 * (one per row); the spec scopes to the row holding its unique marker.
 */
import { test, expect, type Page } from "@playwright/test";
import { fillFields } from "../lib/form-driver";
import { introspectSchema } from "@/lib/forms/schema-introspect";
import { riskInsertSchema, policyInsertSchema } from "@/schema/validators";
import { generateValue } from "../lib/value-factory";
import { e2eQuery } from "../lib/db";

const MODULES = [
  {
    route: "risks",
    table: "risk",
    schema: riskInsertSchema as unknown as Parameters<typeof introspectSchema>[0],
    titleField: "title",
    createTitle: "E2E Edit-Delete Ausgangsrisiko",
    editedTitle: "E2E Edit-Delete Risiko GEAENDERT",
  },
  {
    route: "policies",
    table: "policy",
    schema: policyInsertSchema as unknown as Parameters<typeof introspectSchema>[0],
    titleField: "title",
    createTitle: "E2E Edit-Delete Ausgangsrichtlinie",
    editedTitle: "E2E Edit-Delete Richtlinie GEAENDERT",
  },
];

async function createRecord(
  page: Page,
  mod: (typeof MODULES)[number],
): Promise<void> {
  const metas = introspectSchema(mod.schema);
  const values: Record<string, unknown> = {};
  for (const meta of metas) {
    if (meta.key.endsWith("Id")) continue; // optional FK links stay empty
    values[meta.key] =
      meta.key === mod.titleField ? mod.createTitle : generateValue(meta);
  }
  await page.goto(`/de/${mod.route}`);
  const submit = page.getByTestId("schema-form-submit");
  await expect(submit).toBeVisible({ timeout: 20_000 });
  await fillFields(page, metas, values);
  await Promise.all([
    page.waitForResponse(
      (r) => r.request().method() === "POST" && r.url().includes(".create"),
      { timeout: 20_000 },
    ),
    submit.click(),
  ]);
  await expect(page.getByText(mod.createTitle).first()).toBeVisible({ timeout: 20_000 });
}

for (const mod of MODULES) {
  test(`${mod.route}: edit an existing record, change persists`, async ({ page }) => {
    await createRecord(page, mod);

    // Open the created row's edit form via its scoped row-edit button.
    const row = page.locator("tr", { hasText: mod.createTitle }).first();
    await row.getByTestId("row-edit").click();

    // SchemaForm edit form is pre-filled; change the title and save. The
    // control may be an input or a textarea (long-maxLength strings render
    // as textareas), so match either.
    const titleField = page
      .locator(`[data-field="${mod.titleField}"] input, [data-field="${mod.titleField}"] textarea`)
      .first();
    await expect(titleField).toHaveValue(mod.createTitle, { timeout: 10_000 });
    await titleField.fill(mod.editedTitle);
    await Promise.all([
      page.waitForResponse(
        (r) => r.request().method() === "POST" && r.url().includes(".update"),
        { timeout: 20_000 },
      ),
      page.getByTestId("schema-form-submit").click(),
    ]);

    // Persisted: reload and both the UI and the DB show the new value.
    await page.reload();
    await expect(page.getByText(mod.editedTitle).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(mod.createTitle)).toHaveCount(0);
    const rows = await e2eQuery<{ title: string }>(
      `SELECT title FROM ${mod.table} WHERE title = $1`,
      [mod.editedTitle],
    );
    // >= 1, not === 1: on a reused local server (reuseExistingServer, no
    // per-run DB reset) a prior run's edited row can also be present. The
    // point is that the edit persisted; the old title being gone is asserted
    // in the UI above.
    expect(rows.length).toBeGreaterThanOrEqual(1);
  });

  test(`${mod.route}: delete a record, it is gone from UI and DB`, async ({ page }) => {
    const title = `${mod.createTitle} zum Loeschen`;
    await createRecord(page, { ...mod, createTitle: title });

    page.once("dialog", (d) => d.accept()); // CrudPage delete uses window.confirm
    const row = page.locator("tr", { hasText: title }).first();
    await Promise.all([
      page.waitForResponse(
        (r) => r.request().method() === "POST" && r.url().includes(".delete"),
        { timeout: 20_000 },
      ),
      row.getByTestId("row-delete").click(),
    ]);

    await page.reload();
    await expect(page.getByText(title)).toHaveCount(0, { timeout: 20_000 });
    const rows = await e2eQuery<{ id: string }>(
      `SELECT id FROM ${mod.table} WHERE title = $1`,
      [title],
    );
    expect(rows.length).toBe(0);
  });
}
