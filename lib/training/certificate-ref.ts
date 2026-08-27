import { createHash } from "node:crypto";

/** Crockford base32 minus the ambiguous glyphs, so a reference read off a
 *  printed sheet can be typed back without I/1 or O/0 confusion. */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const GROUPS = 3;
const GROUP_LEN = 4;

/**
 * Stable reference printed on a training certificate. Derived from the facts
 * that produced the document, so re-downloading the same completion yields the
 * same number and a recipient, an auditor and support can all name the same
 * sheet. One-way: the digest carries no recoverable user id.
 */
export function certificateRef(input: {
  userId: string;
  courseId: string;
  completionDate: string;
}): string {
  const digest = createHash("sha256")
    .update(`${input.userId}:${input.courseId}:${input.completionDate}`)
    .digest();

  const chars = Array.from({ length: GROUPS * GROUP_LEN }, (_, i) =>
    ALPHABET[digest[i] % ALPHABET.length],
  );

  return Array.from({ length: GROUPS }, (_, g) =>
    chars.slice(g * GROUP_LEN, (g + 1) * GROUP_LEN).join(""),
  ).join("-");
}
