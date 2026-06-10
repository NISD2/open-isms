import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BRAND } from "../lib/colors";

// 9:16 · 1080×1920 · 90 frames (3s at 30fps)
// Sequence:
//   0–40f  logo wipes in left→right (clipPath) + subtle scale 0.9→1
//  38–58f  glow ring radiates outward from logo ("activation" pulse)
//  42–58f  accent line grows under logo
//  52–72f  "NISD2" springs up from below
//  62–80f  ".eu" follows with slight delay

export const OutroCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Logo wipe (frames 0–40) ────────────────────────────────────────────────
  const wipeSpring = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 90 },
    durationInFrames: 40,
  });
  const wipePercent = interpolate(wipeSpring, [0, 1], [0, 100], {
    extrapolateRight: "clamp",
  });
  const logoScale = interpolate(wipeSpring, [0, 1], [0.88, 1]);

  // ── Glow ring pulse (frames 38–58) ────────────────────────────────────────
  const glowFrame = Math.max(0, frame - 38);
  const glowProgress = interpolate(glowFrame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  const glowScale = interpolate(glowProgress, [0, 1], [1, 1.4]);
  const glowOpacity = interpolate(glowProgress, [0, 0.3, 1], [0.7, 0.6, 0]);

  // ── Accent line under logo (frames 42–58) ─────────────────────────────────
  const lineSpring = spring({
    frame: Math.max(0, frame - 42),
    fps,
    config: { damping: 22, stiffness: 240 },
    durationInFrames: 16,
  });
  const lineWidth = interpolate(lineSpring, [0, 1], [0, 260]);

  // ── "NISD2" swoop (frames 52–72) ──────────────────────────────────────────
  const textSpring = spring({
    frame: Math.max(0, frame - 52),
    fps,
    config: { damping: 20, stiffness: 150 },
    durationInFrames: 20,
  });
  const textY = interpolate(textSpring, [0, 1], [72, 0]);
  const textOpacity = interpolate(textSpring, [0, 0.2, 1], [0, 1, 1]);

  // ── ".eu" stagger (frames 62–80) ──────────────────────────────────────────
  const euSpring = spring({
    frame: Math.max(0, frame - 62),
    fps,
    config: { damping: 22, stiffness: 160 },
    durationInFrames: 18,
  });
  const euX = interpolate(euSpring, [0, 1], [32, 0]);
  const euOpacity = interpolate(euSpring, [0, 0.2, 1], [0, 1, 1]);

  // ── Background ambient glow ────────────────────────────────────────────────
  const ambientOpacity = interpolate(frame, [0, 20, 90], [0, 0.5, 0.4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const LOGO_SIZE = 260;
  const LOGO_RADIUS = 52; // match logo's rounded corners

  return (
    <AbsoluteFill
      style={{
        background: BRAND.dark,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Ambient radial glow behind logo */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 55% 35% at 50% 48%, ${BRAND.accent}1a 0%, transparent 70%)`,
          opacity: ambientOpacity,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 36,
        }}
      >
        {/* Logo + glow ring stack */}
        <div style={{ position: "relative", width: LOGO_SIZE, height: LOGO_SIZE }}>

          {/* Glow ring — same shape as logo, scales outward and fades */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: LOGO_RADIUS,
              border: `3px solid ${BRAND.accentLight}`,
              opacity: glowOpacity,
              transform: `scale(${glowScale})`,
              pointerEvents: "none",
              boxShadow: `0 0 24px ${BRAND.accent}88`,
            }}
          />

          {/* Logo with left→right wipe reveal */}
          <div
            style={{
              clipPath: `polygon(0 0, ${wipePercent}% 0, ${wipePercent}% 100%, 0 100%)`,
              transform: `scale(${logoScale})`,
              transformOrigin: "center center",
              width: LOGO_SIZE,
              height: LOGO_SIZE,
              lineHeight: 0,
            }}
          >
            <Img
              src={staticFile("logo.png")}
              style={{
                width: LOGO_SIZE,
                height: LOGO_SIZE,
                borderRadius: LOGO_RADIUS,
                display: "block",
              }}
            />
          </div>
        </div>

        {/* Accent line */}
        <div
          style={{
            width: lineWidth,
            height: 3,
            background: `linear-gradient(90deg, transparent, ${BRAND.accent}, ${BRAND.accentLight}, transparent)`,
            borderRadius: 2,
          }}
        />

        {/* NISD2.eu text */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif",
          }}
        >
          {/* NISD2 — swoops up */}
          <div
            style={{
              transform: `translateY(${textY}px)`,
              opacity: textOpacity,
              display: "flex",
              alignItems: "baseline",
            }}
          >
            <span
              style={{
                color: BRAND.accent,
                fontSize: 80,
                fontWeight: 800,
                letterSpacing: -2,
                lineHeight: 1,
              }}
            >
              NIS
            </span>
            <span
              style={{
                color: BRAND.white,
                fontSize: 80,
                fontWeight: 800,
                letterSpacing: -2,
                lineHeight: 1,
              }}
            >
              D
            </span>
            <span
              style={{
                color: BRAND.accent,
                fontSize: 80,
                fontWeight: 800,
                lineHeight: 1,
              }}
            >
              2
            </span>
          </div>

          {/* .eu — slides in from right with stagger */}
          <div
            style={{
              transform: `translateX(${euX}px)`,
              opacity: euOpacity,
            }}
          >
            <span
              style={{
                color: BRAND.gray,
                fontSize: 52,
                fontWeight: 600,
                letterSpacing: -1,
                lineHeight: 1,
                marginLeft: 4,
              }}
            >
              .eu
            </span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
