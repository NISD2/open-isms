/**
 * Deterministic per-user shuffle for quiz options.
 *
 * Same (userId, lessonId, questionId) tuple always produces the same permutation,
 * so a user revisiting a quiz sees stable answer positions, and the server can
 * re-derive the permutation when grading without storing it.
 */

function fnv1a(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Returns a permutation array of length `n` where `permutation[i]` is the
 * original index that should appear at shuffled position `i`.
 *
 * Example: shuffleIndices(4, "...") → [2, 0, 3, 1] means
 *   shuffled[0] = original[2], shuffled[1] = original[0], etc.
 */
export function shuffleIndices(n: number, seedStr: string): number[] {
  const rng = mulberry32(fnv1a(seedStr));
  const indices = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}

export function quizSeed(userId: string, lessonId: string, questionId: string): string {
  return `${userId}:${lessonId}:${questionId}`;
}
