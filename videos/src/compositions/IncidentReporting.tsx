import { AbsoluteFill, OffthreadVideo, Sequence, staticFile } from "remotion";
import { CaptionOverlay } from "../components/CaptionOverlay";
import { SectionCard } from "../components/SectionCard";
import { StatCallout } from "../components/StatCallout";

// ─── Timing constants (frames at 30fps) ───────────────────────────────────────
// Derived from Whisper transcription of Incident-reporting.mp4 (396s, 11892 frames).

const SECTION_CARD_DURATION = 105; // 3.5s
const STAT_DURATION = 75; // 2.5s

// Section title cards — timed to spoken section transitions
const SECTIONS = [
  { from: 1080,  title: "Article 23",             subtitle: "Incident Reporting" }, // "Article 23 is incident reporting"
  { from: 2800,  title: "The Reporting Timeline",  subtitle: "Three Deadlines" },    // just before "within the first 24 hours"
  { from: 6700,  title: "Why a Protocol?",         subtitle: "The SOP Mindset" },    // "standard of operational processes"
  { from: 8100,  title: "The 5 Components",        subtitle: "What to Prepare" },    // "five things" / best way to make protocols
  { from: 11280, title: "Start Free at nisd2.eu",  subtitle: "CTA" },                // "check out our website"
] as const;

// Stat callouts — timed to when each number is spoken
// Stagger consecutive stats by ≥80 frames to prevent overlap
const STATS = [
  { from: 2997,  value: "24h",     label: "early warning\nto BSI" },     // after section card clears (~96s + buffer)
  { from: 3750,  value: "72h",     label: "full notification\nto BSI" }, // "within the 72 hours" ~125s
  { from: 5010,  value: "1 month", label: "final incident\nreport" },    // "within one month" ~167s
  { from: 8310,  value: "5",       label: "protocol\ncomponents" },      // "five things" ~277s
] as const;

export const IncidentReporting: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* ─── Talking-head video ─── */}
      <OffthreadVideo
        src={staticFile("Incident-reporting.mp4")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />

      {/* ─── Captions ─── */}
      <CaptionOverlay captionsFile="captions-incident-reporting.json" />

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
