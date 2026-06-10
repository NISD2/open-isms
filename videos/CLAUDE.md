# CLAUDE.md — NIS2 Promotional Videos (Remotion)

## Quick Reference

```bash
bun install              # Install dependencies (bun only)
bun run dev              # Remotion Studio — preview all compositions
bun run render           # Render 60s 16:9 promo
bun run capture          # Re-capture app screenshots via Playwright
bunx tsc --noEmit        # Typecheck Remotion project — must pass zero errors

# Pipeline server (automated shorts from meeting recordings)
cd server && bun install    # First-time setup
bun run server              # Start pipeline at http://localhost:3030

# Server typecheck (separate tsconfig with bun-types)
cd server && bunx tsc --noEmit -p tsconfig.json
```

## Pipeline Server (Automated Shorts)

Internal tool: upload Google Meet recording + Gemini transcript → dual Grok pass (clip suggestions + LLM-driven edit decisions) → Whisper word-level timestamps → ffmpeg cuts → review & approve → Remotion render.

### Pipeline Flow

1. **Upload** — Optionally type context for Grok (e.g. "focus on incident reporting section"), select the Gemini `.txt` transcript, then drop the `.mp4` video. Transcript is parsed and Grok analysis starts immediately.
2. **Analyze** — All heavy processing runs automatically while you wait:
   - **Grok 1** (`grok-4-1-fast-non-reasoning`) — suggests 2–5 clips with segments, title, rationale
   - For each clip: **Whisper** → word-level timestamps → **Grok 2** (`grok-4-1-fast-reasoning`) uses the word list + clip rationale to decide exactly what to cut (fillers, dead air, false starts, context-aware) → **ffmpeg** cuts → **caption remap**
3. **Review** — Edit segment timestamps (M:SS), titles, add/remove segments, approve or reject clips. Grok's rationale stays visible on every card — useful for writing YouTube titles and descriptions later.
4. **Render** — Click "Render N Clips →". Just the Remotion step — all editing is already done. Output: `out/YYYY-MM-DD/{slug}.mp4` (versioned `slug-v2.mp4` on re-render).

Additional controls:
- **Re-analyze** — edit the context field on any job and re-run Grok. New clip suggestions are added alongside existing ones.
- **Re-edit** — on a rendered (done) clip, reset it back to suggested, adjust segments, re-approve and render again. Previous file is kept as `slug-v1.mp4`.
- **Delete job** — removes DB record and all associated files from disk. Blocked if any clip is currently rendering.

### Server File Structure

```
server/
  index.ts              # Hono server, port 3030. Serves /public/ and /out/.
  schema.ts             # Drizzle schema: jobs + clips tables
  db.ts                 # Drizzle instance → videos_pipeline DB
  .env                  # PIPELINE_DATABASE_URL, XAI_API_KEY (gitignored)
  jobs/
    queue.ts            # Serial job queue + SSE event bus
    analyze.ts          # Grok 1 clip suggestions + per-clip Whisper + Grok 2 + ffmpeg + caption remap
    transcribeClip.ts   # Per-clip Whisper on trimmed audio windows
    grokEdit.ts         # Grok 2 LLM edit pass: word list → removal intervals → ffmpeg cuts
    gapEdit.ts          # (legacy) Rule-based filler/silence removal — superseded by grokEdit
    render.ts           # Remotion render only (all editing done during analyze)
  routes/
    upload.ts           # POST /api/upload (video + transcript + optional context)
    jobs.ts             # GET/POST/DELETE /api/jobs, SSE, analyze, render endpoints
    clips.ts            # PATCH/DELETE/POST/reset /api/clips
  lib/
    parseGeminiTranscript.ts  # Parses Gemini .txt → Grok transcript string
    remapCaptions.ts          # Remaps word timestamps after gap-edit
    whisper.ts                # ensureWhisper() — shared install/model helper
  ui/index.html         # Single-page UI (no build step)
  migrations/           # SQL migrations
```

### Key Schema Details

- `clips.segments` — `jsonb` array of `{startMs, endMs}[]`
- `clips.gapEditedPath` — `public/gap-edited-{id}.mp4` (set during analyze)
- `clips.clipCaptionsPath` — `public/captions-{id}-remapped.json` (set during analyze)
- `clips.removedIntervals` — `jsonb` array of `{startMs, endMs}[]` — Grok 2 edit decisions, stored so render can calculate duration without re-running Grok
- `jobs.transcriptText` — Grok-formatted Gemini transcript with `[M:SS = Nms]` markers
- `jobs.customContext` — optional user-provided context prepended to the Grok 1 prompt

### Status Enums

**Job:** `uploading` → `analyzing` → `stage1_review` → `rendering` → `done` | `error`

