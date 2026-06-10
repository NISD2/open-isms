import {
  AbsoluteFill,
  Sequence,
  useVideoConfig,
} from "remotion";
import { BRAND } from "../lib/colors";
import { KineticText } from "../components/KineticText";
import { ScreenshotFrame } from "../components/ScreenshotFrame";
import { FloatingLabel } from "../components/FloatingLabel";
import { VideoClip } from "../components/VideoClip";

// ─── Showcase item types ───

type ScreenshotItem = {
  type: "screenshot";
  src: string;
  label: string;
  animation: "scale" | "slide-right" | "slide-left" | "fade";
};

type VideoItem = {
  type: "video";
  src: string;
  label: string;
  trimBefore?: number;
};

type ShowcaseItem = ScreenshotItem | VideoItem;

// ─── Preset sequences ───

const FULL_SEQUENCE: ShowcaseItem[] = [
  { type: "screenshot", src: "screenshots/dashboard.png", label: "Real-time compliance tracking", animation: "scale" },
  { type: "screenshot", src: "screenshots/governance1.png", label: "132 requirements by category", animation: "slide-right" },
  { type: "screenshot", src: "screenshots/governance2.png", label: "Step-by-step guided compliance", animation: "slide-left" },
  { type: "screenshot", src: "screenshots/governance3.png", label: "AI-powered form assistance", animation: "scale" },
  { type: "video", src: "screenrecordings/nis2-vid1.mov", label: "See it in action", trimBefore: 0 },
  { type: "screenshot", src: "screenshots/risk1.png", label: "Built-in risk management", animation: "slide-right" },
  { type: "screenshot", src: "screenshots/audit-readiness.png", label: "AI-powered audit evaluation", animation: "scale" },
];

const MEDIUM_SEQUENCE: ShowcaseItem[] = [
  { type: "screenshot", src: "screenshots/dashboard.png", label: "Real-time compliance tracking", animation: "scale" },
  { type: "screenshot", src: "screenshots/governance2.png", label: "Step-by-step guided compliance", animation: "slide-right" },
  { type: "video", src: "screenrecordings/nis2-vid1.mov", label: "See it in action", trimBefore: 0 },
  { type: "screenshot", src: "screenshots/audit-readiness.png", label: "AI-powered audit evaluation", animation: "scale" },
];

const SHORT_SEQUENCE: ShowcaseItem[] = [
  { type: "screenshot", src: "screenshots/dashboard.png", label: "Real-time compliance tracking", animation: "scale" },
  { type: "screenshot", src: "screenshots/governance2.png", label: "Step-by-step guided compliance", animation: "slide-right" },
];

const SEQUENCES = {
  full: FULL_SEQUENCE,
  medium: MEDIUM_SEQUENCE,
  short: SHORT_SEQUENCE,
} as const;

// ─── Component ───

export function ProductShowcase({
  variant = "full",
}: {
  variant?: "full" | "medium" | "short";
}) {
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const base = Math.min(width, height);

  const items = SEQUENCES[variant];

  // Intro "There's a better way" takes ~2s
  const introFrames = Math.round(fps * 2);
  const remaining = durationInFrames - introFrames;

  // Callout only on full/medium variants
  const hasCallout = variant !== "short";
  const calloutFrames = hasCallout ? Math.round(fps * 2) : 0;
  const itemsTotal = remaining - calloutFrames;
  const perItem = Math.round(itemsTotal / items.length);

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.lightGray }}>
      {/* Intro text */}
      <Sequence durationInFrames={introFrames}>
        <AbsoluteFill
          style={{
            backgroundColor: BRAND.dark,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <KineticText
            text="There's a better way."
            fontSize={base * 0.065}
            color={BRAND.accentLight}
            fontWeight={800}
            delay={0}
            animation="scale"
          />
        </AbsoluteFill>
      </Sequence>

      {/* Showcase items */}
      {items.map((item, i) => (
        <Sequence
          key={item.type === "video" ? item.src : item.src}
          from={introFrames + i * perItem}
          durationInFrames={perItem}
        >
          <AbsoluteFill
            style={{
              backgroundColor: i % 2 === 0 ? BRAND.lightGray : BRAND.white,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {item.type === "screenshot" ? (
              <ScreenshotFrame
                src={item.src}
                animation={item.animation}
                delay={0}
              />
            ) : (
              <VideoClip
                src={item.src}
                trimBefore={item.trimBefore}
                delay={0}
              />
            )}
            <FloatingLabel text={item.label} delay={0.3} />
          </AbsoluteFill>
        </Sequence>
      ))}

      {/* Callout */}
      {hasCallout && (
        <Sequence
          from={introFrames + items.length * perItem}
          durationInFrames={calloutFrames}
        >
          <AbsoluteFill
            style={{
              backgroundColor: BRAND.dark,
              justifyContent: "center",
              alignItems: "center",
              padding: base * 0.06,
            }}
          >
            <KineticText
              text="Automated audit trail"
              fontSize={base * 0.04}
              color={BRAND.white}
              fontWeight={700}
              delay={0}
              animation="fade-up"
            />
          </AbsoluteFill>
        </Sequence>
      )}
    </AbsoluteFill>
  );
}
