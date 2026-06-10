import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BRAND } from "../lib/colors";

interface StatCalloutProps {
  value: string;
  label: string;
}

export const StatCallout: React.FC<StatCalloutProps> = ({ value, label }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 200 },
    durationInFrames: 18,
  });

  const fadeOut = interpolate(
    frame,
    [durationInFrames - 18, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const opacity = Math.min(enter, fadeOut);
  const scale = interpolate(enter, [0, 1], [0.8, 1]);
  const translateY = interpolate(enter, [0, 1], [20, 0]);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "flex-end",
        paddingRight: 60,
        paddingBottom: 160,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          opacity,
          transform: `scale(${scale}) translateY(${translateY}px)`,
          background: "rgba(15, 23, 42, 0.9)",
          backdropFilter: "blur(10px)",
          border: `2px solid ${BRAND.accent}`,
          borderRadius: 12,
          padding: "16px 28px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          minWidth: 180,
        }}
      >
        <div
          style={{
            color: BRAND.accentLight,
            fontSize: 52,
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: -1,
          }}
        >
          {value}
        </div>
        <div
          style={{
            color: BRAND.gray,
            fontSize: 18,
            fontWeight: 500,
            textAlign: "center",
            lineHeight: 1.2,
          }}
        >
          {label}
        </div>
      </div>
    </AbsoluteFill>
  );
};
