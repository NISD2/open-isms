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

export function CTAScene() {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const base = Math.min(width, height);

  const logoEnter = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });
  const logoScale = interpolate(logoEnter, [0, 1], [0.5, 1]);

  const textEnter = spring({
    frame,
    fps,
    delay: Math.round(0.3 * fps),
    config: { damping: 18, stiffness: 160 },
  });

  const urlEnter = spring({
    frame,
    fps,
    delay: Math.round(0.6 * fps),
    config: { damping: 18, stiffness: 160 },
  });

  const logoSize = base * 0.12;

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
        <div
          style={{
            width: logoSize,
            height: logoSize,
            borderRadius: logoSize * 0.2,
            overflow: "hidden",
            transform: `scale(${logoScale})`,
            opacity: logoEnter,
          }}
        >
          <Img
            src={staticFile("logo.png")}
            style={{ width: "100%", height: "100%" }}
          />
        </div>

        <div
          style={{
            fontSize: base * 0.055,
            fontWeight: 800,
            color: BRAND.white,
            fontFamily: "Inter, system-ui, sans-serif",
            letterSpacing: "-0.02em",
            opacity: textEnter,
            transform: `translateY(${interpolate(textEnter, [0, 1], [30, 0])}px)`,
            textAlign: "center",
            lineHeight: 1.1,
            padding: `0 ${base * 0.04}px`,
          }}
        >
          NIS2 compliance, handled.
        </div>

        <div
          style={{
            fontSize: base * 0.035,
            fontWeight: 600,
            color: BRAND.accent,
            fontFamily: "Inter, system-ui, sans-serif",
            opacity: urlEnter,
            transform: `translateY(${interpolate(urlEnter, [0, 1], [20, 0])}px)`,
          }}
        >
          Start free at nisd2.eu
        </div>
      </div>
    </AbsoluteFill>
  );
}
