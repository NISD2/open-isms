import { Html5Audio, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { HookScene } from "../scenes/HookScene";
import { DeadlineScene } from "../scenes/DeadlineScene";
import { ProblemScene } from "../scenes/ProblemScene";
import { ProductShowcase } from "../scenes/ProductShowcase";
import { ProofScene } from "../scenes/ProofScene";
import { CTAScene } from "../scenes/CTAScene";
import { SCENE_60, TRANSITION_FRAMES } from "../lib/timing";

export function Promo60() {
  const t = TRANSITION_FRAMES;

  return (
    <>
      <MusicTrack />
      <TransitionSeries>
        {/* Scene 1: Hook — €10M penalty reveal */}
        <TransitionSeries.Sequence durationInFrames={SCENE_60.hook}>
          <HookScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: t })}
        />

        {/* Scene 2: Deadline urgency */}
        <TransitionSeries.Sequence durationInFrames={SCENE_60.deadline}>
          <DeadlineScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: t })}
        />

        {/* Scene 3: Problem agitation */}
        <TransitionSeries.Sequence durationInFrames={SCENE_60.problem}>
          <ProblemScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: t })}
        />

        {/* Scene 4: Product showcase — drill-down story + video */}
        <TransitionSeries.Sequence durationInFrames={SCENE_60.product}>
          <ProductShowcase variant="full" />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: t })}
        />

        {/* Scene 5: Proof / trust signals */}
        <TransitionSeries.Sequence durationInFrames={SCENE_60.proof}>
          <ProofScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: t })}
        />

        {/* Scene 6: CTA */}
        <TransitionSeries.Sequence durationInFrames={SCENE_60.cta}>
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
