import {
  AbsoluteFill,
  Img,
  Sequence,
  OffthreadVideo,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BRAND } from "../lib/colors";

// ─── Segment definitions ───

type VideoSegment = {
  type: "video";
  videoStart: number;
  label: string;
  labelDelay?: number;
};

type ScreenshotSegment = {
  type: "screenshot";
  src: string;
  label: string;
  labelDelay?: number;
};

type Segment = VideoSegment | ScreenshotSegment;

// Full set for 60s demo section
const SEGMENTS_FULL: Segment[] = [
  { type: "video", videoStart: 0, label: "Real-time compliance dashboard" },
  { type: "video", videoStart: 15, label: "Guided step-by-step requirements" },
  { type: "video", videoStart: 28, label: "Fill in compliance evidence" },
  { type: "screenshot", src: "screenshots/governance1.png", label: "Track your progress" },
  { type: "screenshot", src: "screenshots/risk-management.png", label: "20 categories, 132 requirements" },
  { type: "screenshot", src: "screenshots/risk1.png", label: "Built-in risk management" },
  { type: "screenshot", src: "screenshots/audit-readiness.png", label: "Comprehensive coverage" },
];

// Medium set for 30s demo section
const SEGMENTS_MEDIUM: Segment[] = [
  { type: "video", videoStart: 0, label: "Real-time compliance dashboard" },
  { type: "video", videoStart: 15, label: "Guided step-by-step requirements" },
  { type: "screenshot", src: "screenshots/governance1.png", label: "Track your progress" },
  { type: "screenshot", src: "screenshots/risk1.png", label: "Built-in risk management" },
];

// Short set for 15s demo section
const SEGMENTS_SHORT: Segment[] = [
  { type: "video", videoStart: 0, label: "Compliance dashboard" },
  { type: "video", videoStart: 28, label: "Step-by-step guidance" },
];

const SEGMENT_SETS = {
  full: SEGMENTS_FULL,
  medium: SEGMENTS_MEDIUM,
  short: SEGMENTS_SHORT,
} as const;

const VIDEO_SRC = "screenrecordings/nis2-cropped.mp4";
const SOURCE_FPS = 60;

// ─── Component ───

export function AppDemoScene({
  variant = "full",
}: {
  variant?: "full" | "medium" | "short";
}) {
  const { durationInFrames } = useVideoConfig();

  const segments = SEGMENT_SETS[variant];
  const perSegment = Math.floor(durationInFrames / segments.length);

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }}>
      {segments.map((seg, i) => (
        <Sequence
          key={i}
          from={i * perSegment}
          durationInFrames={i === segments.length - 1 ? durationInFrames - i * perSegment : perSegment}
        >
          <DemoSegment
            segment={seg}
            labelDelay={seg.labelDelay ?? 0.2}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}

// ─── Single segment: video or screenshot + overlay label ───

function DemoSegment({
  segment,
  labelDelay,
}: {
  segment: Segment;
  labelDelay: number;
}) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const isPortrait = height > width;
  const mediaWidth = isPortrait ? width * 0.92 : width * 0.82;
  const mediaHeight = mediaWidth / 1.76;

  // Subtle scale-in on segment entry
  const enter = spring({
    frame,
    fps,
    config: { damping: 30, stiffness: 120 },
  });
  const scale = interpolate(enter, [0, 1], [1.03, 1]);

  // Label animation
  const labelEnter = spring({
    frame,
    fps,
    delay: Math.round(labelDelay * fps),
    config: { damping: 18, stiffness: 160 },
  });
  const labelY = interpolate(labelEnter, [0, 1], [15, 0]);

  const base = Math.min(width, height);
  const labelSize = Math.round(base * 0.028);
  const borderRadius = Math.round(mediaWidth * 0.01);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#0a0a0a",
      }}
    >
      {/* Media frame */}
      <div
        style={{
          width: mediaWidth,
          maxWidth: "95%",
          borderRadius,
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          transform: `scale(${scale})`,
          opacity: enter,
        }}
      >
        <div style={{ height: mediaHeight }}>
          {segment.type === "video" ? (
            <OffthreadVideo
              src={staticFile(VIDEO_SRC)}
              trimBefore={Math.round(segment.videoStart * SOURCE_FPS)}
              muted
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            />
          ) : (
            <Img
              src={staticFile(segment.src)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            />
          )}
        </div>
      </div>

      {/* Overlay label */}
      <div
        style={{
          position: "absolute",
          bottom: isPortrait ? height * 0.08 : height * 0.06,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          zIndex: 10,
        }}
      >
        <div
          style={{
            background: "rgba(15,23,42,0.9)",
            backdropFilter: "blur(8px)",
            color: BRAND.white,
            fontSize: labelSize,
            fontWeight: 700,
            fontFamily: "Inter, system-ui, sans-serif",
            padding: `${Math.round(labelSize * 0.45)}px ${Math.round(labelSize * 1.2)}px`,
            borderRadius: Math.round(labelSize * 0.35),
            opacity: labelEnter,
            transform: `translateY(${labelY}px)`,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {segment.label}
        </div>
      </div>
    </AbsoluteFill>
  );
}
