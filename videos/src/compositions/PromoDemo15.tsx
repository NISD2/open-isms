import { Html5Audio, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { HookScene } from "../scenes/HookScene";
import { AppDemoScene } from "../scenes/AppDemoScene";
import { CTAScene } from "../scenes/CTAScene";
import { TRANSITION_FRAMES } from "../lib/timing";

// 15s = 450 frames at 30fps
// Hook: 90 frames (3s)
// Demo: 240 frames (8s)
// CTA: 150 frames (5s)
// 2 transitions × 15 = 30 frames overlap
// Total: 90 + 240 + 150 - 30 = 450 ✓

const HOOK = 90;
const DEMO = 240;
const CTA = 150;

export function PromoDemo15() {
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
          <AppDemoScene variant="short" />
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
