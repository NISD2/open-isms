import {
  OffthreadVideo,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BRAND } from "../lib/colors";

export function VideoClip({
  src,
  trimBefore = 0,
  delay = 0,
}: {
  src: string;
  trimBefore?: number;
  delay?: number;
}) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    delay: Math.round(delay * fps),
    config: { damping: 18, stiffness: 140 },
  });

  const scale = interpolate(enter, [0, 1], [1.05, 1]);

  const isPortrait = height > width;
  const frameWidth = isPortrait ? width * 0.88 : width * 0.75;
  const frameHeight = frameWidth / 1.76;

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
        transform: `scale(${scale})`,
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
      {/* Video */}
      <div style={{ height: frameHeight }}>
        <OffthreadVideo
          src={staticFile(src)}
          trimBefore={trimBefore}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </div>
    </div>
  );
}
