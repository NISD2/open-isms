import {
  AbsoluteFill,
  OffthreadVideo,
  staticFile,
  useVideoConfig,
} from "remotion";
import { CaptionOverlay } from "../components/CaptionOverlay";

// Minimal short — video + captions only. No music, no section cards, no stats.
// Used for daily standup clips and banter content.

export type RawShortProps = {
  videoSrc: string;
  captionsFile: string;
  clipStartMs: number;
  clipEndMs: number;
};

export const RawShort: React.FC<RawShortProps> = ({
  videoSrc,
  captionsFile,
  clipStartMs,
  clipEndMs,
}) => {
  const { fps } = useVideoConfig();
  const trimBefore = (clipStartMs / 1000) * fps;
  const trimAfter = (clipEndMs / 1000) * fps;

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <OffthreadVideo
        src={staticFile(videoSrc)}
        trimBefore={trimBefore}
        trimAfter={trimAfter}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "50% 50%",
        }}
      />
      <CaptionOverlay
        captionsFile={captionsFile}
        startOffsetMs={clipStartMs}
        endOffsetMs={clipEndMs}
        bottomPadding={240}
      />
    </AbsoluteFill>
  );
};
