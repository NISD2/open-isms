import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type Animation = "fade-up" | "scale" | "slide-left" | "slide-right" | "fade";

export function KineticText({
  text,
  delay = 0,
  fontSize,
  color = "#ffffff",
  fontWeight = 800,
  animation = "fade-up",
  letterSpacing = "-0.02em",
  textAlign = "center",
}: {
  text: string;
  delay?: number;
  fontSize: number;
  color?: string;
  fontWeight?: number;
  animation?: Animation;
  letterSpacing?: string;
  textAlign?: React.CSSProperties["textAlign"];
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame,
    fps,
    delay: Math.round(delay * fps),
    config: { damping: 15, stiffness: 180 },
  });

  const transforms: Record<Animation, string> = {
    "fade-up": `translateY(${interpolate(progress, [0, 1], [50, 0])}px)`,
    scale: `scale(${interpolate(progress, [0, 1], [0.6, 1])})`,
    "slide-left": `translateX(${interpolate(progress, [0, 1], [-80, 0])}px)`,
    "slide-right": `translateX(${interpolate(progress, [0, 1], [80, 0])}px)`,
    fade: "none",
  };

  return (
    <div
      style={{
        fontSize,
        fontWeight,
        color,
        fontFamily: "Inter, system-ui, sans-serif",
        opacity: progress,
        transform: transforms[animation],
        textAlign,
        letterSpacing,
        lineHeight: 1.1,
      }}
    >
      {text}
    </div>
  );
}
