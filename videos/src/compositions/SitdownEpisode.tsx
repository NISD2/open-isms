import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  staticFile,
} from "remotion";
import { CaptionOverlay } from "../components/CaptionOverlay";
import { SectionCard } from "../components/SectionCard";
import { StatCallout } from "../components/StatCallout";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SitdownSection = {
  from: number; // frame at 30fps
  title: string;
  subtitle: string;
};

export type SitdownStat = {
  from: number; // frame at 30fps
  value: string;
  label: string;
};

export type SitdownEpisodeProps = {
  videoSrc: string;
  captionsFile: string;
  episodeNumber: number;
  episodeDate: string;
  sections: SitdownSection[];
  stats: SitdownStat[];
};

// ─── Durations ────────────────────────────────────────────────────────────────

const SECTION_CARD_DURATION = 105; // 3.5s @ 30fps
const STAT_DURATION = 75; // 2.5s @ 30fps

// ─── Component ────────────────────────────────────────────────────────────────

export const SitdownEpisode: React.FC<SitdownEpisodeProps> = ({
  videoSrc,
  captionsFile,
  episodeNumber,
  episodeDate,
  sections,
  stats,
}) => {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* ─── Background music — very quiet under conversation ─── */}

      {/* ─── Meeting recording ─── */}
      <OffthreadVideo
        src={staticFile(videoSrc)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />

      {/* ─── Captions ─── */}
      <CaptionOverlay captionsFile={captionsFile} />

      {/* ─── Intro episode card (always at frame 0) ─── */}
      <Sequence from={0} durationInFrames={SECTION_CARD_DURATION} layout="none">
        <SectionCard
          title={`Daily Meeting — Ep. ${episodeNumber}`}
          subtitle={episodeDate}
        />
      </Sequence>

      {/* ─── Topic section cards ─── */}
      {sections.map((s, i) => (
        <Sequence
          key={i}
          from={s.from}
          durationInFrames={SECTION_CARD_DURATION}
          layout="none"
        >
          <SectionCard title={s.title} subtitle={s.subtitle} />
        </Sequence>
      ))}

      {/* ─── Stat callouts ─── */}
      {stats.map((s, i) => (
        <Sequence
          key={i}
          from={s.from}
          durationInFrames={STAT_DURATION}
          layout="none"
        >
          <StatCallout value={s.value} label={s.label} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
