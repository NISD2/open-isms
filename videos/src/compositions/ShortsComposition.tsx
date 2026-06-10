import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  staticFile,
} from "remotion";
import { CaptionOverlay } from "../components/CaptionOverlay";

// ─── Clips in order ────────────────────────────────────────────────────────────
// Durations are exact (ffprobe at 30fps). Captions are transcribed from the
// concatenated audio so timestamps map directly to composition frames.

const CLIPS = [
  { src: "shorts/IMG_4998.MOV", durationInFrames: 477 },
  { src: "shorts/IMG_4999.MOV", durationInFrames: 643 },
  { src: "shorts/IMG_5001.MOV", durationInFrames: 442 },
  { src: "shorts/IMG_5002.MOV", durationInFrames: 264 },
] as const;

// Cumulative start frame for each clip
const withOffsets = CLIPS.reduce<
  Array<{ src: string; startFrame: number; durationInFrames: number }>
>((acc, clip) => {
  const prev = acc[acc.length - 1];
  const startFrame = prev ? prev.startFrame + prev.durationInFrames : 0;
  return [...acc, { ...clip, startFrame }];
}, []);

export const ShortsComposition: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* ─── Clips — hard cuts in sequence ─── */}
      {withOffsets.map((clip) => (
        <Sequence
          key={clip.src}
          from={clip.startFrame}
          durationInFrames={clip.durationInFrames}
        >
          <OffthreadVideo
            src={staticFile(clip.src)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "50% 50%",
            }}
          />
        </Sequence>
      ))}

      {/* ─── Captions across all clips ─── */}
      <CaptionOverlay captionsFile="captions-shorts.json" />
    </AbsoluteFill>
  );
};
