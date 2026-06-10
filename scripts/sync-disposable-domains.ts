#!/usr/bin/env bun
/**
 * Sync the disposable-email blocklist from the canonical upstream repo.
 *
 *   bun run scripts/sync-disposable-domains.ts
 *
 * Source: https://github.com/disposable-email-domains/disposable-email-domains
 * License: CC0 1.0 (public domain) — safe to vendor with no attribution.
 *
 * Run weekly (manual or via cron) to keep the list current. The list at
 * lib/auth/disposable-domains.txt is loaded once at module init by
 * lib/auth/disposable.ts.
 */
import { writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";

const SOURCE_URL =
  "https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/main/disposable_email_blocklist.conf";
const DEST = join(process.cwd(), "lib/auth/disposable-domains.txt");

async function main() {
  console.log(`Fetching ${SOURCE_URL}`);
  const res = await fetch(SOURCE_URL);
  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  }
  const body = await res.text();

  const lines = body
    .split("\n")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);

  if (lines.length < 1000) {
    throw new Error(
      `Suspiciously short list (${lines.length} domains) — refusing to overwrite`,
    );
  }

  let previousCount = 0;
  try {
    previousCount = readFileSync(DEST, "utf8")
      .split("\n")
      .filter((l) => l.trim()).length;
  } catch {
    // First run; no previous file.
  }

  writeFileSync(DEST, lines.join("\n") + "\n", "utf8");
  console.log(
    `Wrote ${lines.length} domains to ${DEST} (was ${previousCount}, delta ${lines.length - previousCount})`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