**Clip:** `suggested` → `stage1_approved` → `rendering` → `done` | `error` | `rejected`

### Key Implementation Notes

- **LSP false positives**: `import.meta.dir` and `Bun.*` show LSP errors in server files. The server `tsconfig.json` has `"types": ["bun-types"]`. Run `bunx tsc --noEmit -p tsconfig.json` from `server/` to verify.
- **Gemini transcript format**: Timestamps (`00:01:05`) on their own line, speaker lines below. NOT inline format.
- **Grok 2 edit pass**: Sends word list with pause durations between words + trailing silence markers. Grok decides what to cut in context — "like" as comparison kept, "like" as verbal tic removed. Model: `grok-4-1-fast-reasoning`.
- **Caption remapping**: Structural removals (pre-segment offset + inter-segment gaps) are prepended to Grok 2's removals so caption timestamps start at 0, matching the gap-edited video's PTS.
- **Re-render versioning**: `toSlug(title)` → check if `slug.mp4` exists → increment to `slug-v2.mp4`, etc.
- **Delete guard**: `DELETE /api/jobs/:id` returns 409 if any clip has status `rendering`.
- **Render progress**: Per-frame lines throttled to 10% milestones in console and SSE.
- **Concurrency**: `--concurrency 4` on Remotion renders. Serial job queue (`enqueueTranscription`) for CPU-bound work (analyze + render both use it).
- **SSE**: `idleTimeout: 0` in Bun.serve. Guard writes with `closed` flag.

### DB Setup (one-time)

```bash
createdb videos_pipeline
cd server && bun install
bunx drizzle-kit generate && bunx drizzle-kit migrate
```

---

## Hard Rules

- **Bun only** — package manager is bun, not npm or yarn
- **Zero type errors** — `bunx tsc --noEmit` (Remotion) and `bunx tsc --noEmit -p tsconfig.json` (server)
- **Shorts captions higher** — `bottomPadding={240}` for shorts (clears TikTok/Reels/Shorts UI)
- **Source videos are gitignored** — `.mp4` in `public/` and `uploads/`, generated captions, gap-edited videos all gitignored
- **Music** — `public/music.mp3` at `volume={0.08}` in talking-head, `volume={0.7}` in promo

---

## Remotion Compositions

### Pipeline
| ID | Component | Notes |
|----|-----------|-------|
| `PipelineMultiClip` | `MultiSegmentShort` | Props: `videoSrc`, `captionsFile`, `segments[]`. Bakes in TikTok-style captions via `CaptionOverlay`. |

### Promo (animated, 16:9)
`PromoVideo-60s/30s/15s`, `AppDemo-60s/30s/15s`

### Talking-head — What is NIS2?
`WhatIsNIS2-YouTube` (16:9), `WhatIsNIS2-Short-AreYouAffected/WhatItRequires/RegisterAndStart` (9:16)

### Talking-head — Incident Reporting
`IncidentReporting-YouTube` (16:9), `IncidentReporting-Short-WhatIsAnIncident/24HourRule/BuildThePlan/5Components` (9:16)

### Talking-head — Personal Liability
`PersonalLiability-YouTube` (16:9), `PersonalLiability-Short-TheFine/CEOObligations` (9:16)

### Sitdown Podcast
`Sitdown-Ep1-YouTube` (16:9), `Sitdown-Ep1-Short-RiskAssets/Partnership` (9:16)

### Thumbnails (Stills, 1280×720)
`WhatIsNIS2-Thumbnail`, `IncidentReporting-Thumbnail`

---

## Components

- **`CaptionOverlay`** — TikTok-style word-highlight captions. Props: `captionsFile`, `startOffsetMs`, `endOffsetMs`, `bottomPadding`.
- **`SectionCard`** — Animated title card overlay. 105 frames (3.5s).
- **`StatCallout`** — Animated stat number callout. 75 frames (2.5s).
- **`NIS2Short`** — 9:16 short clip wrapper. `bottomPadding=240`.
- **`MultiSegmentShort`** — Pipeline composition. Stitches segments via `Sequence` + `OffthreadVideo` with `trimBefore`/`trimAfter`, overlays `CaptionOverlay`.

## Rendering

```bash
bunx remotion render IncidentReporting-YouTube out/incident-reporting.mp4
bunx remotion render IncidentReporting-Short-24HourRule out/short-24h-rule.mp4
bunx remotion still WhatIsNIS2-Thumbnail out/thumbnail-nis2.png
```

## Adding a New Talking-Head Video

1. Drop `my-video.mp4` into `public/`, add to `.gitignore`
2. Run transcription: `bun scripts/transcribe-my-video.ts`
3. Find section timestamps in the captions JSON
4. Create composition in `src/compositions/`, register in `Root.tsx`
5. `bunx tsc --noEmit` — must pass clean
