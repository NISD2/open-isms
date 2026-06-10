import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BRAND } from "../lib/colors";

interface SectionCardProps {
  title: string;
  subtitle?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  subtitle,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 180 },
    durationInFrames: 20,
  });

  const fadeOut = interpolate(
    frame,
    [durationInFrames - 20, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const opacity = Math.min(enter, fadeOut);
  const translateX = interpolate(enter, [0, 1], [-40, 0]);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "flex-start",
        paddingLeft: 64,
        paddingBottom: 160,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          opacity,
          transform: `translateX(${translateX}px)`,
          display: "flex",
          flexDirection: "row",
          alignItems: "stretch",
          gap: 0,
        }}
      >
        {/* Accent bar */}
        <div
          style={{
            width: 6,
            borderRadius: 3,
            background: BRAND.accent,
            marginRight: 18,
            flexShrink: 0,
          }}
        />
        {/* Text block */}
        <div
          style={{
            background: "rgba(15, 23, 42, 0.85)",
            backdropFilter: "blur(8px)",
            padding: "14px 24px",
            borderRadius: 8,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div
            style={{
              color: BRAND.accent,
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            {subtitle ?? "Section"}
          </div>
          <div
            style={{
              color: BRAND.white,
              fontSize: 30,
              fontWeight: 800,
              lineHeight: 1.2,
            }}
          >
            {title}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
