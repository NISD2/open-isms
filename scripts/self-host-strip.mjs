/**
 * Leaves nisd2.eu's own pages out of the self-hosted image (lib/edition). The Dockerfile runs it
 * before `next build` when the image is built with EDITION=self-host: it deletes every entry of
 * lib/edition/nisd2-only.json, the list the proxy's redirects read too.
 *
 * Plain Node with no dependencies: the builder stage runs Node, and nothing is installed for it.
 */
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const LIST = "lib/edition/nisd2-only.json";
/** An install of the compliance app has nothing for a search engine. */
const ROBOTS = "User-agent: *\nDisallow: /\n";

/** @param {string} root @returns {{ remove: string[], missing: string[] }} */
export function planStrip(root) {
  const list = JSON.parse(readFileSync(join(root, LIST), "utf8"));
  /** @type {string[]} */
  const remove = [...list.pages, ...list.other];
  // A missing entry means the list drifted: a page moved and would ship under its new name.
  return { remove, missing: remove.filter((path) => !existsSync(join(root, path))) };
}

/** @param {string} root @returns {number} the exit code */
function strip(root) {
  const { remove, missing } = planStrip(root);
  if (missing.length > 0) {
    console.error(`self-host-strip: ${LIST} names what the tree does not have:`, missing);
    return 1;
  }
  for (const path of remove) rmSync(join(root, path), { recursive: true, force: true });
  writeFileSync(join(root, "public/robots.txt"), ROBOTS);
  console.log(
    `self-host-strip: removed ${remove.length} paths for the self-hosted image`,
  );
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url))
  process.exit(strip(process.cwd()));
