import "@/lib/server-guard";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Two-file design:
//  - disposable-domains.txt is the upstream CC0 list (refreshed weekly via
//    scripts/sync-disposable-domains.ts, fully replaced on each sync).
//  - disposable-domains-local.txt is OUR additions for misses we spot in
//    production (e.g. googxs.com). The sync script never touches it.
const domains = new Set(
  [
    "lib/auth/disposable-domains.txt",
    "lib/auth/disposable-domains-local.txt",
  ].flatMap((rel) =>
    readFileSync(join(process.cwd(), rel), "utf8")
      .split("\n")
      .map((d) => d.trim().toLowerCase())
      .filter((d) => d && !d.startsWith("#")),
  ),
);

export function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return domain ? domains.has(domain) : false;
}
