import { AbsoluteFill, useVideoConfig } from "remotion";
import { BRAND } from "../lib/colors";
import { KineticText } from "../components/KineticText";

export function ProofScene() {
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
          gap: base * 0.05,
        }}
      >
        <KineticText
          text="Built on BSI audit methodology."
          fontSize={base * 0.045}
          color={BRAND.white}
          fontWeight={700}
          delay={0}
          animation="fade-up"
        />
        <KineticText
          text="132 BSIG requirements mapped. Evidence automated."
          fontSize={base * 0.03}
          color={BRAND.gray}
          fontWeight={600}
          delay={0.4}
          animation="fade-up"
        />
      </div>
    </AbsoluteFill>
  );
}
