import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export function AnimatedCounter({
  target,
  prefix = "",
  suffix = "",
  delay = 0,
  fontSize,
  color = "#ffffff",
  fontWeight = 800,
}: {
  target: number;
  prefix?: string;
  suffix?: string;
  delay?: number;
  fontSize: number;
  color?: string;
  fontWeight?: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame,
    fps,
    delay: Math.round(delay * fps),
    config: { damping: 20, stiffness: 80 },
  });

  const value = Math.round(interpolate(progress, [0, 1], [0, target]));
  const formatted = value.toLocaleString("en-US");

  const scale = interpolate(progress, [0, 1], [0.7, 1]);

  return (
    <div
      style={{
        fontSize,
        fontWeight,
        color,
        fontFamily: "Inter, system-ui, sans-serif",
        letterSpacing: "-0.03em",
        opacity: progress,
        transform: `scale(${scale})`,
        textAlign: "center",
        lineHeight: 1,
      }}
    >
      {prefix}
      {formatted}
      {suffix}
    </div>
  );
}
