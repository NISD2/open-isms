import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  staticFile,
  useVideoConfig,
} from "remotion";
import { CaptionOverlay } from "../components/CaptionOverlay";
import { SectionCard } from "../components/SectionCard";

export type LongformYouTubeProps = {
  videoSrc: string;
  captionsFile: string;
  sections: Array<{
    title: string;
    subtitle?: string;
    startMs: number;
    endMs: number;
  }>;
  durationMs: number;
};

const SECTION_CARD_FRAMES = 105; // 3.5s at 30fps — matches SectionCard's own durationInFrames expectation

export const LongformYouTube: React.FC<LongformYouTubeProps> = ({
  videoSrc,
  captionsFile,
  sections,
}) => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <OffthreadVideo
        src={staticFile(videoSrc)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />

      {sections.map((section, i) => (
        <Sequence
          key={i}
          from={Math.round((section.startMs / 1000) * fps)}
          durationInFrames={SECTION_CARD_FRAMES}
          layout="none"
        >
          <SectionCard title={section.title} subtitle={section.subtitle} />
        </Sequence>
      ))}

      <CaptionOverlay
        captionsFile={captionsFile}
        startOffsetMs={0}
        bottomPadding={60}
      />
    </AbsoluteFill>
  );
};
