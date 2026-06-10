import {
  AbsoluteFill,
  Html5Audio,
  OffthreadVideo,
  Sequence,
  staticFile,
  useVideoConfig,
} from "remotion";
import { CaptionOverlay } from "../components/CaptionOverlay";
import { SectionCard } from "../components/SectionCard";
import { StatCallout } from "../components/StatCallout";

export type NIS2ShortProps = {
  videoSrc: string;
  captionsFile: string;
  clipStartMs: number;
  clipEndMs: number;
  sectionTitle: string;
  sectionSubtitle: string;
  stats: Array<{ fromFrame: number; value: string; label: string }>;
};

const SECTION_CARD_DURATION = 105; // 3.5s
const STAT_DURATION = 75; // 2.5s

export const NIS2Short: React.FC<NIS2ShortProps> = ({
  videoSrc,
  captionsFile,
  clipStartMs,
  clipEndMs,
  sectionTitle,
  sectionSubtitle,
  stats,
}) => {
  const { fps } = useVideoConfig();
  const trimBefore = (clipStartMs / 1000) * fps;
  const trimAfter = (clipEndMs / 1000) * fps;

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* ─── Background music — quiet under voice ─── */}
      <Html5Audio src={staticFile("music.mp3")} volume={0.08} loop />

      {/* ─── Zoomed & cropped talking-head video ─── */}
      {/* objectFit "cover" on a 9:16 container from a 16:9 source scales by
          height (1920/1080 = 1.78×), cropping the sides — keeps face centred */}
      <OffthreadVideo
        src={staticFile(videoSrc)}
        trimBefore={trimBefore}
        trimAfter={trimAfter}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "50% 15%",
        }}
      />

      {/* ─── Captions (offset to clip start, raised above platform UI) ─── */}
      <CaptionOverlay
        captionsFile={captionsFile}
        startOffsetMs={clipStartMs}
        endOffsetMs={clipEndMs}
        bottomPadding={240}
      />

      {/* ─── Section title card — shown at the start of each clip ─── */}
      <Sequence from={0} durationInFrames={SECTION_CARD_DURATION} layout="none">
        <SectionCard title={sectionTitle} subtitle={sectionSubtitle} />
      </Sequence>

      {/* ─── Stat callouts (relative to clip start) ─── */}
      {stats.map((s) => (
        <Sequence
          key={s.fromFrame}
          from={s.fromFrame}
          durationInFrames={STAT_DURATION}
          layout="none"
        >
          <StatCallout value={s.value} label={s.label} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
