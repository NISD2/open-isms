import { Html5Audio, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { HookScene } from "../scenes/HookScene";
import { AppDemoScene } from "../scenes/AppDemoScene";
import { CTAScene } from "../scenes/CTAScene";
import { TRANSITION_FRAMES } from "../lib/timing";

// 60s = 1800 frames at 30fps
// Hook: 150 frames (5s)
// Demo: 1380 frames (46s)
// CTA: 300 frames (10s)
// 2 transitions × 15 = 30 frames overlap
// Total: 150 + 1380 + 300 - 30 = 1800 ✓

const HOOK = 150;
const DEMO = 1380;
const CTA = 300;

export function PromoDemo60() {
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
          <AppDemoScene variant="full" />
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
