/**
 * Generic form driver. Fills and verifies any surface whose fields carry
 * `data-field={key}` (SchemaForm and the requirement detail page), by
 * detecting the rendered control inside each field wrapper — so field
 * overrides that swap components stay transparent to the tests.
 *
 * Fields whose wrapper is absent from the page (omitted or hidden) are
 * skipped: the driver tests what the user can actually see.
 */
import { expect, type Page } from "@playwright/test";
import type { FieldMeta } from "@/lib/forms/schema-introspect";

/** Lower-case, alphanumeric only — matches enum values to their humanized
 *  option labels ("3_levels" vs "3 levels") and survives label overrides
 *  that embellish the value text. */
function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isoDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

export async function fillFields(
  page: Page,
  metas: FieldMeta[],
  values: Record<string, unknown>,
): Promise<string[]> {
  const filled: string[] = [];
  for (const meta of metas) {
    const value = values[meta.key];
    if (value === undefined || value === null) continue;
    const root = page.locator(`[data-field="${meta.key}"]`);
    if ((await root.count()) === 0) continue;

    const select = root.locator('button[role="combobox"]');
    const checkbox = root.locator('button[role="checkbox"]');
    const file = root.locator('input[type="file"]');
    const date = root.locator('input[type="date"]');
    const textarea = root.locator("textarea");

    if ((await select.count()) > 0) {
      await select.click();
      const options = page.locator('[role="option"]');
      await expect(options.first()).toBeVisible();
      const want = normalize(String(value));
      const texts = await options.allTextContents();
      const idx = texts.findIndex(
        (t) => normalize(t) === want || normalize(t).includes(want) || want.includes(normalize(t)),
      );
      if (idx === -1) {
        throw new Error(
          `field "${meta.key}": no option matching "${value}" among [${texts.join(", ")}]`,
        );
      }
      await options.nth(idx).click();
    } else if ((await checkbox.count()) > 0) {
      const current = (await checkbox.getAttribute("aria-checked")) === "true";
      if (current !== Boolean(value)) await checkbox.click();
    } else if ((await file.count()) > 0) {
      await file.setInputFiles({
        name: String(value),
        mimeType: "application/pdf",
        buffer: Buffer.from("%PDF-1.4 e2e fixture"),
      });
    } else if ((await date.count()) > 0) {
      await date.fill(isoDate(value));
    } else if ((await textarea.count()) > 0) {
      await textarea.fill(String(value));
    } else {
      await root.locator("input").first().fill(String(value));
    }
    filled.push(meta.key);
  }
  return filled;
}

export async function verifyFields(
  page: Page,
  metas: FieldMeta[],
  values: Record<string, unknown>,
): Promise<void> {
  for (const meta of metas) {
    const value = values[meta.key];
    if (value === undefined || value === null) continue;
    const root = page.locator(`[data-field="${meta.key}"]`);
    if ((await root.count()) === 0) continue;

    const select = root.locator('button[role="combobox"]');
    const checkbox = root.locator('button[role="checkbox"]');
    const file = root.locator('input[type="file"]');
    const date = root.locator('input[type="date"]');
    const textarea = root.locator("textarea");

    if ((await select.count()) > 0) {
      const text = normalize((await select.textContent()) ?? "");
      const want = normalize(String(value));
      expect(
        text.includes(want) || want.includes(text),
        `field "${meta.key}": select shows "${text}", expected "${want}"`,
      ).toBe(true);
    } else if ((await checkbox.count()) > 0) {
      await expect(checkbox).toHaveAttribute("aria-checked", String(Boolean(value)));
    } else if ((await file.count()) > 0) {
      // Edit-mode file input holds no readable value; the disabled view
      // renders the stored filename as a text input, handled below.
      continue;
    } else if ((await date.count()) > 0) {
      await expect(date).toHaveValue(isoDate(value));
    } else if ((await textarea.count()) > 0) {
      await expect(textarea).toHaveValue(String(value));
    } else {
      await expect(root.locator("input").first()).toHaveValue(String(value));
    }
  }
}
