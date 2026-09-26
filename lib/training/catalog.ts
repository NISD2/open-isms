/**
 * The courses on offer, in the order every overview shows them. One list for the logged-in
 * portal overview (/training/courses) and the public one (/training), so a new course appears in
 * both or neither.
 */
export const COURSES = [
  { id: "nis2-ceo", badge: "NIS 2", landing: "/training/nis2-ceo" },
  { id: "nis2-tabletop", badge: "NIS 2", landing: "/training/nis2-tabletop" },
  { id: "cra-sbom", badge: "CRA", landing: "/training/cra-sbom" },
] as const;

export type CourseId = (typeof COURSES)[number]["id"];

/** Below this a participant count reads as "nobody takes this", so it is left out. */
export const MIN_PARTICIPANTS_SHOWN = 10;
