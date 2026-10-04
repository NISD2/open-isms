import "@/lib/server-guard";
import { readdirSync } from "node:fs";
import path from "node:path";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import type { WalkStep } from "@/components/durchgang/view";
import {
  type AnyItem,
  itemKey,
  type ResolvedItem,
  resolveItem,
  WALK,
} from "@/lib/durchgang";

/** The step art on disk, read once per server process rather than on every render. */
const ART: ReadonlySet<string> = (() => {
  try {
    return new Set(
      readdirSync(path.join(process.cwd(), "public", "images", "durchgang"))
        .filter((f) => f.endsWith(".svg"))
        .map((f) => f.slice(0, -4)),
    );
  } catch {
    return new Set();
  }
})();

export const imageFor = (code: string): string | null =>
  ART.has(itemKey(code)) ? `/images/durchgang/${itemKey(code)}.svg` : null;

/** The parsed words of an item. The script's tests guarantee this never fails for a shipped item. */
export async function wordsOf(item: AnyItem): Promise<ResolvedItem> {
  const messages = await getMessages();
  const resolved = resolveItem(messages.durchgang, item);
  if (!resolved.ok) {
    throw new Error(`Durchgang ${item.code}: ${resolved.errors.join("; ")}`);
  }
  return resolved.value;
}

/**
 * An item as its card shows it: its area, the walk's own headline and teaser, and its art. The
 * area is named in `locale`, the page's language unless a caller says otherwise.
 */
export async function stepOf(item: AnyItem, locale?: string): Promise<WalkStep> {
  const [words, tc] = await Promise.all([
    wordsOf(item),
    locale
      ? getTranslations({ locale, namespace: "compliance" })
      : getTranslations("compliance"),
  ]);
  return {
    code: item.code,
    section: tc(`categories.${item.category}.name`),
    headline: words.headline,
    teaser: words.teaser,
    image: imageFor(item.code),
  };
}

/**
 * These items as their cards show them, in the order given, for pages outside the walk (the
 * wiki). It reads only the walk's copy and art, never a company or the database. The walk is
 * written in German and English, so a page in any other language gets its cards in English,
 * area included, rather than half translated. A code that is not a step of the walk throws; wiki
 * pages render on request, so components/wiki/WalkSteps.test.ts checks every code the wiki uses.
 */
export async function stepsOf(codes: readonly string[]): Promise<readonly WalkStep[]> {
  const walkLocale = walkLanguage(await getLocale());
  return Promise.all(
    codes.map((code) => {
      const item = WALK.find((i) => i.code === code);
      if (!item) throw new Error(`${code} is not a step of the walk`);
      return stepOf(item, walkLocale);
    }),
  );
}

/** The language the walk shows itself in: German, else English. */
export const walkLanguage = (locale: string): "de" | "en" =>
  locale === "de" ? "de" : "en";
