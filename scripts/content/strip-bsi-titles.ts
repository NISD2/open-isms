/**
 * Strip BSI requirement titles out of the vendored Kompendium data before it enters this repo.
 *
 * Identifiers, grades and numbering are facts about a published document and are not protectable
 * as such. The requirement TITLES are the BSI's text. The Kompendium download page grants no
 * explicit licence for reuse, and at least one vendor integrated the Kompendium into a product
 * under a signed agreement with the BSI. This repository is public and AGPL, so until those terms
 * are read and recorded in LICENSE-DATA.md the titles do not ship: the interface links to the
 * Baustein instead, which is what the BSI publishes it for.
 *
 * Reversing this is one flag, not a re-extraction, which is the point: the extractor keeps the
 * titles in the cache outside the repo, and this decides what crosses the boundary.
 *
 *   bun scripts/content/strip-bsi-titles.ts <in.json> <out.json>
 */
import { readFileSync, writeFileSync } from "node:fs";

/** Set only once the BSI's terms permit redistribution, and record where they say so. */
const TITLES_LICENSED = false;

type Baustein = {
  readonly grades?: Record<string, readonly string[]>;
  readonly titles?: Record<string, string>;
  readonly title?: string;
  readonly [k: string]: unknown;
};

const main = (): number => {
  const [, , inPath, outPath] = process.argv;
  if (!inPath || !outPath) {
    console.error("usage: strip-bsi-titles.ts <in.json> <out.json>");
    return 2;
  }
  const raw: unknown = JSON.parse(readFileSync(inPath, "utf-8"));
  if (typeof raw !== "object" || raw === null) {
    console.error("input is not an object");
    return 1;
  }
  const root = raw as Record<string, unknown>;
  const bausteine = root.bausteine;
  if (typeof bausteine !== "object" || bausteine === null) {
    console.error("input has no bausteine");
    return 1;
  }

  const stripped = Object.fromEntries(
    Object.entries(bausteine as Record<string, Baustein>).map(([id, b]) => {
      const { titles: _titles, title: _title, ...rest } = b;
      return [id, TITLES_LICENSED ? b : rest];
    }),
  );

  const out = {
    ...root,
    titlesIncluded: TITLES_LICENSED,
    titlesNote: TITLES_LICENSED
      ? "Titles included under the recorded BSI licence; see LICENSE-DATA.md."
      : "Requirement titles are withheld: identifiers and grades are facts, the titles are BSI text and the Kompendium grants no explicit reuse licence. The interface links to the Baustein.",
    bausteine: stripped,
  };
  writeFileSync(outPath, `${JSON.stringify(out, null, 1)}\n`, "utf-8");

  const count = Object.values(stripped).filter(
    (b) => "titles" in (b as object) || "title" in (b as object),
  ).length;
  console.log(
    `[strip-bsi-titles] ${Object.keys(stripped).length} Bausteine written to ${outPath}; ` +
      `titles ${TITLES_LICENSED ? "INCLUDED" : "withheld"}, ${count} entries still carry a title field`,
  );
  return 0;
};

process.exit(main());
