/**
 * L1 intake conformance: every requirement with intake fields gets its
 * focused form on /compliance/{slug}/{code} filled COMPLETELY through the
 * real UI with Stadtwerk Musterstadt values, saved, and verified after a
 * reload. A second "alt" pass re-runs every enum-bearing requirement with
 * the other end of each option list, so both option paths are exercised.
 *
 * This is the layer that would have caught the "create forms cannot
 * submit" and date-column bug classes platform-wide.
 */
import { test, expect, type Page } from "@playwright/test";
import { nis2Categories } from "@nisd2/grc-data-model/frameworks";
import {
  REQUIREMENT_FIELD_MAP,
  getFieldsForRequirement,
} from "@/lib/compliance/requirement-fields";
import { introspectSchema, type FieldMeta } from "@/lib/forms/schema-introspect";
import { generateValue, type FactoryMode } from "../lib/value-factory";
import { STADTWERK_INTAKE } from "../personas/stadtwerk-musterstadt";
import { fillFields, verifyFields } from "../lib/form-driver";
import { UI_CUSTOM_EDITORS } from "../lib/walker-classification";

const slugByCategoryCode = new Map(nis2Categories.map((c) => [c.code, c.slug]));

type Target = { code: string; slug: string; metas: FieldMeta[] };

const targets: Target[] = Object.keys(REQUIREMENT_FIELD_MAP)
  .sort()
  // Codes rendered by a custom editor never show the focused intake form,
  // even when intake fields map to them (e.g. 2.4).
  .filter((code) => !UI_CUSTOM_EDITORS.has(code))
  .map((code) => {
    const info = REQUIREMENT_FIELD_MAP[code];
    const sub = getFieldsForRequirement(code);
    const slug = slugByCategoryCode.get(info.categoryCode);
    if (!sub || !slug) return null;
    return { code, slug, metas: introspectSchema(sub.schema, []) };
  })
  .filter((t): t is Target => t !== null);

function valuesFor(target: Target, mode: FactoryMode): Record<string, unknown> {
  const persona = mode === "default" ? (STADTWERK_INTAKE[target.code] ?? {}) : {};
  const values: Record<string, unknown> = {};
  for (const meta of target.metas) {
    values[meta.key] =
      meta.key in persona ? persona[meta.key] : generateValue(meta, mode);
  }
  return values;
}

async function fillSaveVerify(
  page: Page,
  target: Target,
  values: Record<string, unknown>,
): Promise<void> {
  await page.goto(`/de/compliance/${target.slug}/${target.code}`);

  const editButton = page.getByTestId("requirement-edit");
  const saveButton = page.getByTestId("requirement-save");
  await expect(editButton.or(saveButton).first()).toBeVisible({ timeout: 20_000 });
  if (await editButton.isVisible()) await editButton.click();

  const filled = await fillFields(page, target.metas, values);
  expect(filled.length, `no fields rendered for ${target.code}`).toBeGreaterThan(0);

  await saveButton.click();
  // Save exits edit mode; the edit button reappearing is the completion signal.
  await expect(editButton).toBeVisible({ timeout: 20_000 });

  await page.reload();
  await expect(editButton.or(saveButton).first()).toBeVisible({ timeout: 20_000 });
  await verifyFields(page, target.metas, values);
}

for (const target of targets) {
  test(`intake ${target.code}: fill all fields, save, verify round-trip`, async ({ page }) => {
    await fillSaveVerify(page, target, valuesFor(target, "default"));
  });
}

for (const target of targets) {
  if (!target.metas.some((m) => m.type === "enum")) continue;
  test(`intake ${target.code}: alt option variant round-trips`, async ({ page }) => {
    await fillSaveVerify(page, target, valuesFor(target, "alt"));
  });
}
