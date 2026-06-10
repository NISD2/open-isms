import { AbsoluteFill, Img, OffthreadVideo, staticFile } from "remotion";
import { BRAND } from "../lib/colors";

// ─── Adjust this to pick the best frame of Cory's face ───────────────────────
// In Remotion Studio: scrub this value to preview different moments.
// 30fps × seconds. e.g. 30 * 20 = frame at the 20s mark.
const THUMBNAIL_FRAME = 30 * 15;

// Urgency orange — differentiates this thumbnail from the blue "What is NIS2?" one
const URGENT = "#f97316";
const URGENT_GLOW = "#f9731644";

export const IncidentReportingThumbnail: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: "#08111f",
        fontFamily:
          "system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* ─── Subtle radial glow behind text area — orange tint ─── */}
      <div
        style={{
          position: "absolute",
          left: -120,
          top: "50%",
          transform: "translateY(-50%)",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${URGENT_GLOW} 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* ─── Video frame — right side ─── */}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          width: "62%",
          height: "100%",
          overflow: "hidden",
        }}
      >
        <OffthreadVideo
          src={staticFile("incident-reporting-2.mp4")}
          trimBefore={THUMBNAIL_FRAME}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center top",
          }}
        />
      </div>

      {/* ─── Gradient: dark left → transparent right ─── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to right, #08111f 36%, #08111fdd 52%, #08111f88 62%, transparent 75%)",
          pointerEvents: "none",
        }}
      />

      {/* ─── Bottom vignette ─── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "25%",
          background:
            "linear-gradient(to top, #08111fcc 0%, transparent 100%)",
          pointerEvents: "none",
        }}
      />

      {/* ─── Top accent bar — orange for urgency ─── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 5,
          background: `linear-gradient(to right, ${URGENT}, ${BRAND.accent} 40%, transparent 70%)`,
        }}
      />

      {/* ─── Main text ─── */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "flex-start",
          paddingLeft: 62,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 0,
            maxWidth: 530,
          }}
        >
          {/* Eyebrow label */}
          <div
            style={{
              color: URGENT,
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: 5,
              textTransform: "uppercase",
              marginBottom: 18,
              opacity: 0.9,
            }}
          >
            NIS2 · Article 23
          </div>

          {/* "You Have" */}
          <div
            style={{
              color: "rgba(255, 255, 255, 0.93)",
              fontSize: 88,
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: -2,
            }}
          >
            You Have
          </div>

          {/* "72 Hours." — dominant, urgent orange */}
          <div
            style={{
              color: URGENT,
              fontSize: 136,
              fontWeight: 900,
              lineHeight: 0.88,
              letterSpacing: -5,
              textShadow: `0 0 60px ${URGENT_GLOW}`,
            }}
          >
            24 Hours.
          </div>

          {/* Divider */}
          <div
            style={{
              width: 60,
              height: 3,
              background: URGENT,
              borderRadius: 2,
              marginTop: 24,
              marginBottom: 18,
              opacity: 0.7,
            }}
          />

          {/* Sub-line */}
          <div
            style={{
              color: BRAND.gray,
              fontSize: 22,
              fontWeight: 500,
              letterSpacing: 0.3,
              lineHeight: 1.4,
            }}
          >
            Is your incident response ready?
          </div>
        </div>
      </AbsoluteFill>

      {/* ─── Logo — bottom left ─── */}
      <div
        style={{
          position: "absolute",
          bottom: 28,
          left: 62,
          opacity: 0.55,
        }}
      >
        <Img
          src={staticFile("logo.png")}
          style={{ height: 28, width: "auto" }}
        />
      </div>
    </AbsoluteFill>
  );
};
