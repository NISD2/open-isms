import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  staticFile,
  useVideoConfig,
} from "remotion";
import { CaptionOverlay } from "../components/CaptionOverlay";
import { OutroCard } from "./OutroCard";

const OUTRO_FRAMES = 90; // 3s at 30fps

export type MultiSegmentShortProps = {
  videoSrc: string;
  captionsFile: string; // already remapped to new timeline
  segments: Array<{ startMs: number; endMs: number }>;
};

export const MultiSegmentShort: React.FC<MultiSegmentShortProps> = ({
  videoSrc,
  captionsFile,
  segments,
}) => {
  const { fps } = useVideoConfig();

  // Calculate cumulative frame offsets for each segment
  let cumulativeFrames = 0;
  const positioned = segments.map((seg) => {
    const from = cumulativeFrames;
    const durationFrames = Math.round(((seg.endMs - seg.startMs) / 1000) * fps);
    cumulativeFrames += durationFrames;
    return { seg, from, durationFrames };
  });

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {positioned.map(({ seg, from, durationFrames }, i) => (
        <Sequence key={i} from={from} durationInFrames={durationFrames} layout="none">
          <OffthreadVideo
            src={staticFile(videoSrc)}
            trimBefore={(seg.startMs / 1000) * fps}
            trimAfter={(seg.endMs / 1000) * fps}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "50% 50%",
            }}
          />
        </Sequence>
      ))}
      <CaptionOverlay
        captionsFile={captionsFile}
        startOffsetMs={0}
        endOffsetMs={cumulativeFrames / fps * 1000}
        bottomPadding={240}
      />
      <Sequence from={cumulativeFrames} durationInFrames={OUTRO_FRAMES} layout="none">
        <OutroCard />
      </Sequence>
    </AbsoluteFill>
  );
};
