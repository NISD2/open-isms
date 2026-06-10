import { Html5Audio, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { HookScene } from "../scenes/HookScene";
import { ProductShowcase } from "../scenes/ProductShowcase";
import { CTAScene } from "../scenes/CTAScene";
import { SCENE_15, TRANSITION_FRAMES } from "../lib/timing";

export function Promo15() {
  const t = TRANSITION_FRAMES;

  return (
    <>
      <MusicTrack />
      <TransitionSeries>
        {/* Hook: "€10M fine. March 2026." */}
        <TransitionSeries.Sequence durationInFrames={SCENE_15.hook}>
          <HookScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: t })}
        />

        {/* Product: dashboard + compliance form */}
        <TransitionSeries.Sequence durationInFrames={SCENE_15.product}>
          <ProductShowcase variant="short" />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: t })}
        />

        {/* CTA */}
        <TransitionSeries.Sequence durationInFrames={SCENE_15.cta}>
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
