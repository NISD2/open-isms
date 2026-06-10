import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BRAND } from "../lib/colors";
import { KineticText } from "../components/KineticText";

export function ProblemScene() {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const base = Math.min(width, height);

  // Subtle red pulse in background during tension
  const pulse = interpolate(
    Math.sin((frame / fps) * Math.PI * 2),
    [-1, 1],
    [0.0, 0.03],
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND.dark,
        justifyContent: "center",
        alignItems: "center",
        padding: base * 0.06,
      }}
    >
      {/* Subtle red vignette pulse */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, transparent 40%, rgba(220,38,38,${pulse}) 100%)`,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: base * 0.04,
          zIndex: 1,
        }}
      >
        <div style={{ display: "flex", gap: base * 0.03, flexWrap: "wrap", justifyContent: "center" }}>
          <KineticText
            text="132 requirements."
            fontSize={base * 0.06}
            color={BRAND.white}
            delay={0}
            animation="fade-up"
          />
          <KineticText
            text="20 categories."
            fontSize={base * 0.06}
            color={BRAND.white}
            delay={0.5}
            animation="fade-up"
          />
        </div>
        <KineticText
          text="Endless evidence."
          fontSize={base * 0.06}
          color={BRAND.gray}
          delay={1.0}
          animation="fade-up"
        />
        <div style={{ marginTop: base * 0.03 }}>
          <KineticText
            text="Are you tracking compliance in spreadsheets?"
            fontSize={base * 0.032}
            color={BRAND.orange}
            fontWeight={600}
            delay={2.0}
            animation="fade"
          />
        </div>
      </div>
    </AbsoluteFill>
  );
}
