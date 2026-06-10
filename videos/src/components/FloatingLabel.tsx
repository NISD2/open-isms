import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BRAND } from "../lib/colors";

export function FloatingLabel({
  text,
  delay = 0.3,
  position = "bottom",
  fontSize,
}: {
  text: string;
  delay?: number;
  position?: "bottom" | "top";
  fontSize?: number;
}) {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    delay: Math.round(delay * fps),
    config: { damping: 18, stiffness: 160 },
  });

  const translateY = interpolate(enter, [0, 1], [20, 0]);
  const size = fontSize ?? Math.round(width * 0.028);

  return (
    <div
      style={{
        position: "absolute",
        [position]: Math.round(width * 0.04),
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        zIndex: 10,
      }}
    >
      <div
        style={{
          background: BRAND.dark,
          color: BRAND.white,
          fontSize: size,
          fontWeight: 700,
          fontFamily: "Inter, system-ui, sans-serif",
          padding: `${Math.round(size * 0.4)}px ${Math.round(size * 1.1)}px`,
          borderRadius: Math.round(size * 0.35),
          opacity: enter,
          transform: `translateY(${translateY}px)`,
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        }}
      >
        {text}
      </div>
    </div>
  );
}
