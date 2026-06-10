import { AbsoluteFill, useVideoConfig } from "remotion";
import { BRAND } from "../lib/colors";
import { KineticText } from "../components/KineticText";

export function DeadlineScene() {
  const { width, height } = useVideoConfig();
  const base = Math.min(width, height);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND.dark,
        justifyContent: "center",
        alignItems: "center",
        padding: base * 0.06,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: base * 0.04,
        }}
      >
        <KineticText
          text="March 2026."
          fontSize={base * 0.09}
          color={BRAND.orange}
          fontWeight={800}
          delay={0}
          animation="scale"
        />
        <KineticText
          text="29,500+ companies must comply."
          fontSize={base * 0.038}
          color={BRAND.white}
          fontWeight={600}
          delay={0.4}
          animation="fade-up"
        />
        <KineticText
          text="Personal liability for management."
          fontSize={base * 0.035}
          color={BRAND.red}
          fontWeight={700}
          delay={0.8}
          animation="fade-up"
        />
      </div>
    </AbsoluteFill>
  );
}
