import { AbsoluteFill, Html5Audio, OffthreadVideo, Sequence, staticFile } from "remotion";
import { CaptionOverlay } from "../components/CaptionOverlay";
import { SectionCard } from "../components/SectionCard";
import { StatCallout } from "../components/StatCallout";

// ─── Timing constants (frames at 30fps) ───────────────────────────────────────
// Derived from Whisper transcription of incident-reporting-2.mp4 (336s, 10082 frames).
// This is the gap-edited version of Incident-reporting.mp4.

const SECTION_CARD_DURATION = 105; // 3.5s
const STAT_DURATION = 75; // 2.5s

// Section title cards — timed to spoken section transitions
const SECTIONS = [
  { from: 800,  title: "Article 23",            subtitle: "Incident Reporting" }, // "Article 23 is incident reporting" ~28s
  { from: 2260, title: "The Reporting Timeline", subtitle: "Three Deadlines" },   // just before "within the first 24 hours" ~76s
  { from: 5600, title: "Why a Protocol?",        subtitle: "The SOP Mindset" },   // "standard of operational processes" ~188s
  { from: 7020, title: "The 5 Components",       subtitle: "What to Prepare" },   // "basically five things" ~235s
  { from: 9439, title: "Start Free at nisd2.eu", subtitle: "CTA" },               // "check out our website" ~315s
] as const;

// Stat callouts — timed to when each number is spoken
const STATS = [
  { from: 2321, value: "24h",     label: "early warning\nto BSI" },     // "the first 24 hours" ~77s
  { from: 3157, value: "72h",     label: "full notification\nto BSI" }, // "within the 72 hours" ~105s
  { from: 4100, value: "1 month", label: "final incident\nreport" },    // "within one month" ~137s
  { from: 7050, value: "5",       label: "protocol\ncomponents" },      // "five things" ~235s
] as const;

export const IncidentReporting2: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* ─── Background music — quiet under voice ─── */}
      <Html5Audio src={staticFile("music.mp3")} volume={0.08} loop />

      {/* ─── Talking-head video ─── */}
      <OffthreadVideo
        src={staticFile("incident-reporting-2.mp4")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />

      {/* ─── Captions ─── */}
      <CaptionOverlay captionsFile="captions-incident-reporting-2.json" />

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
