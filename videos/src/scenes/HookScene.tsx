import { AbsoluteFill, useVideoConfig } from "remotion";
import { BRAND } from "../lib/colors";
import { AnimatedCounter } from "../components/AnimatedCounter";
import { KineticText } from "../components/KineticText";

export function HookScene() {
  const { width, height } = useVideoConfig();
  const base = Math.min(width, height);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND.dark,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: base * 0.03,
        }}
      >
        <AnimatedCounter
          target={10000000}
          prefix="€"
          fontSize={base * 0.1}
          color={BRAND.red}
          delay={0}
        />
        <KineticText
          text="That's your fine for NIS2 non-compliance."
          fontSize={base * 0.035}
          color={BRAND.white}
          fontWeight={600}
          delay={0.8}
          animation="fade-up"
        />
      </div>
    </AbsoluteFill>
  );
}
