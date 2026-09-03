/**
 * L2 evidence round-trip: the real upload pipeline end to end — presigned
 * MinIO PUT (with the SSE header the client always sends), client-side
 * SHA-256, confirmUpload, listing, download link, delete.
 *
 * Target: requirement 10.4 (access reviews, evidenceType "proof"), a page
 * with no custom editor so the evidence section always renders.
 */
import { createHash } from "node:crypto";
import { test, expect } from "@playwright/test";
import { gotoRequirement } from "../lib/journey";
import { e2eQuery } from "../lib/db";

const CODE = "10.4";
const FILE_NAME = "pruefprotokoll-zugriffsreview-2026-q2.pdf";
const BODY = Buffer.from("%PDF-1.4\n% e2e evidence fixture\n");
const SHA256 = createHash("sha256").update(BODY).digest("hex");

test("evidence: upload, list, download link, delete round-trip", async ({ page }) => {
  await gotoRequirement(page, CODE);

  const input = page.getByTestId("evidence-file-input");
  await expect(input).toBeVisible({ timeout: 20_000 });

  await input.setInputFiles({
    name: FILE_NAME,
    mimeType: "application/pdf",
    buffer: BODY,
  });

  // Presign -> S3 PUT -> SHA-256 -> confirm -> list refetch.
  const row = page.getByText(FILE_NAME, { exact: false }).first();
  await expect(row).toBeVisible({ timeout: 30_000 });

  // The row rendering proves confirmUpload wrote a database row. It does not
  // prove the bytes reached object storage, and that is the half that breaks
  // on a self-hosted instance: a wrong endpoint, region or path-style setting
  // presigns happily and stores nothing. The old assertion here matched
  // `a[target="_blank"]`, of which this page renders four before any upload
  // (two legal citations, the course link, the help link), so it passed
  // whether or not an evidence link existed at all.
  const download = page.getByTestId("evidence-download").first();
  await expect(download).toBeVisible();
  const href = await download.getAttribute("href");
  expect(href, "presigned download href").toBeTruthy();

  // Self-host contract: the browser may only PUT to an origin that CSP
  // connect-src names, and the origin the app presigns to comes from the same
  // env. When they diverged, evidence upload was dead on every self-hosted
  // instance while every local run stayed green, because next.config.ts bakes
  // this header at build time (proxy.ts re-sets it per request). Comparing the
  // two is config-independent: it holds for MinIO, for AWS, and for whatever a
  // self-hoster points AWS_S3_ENDPOINT at.
  const csp = (await page.request.get(page.url())).headers()["content-security-policy"] ?? "";
  const connectSrc = csp.split(";").find((d) => d.trim().startsWith("connect-src")) ?? "";
  expect(connectSrc, "connect-src must name the origin evidence is presigned to").toContain(
    new URL(href ?? "").origin,
  );

  const fetched = await page.request.get(href ?? "");
  expect(fetched.status(), "presigned GET of the stored object").toBe(200);
  const bytes = await fetched.body();
  expect(bytes.length, "stored object size").toBe(BODY.length);
  expect(createHash("sha256").update(bytes).digest("hex"), "stored bytes").toBe(SHA256);

  // And the row the app wrote describes those same bytes.
  const [stored] = await e2eQuery<{ file_size: number; content_hash: string | null }>(
    `SELECT file_size, content_hash FROM evidence WHERE file_name = $1`,
    [FILE_NAME],
  );
  expect(stored.file_size, "evidence.file_size").toBe(BODY.length);
  expect(stored.content_hash, "evidence.content_hash").toBe(SHA256);

  await page.getByTestId("evidence-delete").first().click();
  await expect(page.getByText(FILE_NAME, { exact: false })).toHaveCount(0, {
    timeout: 15_000,
  });

  // Delete calls deleteObject before dropping the row, so "deleted" has to
  // mean the bytes are gone too, not just hidden from the list. An orphaned
  // object in the bucket is an erasure problem, and the UI cannot show one.
  const left = await e2eQuery<{ n: string }>(
    `SELECT count(*)::text AS n FROM evidence WHERE file_name = $1`,
    [FILE_NAME],
  );
  expect(left[0].n, "evidence rows after delete").toBe("0");
  expect((await page.request.get(href ?? "")).status(), "object after delete").not.toBe(200);
});
