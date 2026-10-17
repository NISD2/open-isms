/**
 * Finds the sitemap URLs that serve another language's text, so the sitemap can leave them out.
 *
 * A page exists in every language the routes serve, but a language without its own text falls
 * back to German or English. Google sees the same text under a second URL and files it under
 * "duplicate" or "crawled, not indexed". This fetches every language of every sitemap page from
 * a running production build, compares the text with the German and English pages, and writes
 * the clear copies to lib/content/sitemap-language-copies.json.
 *
 *   bun run build && bun run start          # in another shell
 *   bun scripts/measure-language-copies.ts http://localhost:3000
 *
 * Re-run it after translating a page. A page that now has its own text drops out of the file and
 * back into the sitemap. A stale file only leaves a translated page unlisted, never the reverse.
 */
import { writeFile } from "node:fs/promises";
import { allSitemapEntries } from "../app/sitemap";

const OUTPUT = new URL("../lib/content/sitemap-language-copies.json", import.meta.url);
const MIN_SHARED = 0.5;
const MIN_SHARED_FOR_ENGLISH = 0.7;
/** Below this a page is too short to compare: the author pages are 31 words of mostly names. */
const MIN_WORDS = 100;
const CONCURRENCY = 8;

type Group = Readonly<Record<string, string>>;

const words = (text: string): ReadonlySet<string> =>
  new Set(text.toLowerCase().match(/\w{4,}/g) ?? []);

const shared = (a: string, b: string): number => {
  const left = words(a);
  const right = words(b);
  const both = [...left].filter((word) => right.has(word)).length;
  return both / Math.max(1, new Set([...left, ...right]).size);
};

async function mainText(url: string): Promise<string> {
  const response = await fetch(url, { redirect: "manual" });
  if (response.status !== 200) throw new Error(`${url} answered ${response.status}`);
  const chunks: string[] = [];
  const skipped = new Set(["script", "style", "nav", "header", "footer", "aside"]);
  let mainDepth = 0;
  let skipDepth = 0;
  await new HTMLRewriter()
    .on("main", {
      element(element) {
        mainDepth += 1;
        element.onEndTag(() => {
          mainDepth -= 1;
        });
      },
    })
    .on([...skipped].join(","), {
      element(element) {
        skipDepth += 1;
        element.onEndTag(() => {
          skipDepth -= 1;
        });
      },
    })
    .on("*", {
      text(chunk) {
        if (mainDepth > 0 && skipDepth === 0) chunks.push(chunk.text);
      },
    })
    .transform(response)
    .text();
  return chunks.join(" ").split(/\s+/).join(" ");
}

const groupsOf = (entries: Awaited<ReturnType<typeof allSitemapEntries>>): Group[] => {
  const seen = new Map<string, Group>();
  for (const entry of entries) {
    const languages = entry.alternates?.languages;
    if (!languages?.de || !languages.en) continue;
    seen.set(
      String(languages.de),
      Object.fromEntries(Object.entries(languages).map(([k, v]) => [k, String(v)])),
    );
  }
  return [...seen.values()];
};

async function inBatches<T, R>(
  items: readonly T[],
  run: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  for (let start = 0; start < items.length; start += CONCURRENCY) {
    results.push(
      ...(await Promise.all(items.slice(start, start + CONCURRENCY).map(run))),
    );
  }
  return results;
}

async function copiesIn(
  group: Group,
  origin: string,
): Promise<Array<[string, "de" | "en"]>> {
  const texts = Object.fromEntries(
    await Promise.all(
      Object.entries(group).map(
        async ([locale, url]) =>
          [locale, await mainText(`${origin}${new URL(url).pathname}`)] as const,
      ),
    ),
  );
  return Object.entries(group).flatMap(([locale, url]): Array<[string, "de" | "en"]> => {
    if (locale === "de" || texts[locale].split(" ").length < MIN_WORDS) return [];
    const ofGerman = shared(texts[locale], texts.de);
    const ofEnglish = locale === "en" ? 0 : shared(texts[locale], texts.en);
    const limit = locale === "en" ? MIN_SHARED_FOR_ENGLISH : MIN_SHARED;
    if (ofGerman >= limit) return [[new URL(url).pathname, "de"]];
    if (ofEnglish >= limit) return [[new URL(url).pathname, "en"]];
    return [];
  });
}

async function main(): Promise<number> {
  const origin = process.argv[2];
  if (!origin) {
    console.error(
      "Usage: bun scripts/measure-language-copies.ts <origin of a running production build>",
    );
    return 1;
  }
  const groups = groupsOf(await allSitemapEntries());
  const found = (await inBatches(groups, (group) => copiesIn(group, origin))).flat();
  const copies = Object.fromEntries(found.sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(
    OUTPUT,
    `${JSON.stringify({ measuredOn: new Date().toISOString().slice(0, 10), copies }, null, 2)}\n`,
  );
  console.log(
    `${groups.length} pages measured, ${found.length} language versions are copies.`,
  );
  return 0;
}

process.exit(await main());
