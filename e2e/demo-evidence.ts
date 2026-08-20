/**
 * Demo-evidence uploader: pushes one example PDF per NIS2 requirement
 * through the app's real upload pipeline (presign -> MinIO PUT -> client
 * SHA-256 -> confirmUpload) so the post-suite tenant is browsable with
 * downloadable evidence instead of empty lists.
 *
 * Not a test. Run it after a suite run, against the served state:
 *   bun run e2e:serve
 *   bun run e2e:demo-evidence
 * Re-running skips codes that already carry the demo file. Requirement
 * pages without an evidence panel are reported as "no-panel", not
 * failures.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type Page } from "playwright";
import {
  assertE2eTargets,
  E2E_BASE_URL,
  E2E_STORAGE_STATE,
  E2E_USER_EMAIL,
} from "./lib/env";
import { journeyCodes, slugByCode } from "./lib/journey";
import { signInViaForm } from "./lib/signin";

/** E2E_STORAGE_STATE is repo-root-relative (playwright.config.ts reads it
 *  too); resolve it here so the script works from any cwd. */
const storageStatePath = join(
  fileURLToPath(new URL("..", import.meta.url)),
  E2E_STORAGE_STATE,
);

/** Smallest well-formed single-page PDF (correct xref offsets, so viewers
 *  open it without repair). Text must stay ASCII without parentheses. */
function minimalPdf(text: string): Buffer {
  const header = "%PDF-1.4\n";
  const content = `BT /F1 14 Tf 72 720 Td (${text}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  const parts = objects.map((obj, i) => `${i + 1} 0 obj\n${obj}\nendobj\n`);
  const offsets = parts.map(
    (_, i) =>
      header.length + parts.slice(0, i).reduce((n, p) => n + p.length, 0),
  );
  const xrefStart = header.length + parts.join("").length;
  const xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets
    .map((o) => `${String(o).padStart(10, "0")} 00000 n \n`)
    .join("")}`;
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return Buffer.from(header + parts.join("") + xref + trailer, "latin1");
}

type Outcome = "uploaded" | "already" | "no-panel" | "failed";

async function ensureAuthenticated(page: Page): Promise<void> {
  // A JWT from a previous DB generation passes the middleware but 404s in
  // the portal (users get new UUIDs on every hermetic run) — so a visible
  // journey node, not a 200, is the ready signal.
  await page.goto("/de/journey");
  const authed = await page
    .getByTestId("journey-node-1.1")
    .waitFor({ state: "visible", timeout: 15_000 })
    .then(
      () => true,
      () => false,
    );
  if (authed) return;
  await page.context().clearCookies();
  await signInViaForm(page, E2E_USER_EMAIL);
  await page.goto("/de/journey");
  await page
    .getByTestId("journey-node-1.1")
    .waitFor({ state: "visible", timeout: 15_000 });
}

async function uploadFor(page: Page, code: string): Promise<{ code: string; outcome: Outcome; detail?: string }> {
  const slug = slugByCode.get(code);
  if (!slug) throw new Error(`no category slug for requirement ${code}`);
  const fileName = `beispielnachweis-${code}.pdf`;
  await page.goto(`/de/compliance/${slug}/${code}`, { waitUntil: "networkidle" });

  // networkidle already fired, so the panel is either rendered or this
  // surface has none; the wait only covers late hydration.
  const input = page.getByTestId("evidence-file-input");
  const hasPanel = await input
    .waitFor({ state: "visible", timeout: 5_000 })
    .then(
      () => true,
      () => false,
    );
  if (!hasPanel) return { code, outcome: "no-panel" };

  // Idempotency needs a real wait: the evidence list arrives via tRPC
  // after the panel, and an instant isVisible() would race it and
  // duplicate the file on a re-run.
  const existing = await page
    .getByText(fileName, { exact: false })
    .first()
    .waitFor({ state: "visible", timeout: 3_000 })
    .then(
      () => true,
      () => false,
    );
  if (existing) return { code, outcome: "already" };

  try {
    await input.setInputFiles({
      name: fileName,
      mimeType: "application/pdf",
      buffer: minimalPdf(`Beispielnachweis ${code} - Dev GmbH NIS2`),
    });
    // Presign -> S3 PUT -> SHA-256 -> confirm -> list refetch.
    await page
      .getByText(fileName, { exact: false })
      .first()
      .waitFor({ state: "visible", timeout: 30_000 });
    return { code, outcome: "uploaded" };
  } catch (err) {
    const detail =
      err instanceof Error ? (err.message.split("\n")[0] ?? "") : String(err);
    return { code, outcome: "failed", detail };
  }
}

assertE2eTargets();

const browser = await chromium.launch();
const context = await browser.newContext({
  baseURL: E2E_BASE_URL,
  locale: "de-DE",
  ...(existsSync(storageStatePath)
    ? { storageState: storageStatePath }
    : {}),
});
const page = await context.newPage();

await ensureAuthenticated(page);

const results: { code: string; outcome: Outcome; detail?: string }[] = [];
for (const code of journeyCodes) {
  const result = await uploadFor(page, code);
  results.push(result);
  console.log(
    `${result.code.padEnd(5)} ${result.outcome}${result.detail ? ` — ${result.detail}` : ""}`,
  );
}

await browser.close();

const count = (outcome: Outcome) =>
  results.filter((r) => r.outcome === outcome).length;
console.log(
  `\nuploaded ${count("uploaded")}, already present ${count("already")}, ` +
    `no evidence panel ${count("no-panel")}, failed ${count("failed")} ` +
    `of ${journeyCodes.length}`,
);
process.exit(count("failed") > 0 ? 1 : 0);
