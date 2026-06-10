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
// Note: this take opens with stats immediately, then covers scope, then requirements detail
const SECTIONS = [
  { from: 376,   title: "What is NIS2?",          subtitle: "The Law" },       // "NIS2 is a European compliance directive"
  { from: 3237,  title: "Are You Affected?",       subtitle: "Scope" },         // "the criteria of it for the scope"
  { from: 7032,  title: "What It Actually Requires", subtitle: "Obligations" }, // second 132 requirements explanation
  { from: 10008, title: "Register & Submit",       subtitle: "Action" },        // "register with the BSI, submit it"
  { from: 10928, title: "Start Free at nisd2.eu",  subtitle: "CTA" },           // "platform to help walk through"
] as const;

// Key stat callouts — timed to when each stat is spoken
// Minimum 75 frames between consecutive stats to prevent overlap in the same corner
const STATS = [
  { from: 1295, value: "132", label: "NIS2\nrequirements" },        // first mention ~43s
  { from: 1571, value: "24h", label: "early warning\nto BSI" },     // "within 24 hours" ~52s
  { from: 1663, value: "72h", label: "full notification\nto BSI" }, // "with 72 hours" ~55s (17-frame gap, fine)
  { from: 1768, value: "30d", label: "final incident\nreport" },    // placed after 72h (no clean timestamp)
  { from: 4761, value: "50+", label: "employees\nor €10M revenue" }, // "50 employees and above" ~158s
  { from: 7104, value: "12",  label: "compliance\ncategories" },    // "12 categories" ~236s
] as const;

export const WhatIsNIS2v2: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* ─── Talking-head video ─── */}
      <OffthreadVideo
        src={staticFile("what-is-nis2-2.mp4")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />

      {/* ─── Captions ─── */}
      <CaptionOverlay captionsFile="captions-what-is-nis2-2.json" />

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
