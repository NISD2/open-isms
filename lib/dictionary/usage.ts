import "@/lib/server-guard";

import type { Root, RootContent } from "mdast";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import type { Locale } from "@/lib/seo";
import { loadCourse, loadLesson, loadLessonContent } from "@/lib/training/course-loader";
import { splitMarker, WIKI_LINK_RE } from "@/lib/training/rehype-dictionary";
import { pickLocale } from "./index";
import { COURSE_DICTIONARIES, type CourseDictionaryId } from "./sources";

/** One lesson that uses a term, with the sentence where it first appears there. */
export interface TermUse {
  courseId: CourseDictionaryId;
  courseTitle: string;
  lessonId: string;
  lessonTitle: string;
  sentence: string;
  /** How often the lesson marks the term: the most is where it is taught. */
  mentions: number;
}

const markdownParser = unified().use(remarkParse).use(remarkGfm);

const textOf = (node: Root | RootContent): string =>
  "value" in node
    ? node.value
    : "children" in node
      ? node.children.map(textOf).join("")
      : "";

/** Running prose only: headings, code blocks and the like never carry a marker worth quoting. */
const proseBlocks = (node: Root | RootContent): string[] =>
  node.type === "paragraph" || node.type === "tableCell"
    ? [textOf(node)]
    : "children" in node
      ? node.children.flatMap(proseBlocks)
      : [];

/**
 * The sentence that carries each marker in one block of prose. Markers are
 * swapped for the words the lesson shows, so the quote reads as the learner saw it.
 */
function sentencesIn(
  block: string,
  segmenter: Intl.Segmenter,
): readonly { lookup: string; sentence: string }[] {
  const marks: { lookup: string; at: number }[] = [];
  let plain = "";
  let cursor = 0;
  for (const match of block.matchAll(WIKI_LINK_RE)) {
    const start = match.index ?? 0;
    const { lookup, display } = splitMarker(match[1] ?? "");
    plain += block.slice(cursor, start);
    marks.push({ lookup: lookup.toLowerCase(), at: plain.length });
    plain += display;
    cursor = start + match[0].length;
  }
  plain += block.slice(cursor);

  const sentences = [...segmenter.segment(plain)];
  return marks.flatMap(({ lookup, at }) => {
    const hit = sentences.find(
      ({ index, segment }) => at >= index && at < index + segment.length,
    );
    return hit ? [{ lookup, sentence: hit.segment.trim() }] : [];
  });
}

async function usesInCourse(
  courseId: CourseDictionaryId,
  locale: Locale,
  segmenter: Intl.Segmenter,
): Promise<readonly (readonly [string, TermUse])[]> {
  const course = await loadCourse(courseId);
  const courseTitle = pickLocale(course.title, locale);
  const lessonIds = course.modules.flatMap((module) => module.lessonIds);
  const perLesson = await Promise.all(
    lessonIds.map(async (lessonId) => {
      const [lesson, markdown] = await Promise.all([
        loadLesson(courseId, lessonId),
        loadLessonContent(courseId, lessonId, locale),
      ]);
      const lessonTitle = pickLocale(lesson.title, locale);
      const marked = proseBlocks(markdownParser.parse(markdown)).flatMap((block) =>
        sentencesIn(block, segmenter),
      );
      const byTerm = Map.groupBy(marked, ({ lookup }) => lookup);
      return [...byTerm].map(
        ([lookup, hits]) =>
          [
            lookup,
            {
              courseId,
              courseTitle,
              lessonId,
              lessonTitle,
              sentence: hits[0]?.sentence ?? "",
              mentions: hits.length,
            },
          ] as const,
      );
    }),
  );
  return perLesson.flat();
}

const isCourseIntro = (use: TermUse): boolean => use.lessonId.startsWith("0.");

/**
 * The lesson to quote: the one that marks the term most often, then any lesson
 * over a course intro (which only names what is coming), then the earliest.
 * Lessons mark a term on its first use, so most ties are decided by the intro rule.
 */
export const taughtIn = (uses: readonly TermUse[]): TermUse | undefined =>
  [...uses].sort(
    (a, b) =>
      b.mentions - a.mentions || Number(isCourseIntro(a)) - Number(isCourseIntro(b)),
  )[0];

const cache = new Map<Locale, Promise<ReadonlyMap<string, readonly TermUse[]>>>();

/**
 * Every lesson that marks a term, by lowercase dictionary term, in course and
 * lesson order. Read from the lesson files themselves, so the glossary cannot
 * claim a lesson teaches something it does not.
 */
export function getTermUses(
  locale: Locale,
): Promise<ReadonlyMap<string, readonly TermUse[]>> {
  const cached = cache.get(locale);
  if (cached) return cached;

  const segmenter = new Intl.Segmenter(locale, { granularity: "sentence" });
  const built = Promise.all(
    COURSE_DICTIONARIES.map(({ id }) => usesInCourse(id, locale, segmenter)),
  ).then((perCourse) => {
    const uses = new Map<string, readonly TermUse[]>();
    for (const [lookup, use] of perCourse.flat()) {
      uses.set(lookup, [...(uses.get(lookup) ?? []), use]);
    }
    return uses;
  });
  // A failed read must not stick: the next request tries again.
  built.catch(() => cache.delete(locale));
  cache.set(locale, built);
  return built;
}
