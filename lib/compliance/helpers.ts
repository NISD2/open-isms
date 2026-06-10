/**
 * Compliance navigation helpers
 */

/** Map evidence type to the action type the user needs to take */
export function getRequirementActionType(
  evidenceType: string,
): "form" | "upload" | "signoff" | "technical" {
  if (evidenceType === "sign-off") return "signoff";
  if (evidenceType === "technical") return "technical";
  if (evidenceType === "document" || evidenceType === "proof") return "upload";
  if (evidenceType === "training") return "signoff";
  return "signoff";
}

/**
 * Get next category slug, optionally filtered to a set of visible slugs.
 * `categorySlugs` is the ordered list of slugs for the current framework.
 */
export function getNextCategory(
  currentSlug: string,
  categorySlugs: string[],
  visibleSlugs?: Set<string>,
): string | null {
  const idx = categorySlugs.indexOf(currentSlug);
  if (idx === -1) return null;
  for (let i = idx + 1; i < categorySlugs.length; i++) {
    const slug = categorySlugs[i];
    if (!visibleSlugs || visibleSlugs.has(slug)) return slug;
  }
  return null;
}

export function getPrevCategory(
  currentSlug: string,
  categorySlugs: string[],
  visibleSlugs?: Set<string>,
): string | null {
  const idx = categorySlugs.indexOf(currentSlug);
  if (idx <= 0) return null;
  for (let i = idx - 1; i >= 0; i--) {
    const slug = categorySlugs[i];
    if (!visibleSlugs || visibleSlugs.has(slug)) return slug;
  }
  return null;
}
