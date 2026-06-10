import { AbsoluteFill, Html5Audio, OffthreadVideo, Sequence, staticFile } from "remotion";
import { CaptionOverlay } from "../components/CaptionOverlay";
import { SectionCard } from "../components/SectionCard";
import { StatCallout } from "../components/StatCallout";

// ─── Timing constants (frames at 30fps) ───────────────────────────────────────
// Derived from Whisper transcription of personally-liable.mp4 (135s, 4049 frames).

const SECTION_CARD_DURATION = 105; // 3.5s
const STAT_DURATION = 75; // 2.5s

// Section title cards — timed to spoken section transitions
const SECTIONS = [
  { from: 144,  title: "Personal Liability",      subtitle: "The Difference" },   // "personal liability" ~5s
  { from: 985,  title: "What Changed",            subtitle: "NIS2 vs GDPR" },      // "what differs with NIS2" ~33s
  { from: 2580, title: "CEO Obligations",         subtitle: "What You Must Do" },  // "personally take training" ~86s
  { from: 3477, title: "Start Free at nisd2.eu",  subtitle: "CTA" },               // "biggest difference" ~116s
] as const;

// Stat callouts — timed to when each number is spoken
const STATS = [
  { from: 1543, value: "€10M", label: "or 2% of\nglobal turnover" }, // "10 million euros or 2%" ~51s
] as const;

export const PersonallyLiable: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* ─── Background music — quiet under voice ─── */}
      <Html5Audio src={staticFile("music.mp3")} volume={0.07} loop />

      {/* ─── Talking-head video ─── */}
      <OffthreadVideo
        src={staticFile("personally-liable.mp4")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />

      {/* ─── Captions ─── */}
      <CaptionOverlay captionsFile="captions-personally-liable.json" />

      {/* ─── Section title cards ─── */}
      {SECTIONS.map((s, i) => (
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
      {STATS.map((s, i) => (
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
