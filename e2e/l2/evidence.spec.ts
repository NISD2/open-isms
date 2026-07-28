/**
 * L2 evidence round-trip: the real upload pipeline end to end — presigned
 * MinIO PUT (with the SSE header the client always sends), client-side
 * SHA-256, confirmUpload, listing, download link, delete.
 *
 * Target: requirement 10.4 (access reviews, evidenceType "proof"), a page
 * with no custom editor so the evidence section always renders.
 */
import { test, expect } from "@playwright/test";
import { nis2Categories } from "@nisd2/grc-data-model/frameworks";
import { REQUIREMENT_FIELD_MAP } from "@/lib/compliance/requirement-fields";

const CODE = "10.4";
const FILE_NAME = "pruefprotokoll-zugriffsreview-2026-q2.pdf";

const slug = nis2Categories.find(
  (c) => c.code === REQUIREMENT_FIELD_MAP[CODE].categoryCode,
)?.slug;

test("evidence: upload, list, download link, delete round-trip", async ({ page }) => {
  test.skip(!slug, "category slug not resolvable");
  await page.goto(`/de/compliance/${slug}/${CODE}`);

  const input = page.getByTestId("evidence-file-input");
  await expect(input).toBeVisible({ timeout: 20_000 });

  await input.setInputFiles({
    name: FILE_NAME,
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\n% e2e evidence fixture\n"),
  });

  // Presign -> S3 PUT -> SHA-256 -> confirm -> list refetch.
  const row = page.getByText(FILE_NAME, { exact: false }).first();
  await expect(row).toBeVisible({ timeout: 30_000 });

  // A presigned download link exists for the stored object.
  const download = page.locator('a[href*="e2e-evidence"], a[target="_blank"]').first();
  await expect(download).toBeVisible();

  await page.getByTestId("evidence-delete").first().click();
  await expect(page.getByText(FILE_NAME, { exact: false })).toHaveCount(0, {
    timeout: 15_000,
  });
});
