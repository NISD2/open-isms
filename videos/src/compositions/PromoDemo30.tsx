import { Html5Audio, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { HookScene } from "../scenes/HookScene";
import { AppDemoScene } from "../scenes/AppDemoScene";
import { CTAScene } from "../scenes/CTAScene";
import { TRANSITION_FRAMES } from "../lib/timing";

// 30s = 900 frames at 30fps
// Hook: 100 frames (3.3s)
// Demo: 600 frames (20s)
// CTA: 230 frames (7.7s)
// 2 transitions × 15 = 30 frames overlap
// Total: 100 + 600 + 230 - 30 = 900 ✓

const HOOK = 100;
const DEMO = 600;
const CTA = 230;

export function PromoDemo30() {
  const t = TRANSITION_FRAMES;

  return (
    <>
      <MusicTrack />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={HOOK}>
          <HookScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: t })}
        />

        <TransitionSeries.Sequence durationInFrames={DEMO}>
          <AppDemoScene variant="medium" />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: t })}
        />

        <TransitionSeries.Sequence durationInFrames={CTA}>
          <CTAScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </>
  );
}

function MusicTrack() {
  try {
    const src = staticFile("music.mp3");
    return <Html5Audio src={src} volume={0.7} />;
  } catch {
    return null;
  }
}
