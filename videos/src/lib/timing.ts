export const FPS = 30;

// Transition duration between scenes (in frames)
export const TRANSITION_FRAMES = 15;

// ─── 60-Second Master ───
// Total target: 1800 frames (60s at 30fps)
// 5 transitions × 15 frames = 75 frames overlap
// Scene durations must sum to 1875
export const SCENE_60 = {
  hook: 165, // 0–5.5s
  deadline: 165, // ~5–10.5s
  problem: 315, // ~10–20.5s
  product: 675, // ~20–42.5s
  proof: 255, // ~42–50.5s
  cta: 300, // ~50–60s
} as const;

// ─── 30-Second Cut ───
// Total target: 900 frames (30s)
// 4 transitions × 15 = 60 frames overlap
// Scene durations must sum to 960
export const SCENE_30 = {
  hook: 100, // 0–3.3s
  urgency: 100, // ~3–6.5s
  problem: 130, // ~6–10.5s
  product: 370, // ~10–22.5s
  cta: 260, // ~22–30s
} as const;

// ─── 15-Second Cut ───
// Total target: 450 frames (15s)
// 2 transitions × 15 = 30 frames overlap
// Scene durations must sum to 480
export const SCENE_15 = {
  hook: 100, // 0–3.3s
  product: 220, // ~3–10.5s
  cta: 160, // ~10–15s
} as const;

// Music beat markers (adjust these after dropping in your track)
// Frame numbers for key musical moments in the 60s version
export const BEATS = {
  firstDrop: 15, // Hook "€10,000,000" lands
  tensionBuild: 150, // Deadline scene builds
  tensionPeak: 300, // Problem scene peak
  shift: 600, // Musical shift → product reveal
  resolution: 1500, // CTA begins resolving
} as const;

// Aspect ratio dimensions
export const DIMENSIONS = {
  "16x9": { width: 1920, height: 1080 },
  "1x1": { width: 1080, height: 1080 },
  "9x16": { width: 1080, height: 1920 },
} as const;

export type AspectRatio = keyof typeof DIMENSIONS;
