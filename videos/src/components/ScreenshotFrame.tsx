import {
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BRAND } from "../lib/colors";

type RevealAnimation = "scale" | "slide-right" | "slide-left" | "fade";

export function ScreenshotFrame({
  src,
  delay = 0,
  animation = "scale",
}: {
  src: string;
  delay?: number;
  animation?: RevealAnimation;
}) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    delay: Math.round(delay * fps),
    config: { damping: 18, stiffness: 140 },
  });

  const isPortrait = height > width;
  const frameWidth = isPortrait ? width * 0.88 : width * 0.75;
  // Match actual screenshot aspect ratio (~2824x1604 ≈ 1.76:1)
  const frameHeight = frameWidth / 1.76;

  const transforms: Record<RevealAnimation, string> = {
    scale: `scale(${interpolate(enter, [0, 1], [1.08, 1])})`,
    "slide-right": `translateX(${interpolate(enter, [0, 1], [80, 0])}px)`,
    "slide-left": `translateX(${interpolate(enter, [0, 1], [-80, 0])}px)`,
    fade: "none",
  };

  const barHeight = Math.round(frameWidth * 0.03);
  const dotSize = Math.round(barHeight * 0.35);

  return (
    <div
      style={{
        width: frameWidth,
        maxWidth: "95%",
        borderRadius: Math.round(frameWidth * 0.012),
        overflow: "hidden",
        boxShadow: "0 25px 80px rgba(0,0,0,0.25)",
        transform: transforms[animation],
        opacity: enter,
      }}
    >
      {/* Browser chrome bar */}
      <div
        style={{
          height: barHeight,
          background: BRAND.lightGray,
          display: "flex",
          alignItems: "center",
          gap: dotSize * 0.8,
          paddingLeft: dotSize * 1.5,
        }}
      >
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <div
            key={c}
            style={{
              width: dotSize,
              height: dotSize,
              borderRadius: "50%",
              background: c,
            }}
          />
        ))}
      </div>
      {/* Screenshot */}
      <div style={{ height: frameHeight }}>
        <Img
          src={staticFile(src)}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </div>
    </div>
  );
}
