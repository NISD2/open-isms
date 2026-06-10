import { Html5Audio, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { HookScene } from "../scenes/HookScene";
import { DeadlineScene } from "../scenes/DeadlineScene";
import { ProblemScene } from "../scenes/ProblemScene";
import { ProductShowcase } from "../scenes/ProductShowcase";
import { CTAScene } from "../scenes/CTAScene";
import { SCENE_30, TRANSITION_FRAMES } from "../lib/timing";

export function Promo30() {
  const t = TRANSITION_FRAMES;

  return (
    <>
      <MusicTrack />
      <TransitionSeries>
        {/* Hook: "€10,000,000" + fine */}
        <TransitionSeries.Sequence durationInFrames={SCENE_30.hook}>
          <HookScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: t })}
        />

        {/* Urgency: "March 2026. 29,500+ companies." */}
        <TransitionSeries.Sequence durationInFrames={SCENE_30.urgency}>
          <DeadlineScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: t })}
        />

        {/* Problem: compressed */}
        <TransitionSeries.Sequence durationInFrames={SCENE_30.problem}>
          <ProblemScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: t })}
        />

        {/* Solution: dashboard, compliance form, video, audit */}
        <TransitionSeries.Sequence durationInFrames={SCENE_30.product}>
          <ProductShowcase variant="medium" />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: t })}
        />

        {/* CTA */}
        <TransitionSeries.Sequence durationInFrames={SCENE_30.cta}>
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
