import "@/lib/server-guard";
import type { Gloss } from "@/components/durchgang/view";
import { glossText } from "@/lib/dictionary/matcher";

/**
 * The dictionary terms the walk explains in place, and only these: each definition was checked
 * against what the walk says (fact-check round 17). The rest of the dictionary was written for
 * the courses and the wiki, and some of it reads wrong here: "policy" as an insurance contract,
 * "Anhang" as the directive's sector list, the management body with the supervisory board, a
 * significant incident defined by thresholds that bind only the CIR's digital providers.
 */
export const WALK_TERMS: ReadonlySet<string> = new Set([
  "bsig",
  "business-continuity",
  "cryptography",
  "csirt",
  "directive",
  "early-warning",
  "isms",
  "mandatory-incident-reporting",
  "personal-data",
  "physical-environment",
  "registration",
  "regulation",
  "risk-analysis",
  "risk-assessment",
  "risk-register",
  "supplier",
  "supply-chain",
  "vulnerability",
]);

/** A text with only the walk's terms explained, or null when it has none of them. */
export function glossOf(text: string, locale: "de" | "en"): readonly Gloss[] | null {
  const chunks = glossText(text, locale).map(
    (c): Gloss =>
      c.kind === "term" && WALK_TERMS.has(c.slug)
        ? { term: c.value, definition: c.definition }
        : { text: c.value },
  );
  if (!chunks.some((c) => "term" in c)) return null;
  // A term left unexplained is plain text again, so it joins the text around it.
  const merged: Gloss[] = [];
  for (const c of chunks) {
    const last = merged.at(-1);
    if ("text" in c && last && "text" in last) {
      merged[merged.length - 1] = { text: last.text + c.text };
    } else {
      merged.push(c);
    }
  }
  return merged;
}

/** The glossed form of every text that has a term, keyed by the text. */
export const glossary = (
  texts: readonly string[],
  locale: "de" | "en",
): Readonly<Record<string, readonly Gloss[]>> =>
  Object.fromEntries(
    texts.flatMap((text) => {
      const glossed = glossOf(text, locale);
      return glossed ? [[text, glossed] as const] : [];
    }),
  );
