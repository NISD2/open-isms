import { AbsoluteFill, Html5Audio, OffthreadVideo, Sequence, staticFile } from "remotion";
import { CaptionOverlay } from "../components/CaptionOverlay";
import { SectionCard } from "../components/SectionCard";
import { StatCallout } from "../components/StatCallout";

// ─── Timing constants (frames at 30fps) ───────────────────────────────────────
// Derived from Whisper transcription of what-is-nis2-3.mp4 (2:46, 4987 frames).
// Gap-edited version — much more concise than v2.

const SECTION_CARD_DURATION = 105; // 3.5s
const STAT_DURATION = 75; // 2.5s

// Section title cards — timed to spoken section transitions
const SECTIONS = [
  { from: 210,  title: "What is NIS2?",        subtitle: "The Law" },        // "European compliance directive" ~frame 241
  { from: 1945, title: "Are You Affected?",     subtitle: "Scope" },          // "criteria of it for the scope" ~frame 1976
  { from: 3820, title: "Register & Submit",     subtitle: "Action" },         // "register with the BSI" ~frame 3853
  { from: 4478, title: "Start Free at nisd2.eu", subtitle: "CTA" },           // "platform to help" ~frame 4508
] as const;

// Stat callouts — timed to when each number is spoken
const STATS = [
  { from: 966,  value: "132", label: "NIS2\nrequirements" },     // "132 requirements" ~frame 996
  { from: 2771, value: "50+", label: "employees\nor €10M revenue" }, // "50 employees and above" ~frame 2801
] as const;

export const WhatIsNIS2v3: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* ─── Background music — quiet under voice ─── */}
      <Html5Audio src={staticFile("music.mp3")} volume={0.07} loop />
      
      {/* ─── Talking-head video ─── */}
      <OffthreadVideo
        src={staticFile("what-is-nis2-3.mp4")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />

      {/* ─── Captions ─── */}
      <CaptionOverlay captionsFile="captions-what-is-nis2-3.json" />

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
