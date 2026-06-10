import "@/lib/server-guard";

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import { rehypeDictionary } from "./rehype-dictionary";
import type { DictionaryTerm } from "./schemas";

/**
 * Render a lesson's markdown content to HTML with dictionary term annotations.
 *
 * @param markdown  - The raw markdown string (with [[term]] markers)
 * @param dictionary - The full course dictionary
 * @param locale    - The current locale (for picking the right definition)
 * @returns HTML string with <span class="term" data-definition="..."> elements
 */
export async function renderLesson(
  markdown: string,
  dictionary: DictionaryTerm[],
  locale: string,
): Promise<{ html: string; termsUsed: DictionaryTerm[] }> {
  // Build a Map for O(1) lookup — keyed by lowercase term
  const termsMap = new Map<string, { definition: string; type: string }>();
  for (const entry of dictionary) {
    const def = entry.definition[locale] ?? entry.definition.en;
    termsMap.set(entry.term.toLowerCase(), { definition: def, type: entry.type });
  }

  const result = await unified()
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeDictionary, { terms: termsMap })
    .use(rehypeStringify)
    .process(markdown);

  // Find which terms were actually used in this lesson's content
  // Matches both [[term]] and [[term|translation]] formats
  const termsUsed = dictionary.filter((t) => {
    const exact = `[[${t.term}]]`;
    const withPipe = `[[${t.term}|`;
    const lower = markdown.toLowerCase();
    return lower.includes(exact.toLowerCase()) || lower.includes(withPipe.toLowerCase());
  });

  return { html: String(result), termsUsed };
}
