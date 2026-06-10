import { AbsoluteFill, OffthreadVideo, Sequence, staticFile } from "remotion";
import { CaptionOverlay } from "../components/CaptionOverlay";
import { SectionCard } from "../components/SectionCard";
import { StatCallout } from "../components/StatCallout";

// ─── Timing constants (frames at 30fps) ───────────────────────────────────────
// Derived from Whisper transcription of the actual recording.
// Adjust these constants if you re-record or trim the video.

const SECTION_CARD_DURATION = 105; // 3.5s
const STAT_DURATION = 75; // 2.5s

// Section title cards — timed to actual spoken section transitions
const SECTIONS = [
  { from: 270, title: "What is NIS2?", subtitle: "The Law" },          // "NIS2 is a European..."
  { from: 2633, title: "Are You Affected?", subtitle: "Scope" },       // "Are you affected?"
  { from: 4939, title: "What It Actually Requires", subtitle: "Obligations" }, // "First, registration"
  { from: 7797, title: "What Should You Do?", subtitle: "Action" },    // "What should you do?"
  { from: 9258, title: "Start Free at nisd2.eu", subtitle: "CTA" },   // "We're building a platform"
] as const;

// Key stat callouts — timed to when each stat is spoken
// Minimum 75 frames between consecutive stats to prevent overlap in the same corner
const STATS = [
  { from: 2754, value: "50+", label: "employees\nor €10M revenue" }, // "50 or more employees"
  { from: 3029, value: "18", label: "regulated\nsectors" },          // "18 essential sectors"
  { from: 5660, value: "132", label: "NIS2\nrequirements" },         // "132 requirements"
  { from: 5765, value: "12", label: "compliance\ncategories" },      // "12 categories" (delayed to not overlap)
  { from: 7239, value: "24h", label: "early warning\nto BSI" },     // "within 24 hours"
  { from: 7332, value: "72h", label: "full notification\nto BSI" }, // "72 hours"
  { from: 7437, value: "30d", label: "final incident\nreport" },    // "30 days" (delayed to not overlap)
] as const;

export const WhatIsNIS2: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* ─── Talking-head video ─── */}
      <OffthreadVideo
        src={staticFile("what-is-nis2.mp4")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />

      {/* ─── Captions ─── */}
      <CaptionOverlay />

      {/* ─── Section title cards ─── */}
      {SECTIONS.map((s) => (
        <Sequence
          key={s.from}
          from={s.from}
          durationInFrames={SECTION_CARD_DURATION}
          layout="none"
        >
          <SectionCard title={s.title} subtitle={s.subtitle} />
        </Sequence>
      ))}

      {/* ─── Stat callouts ─── */}
      {STATS.map((s) => (
        <Sequence
          key={s.from}
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
