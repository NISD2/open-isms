import craDict from "@/courses/cra-sbom/dictionary";
import ceoDict from "@/courses/nis2-ceo/dictionary";
import tabletopDict from "@/courses/nis2-tabletop/dictionary";
import type { DictionaryTerm } from "@/lib/training/schemas";
import wikiDict from "./wiki-terms";

export type CourseDictionaryId = "nis2-ceo" | "nis2-tabletop" | "cra-sbom";
export type DictionarySourceId = CourseDictionaryId | "wiki";

/** The dictionaries that belong to a course, so their terms have lessons to quote. */
export const COURSE_DICTIONARIES = [
  { id: "nis2-ceo", terms: ceoDict },
  { id: "nis2-tabletop", terms: tabletopDict },
  { id: "cra-sbom", terms: craDict },
] as const satisfies readonly {
  id: CourseDictionaryId;
  terms: readonly DictionaryTerm[];
}[];

/**
 * Every dictionary the wiki draws on, in priority order: the first source to
 * define a term wins. The CEO set goes first because it is the most
 * authoritative NIS 2 one. The hover glosser and the public glossary both read
 * this list, so they cannot disagree about which terms exist.
 */
export const DICTIONARY_SOURCES = [
  ...COURSE_DICTIONARIES,
  { id: "wiki", terms: wikiDict },
] as const satisfies readonly {
  id: DictionarySourceId;
  terms: readonly DictionaryTerm[];
}[];
