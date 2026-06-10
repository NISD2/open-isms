import { AbsoluteFill, Img, OffthreadVideo, staticFile } from "remotion";
import { BRAND } from "../lib/colors";

// ─── Adjust to pick the best frame ────────────────────────────────────────────
// Scrub in Remotion Studio to find a good moment (someone making a point, etc.)
// frame = seconds × 30
const THUMBNAIL_FRAME = 30 * 65;

// Episode metadata — update per episode
const EP_NUMBER = 1;
const EP_DATE = "March 5, 2026";
const EP_TOPIC = "Risk Management,\nContent Strategy\n& Partnership";

export const SitdownThumbnail: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: "#08111f",
        fontFamily:
          "system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* ─── Radial glow behind text ─── */}
      <div
        style={{
          position: "absolute",
          left: -80,
          top: "50%",
          transform: "translateY(-50%)",
          width: 640,
          height: 640,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${BRAND.accent}1a 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* ─── Video frame — right side ─── */}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          width: "60%",
          height: "100%",
          overflow: "hidden",
        }}
      >
        <OffthreadVideo
          src={staticFile("NISD2-Episode-1.mp4")}
          trimBefore={THUMBNAIL_FRAME}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center center",
          }}
        />
      </div>

      {/* ─── Gradient: dark left → transparent right ─── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to right, #08111f 34%, #08111fdd 50%, #08111f88 60%, transparent 74%)",
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
          height: "22%",
          background: "linear-gradient(to top, #08111fcc 0%, transparent 100%)",
          pointerEvents: "none",
        }}
      />

      {/* ─── Top accent bar ─── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 5,
          background: `linear-gradient(to right, ${BRAND.accent}, ${BRAND.accentLight} 40%, transparent 70%)`,
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
            maxWidth: 490,
          }}
        >
          {/* Eyebrow — episode + date */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                background: BRAND.accent,
                color: "#fff",
                fontSize: 14,
                fontWeight: 800,
                letterSpacing: 3,
                textTransform: "uppercase",
                padding: "4px 12px",
                borderRadius: 4,
              }}
            >
              EP. {EP_NUMBER}
            </div>
            <div
              style={{
                color: BRAND.gray,
                fontSize: 15,
                fontWeight: 500,
                letterSpacing: 1,
              }}
            >
              {EP_DATE}
            </div>
          </div>

          {/* "Sitdown" — main title */}
          <div
            style={{
              color: BRAND.accentLight,
              fontSize: 106,
              fontWeight: 900,
              lineHeight: 0.9,
              letterSpacing: -4,
              textShadow: `0 0 50px ${BRAND.accent}55`,
            }}
          >
            Daily Meeting
          </div>

          {/* Divider */}
          <div
            style={{
              width: 56,
              height: 3,
              background: BRAND.accent,
              borderRadius: 2,
              marginTop: 20,
              marginBottom: 16,
              opacity: 0.65,
            }}
          />

          {/* Topic lines */}
          <div
            style={{
              color: "rgba(255,255,255,0.75)",
              fontSize: 20,
              fontWeight: 500,
              letterSpacing: 0.2,
              lineHeight: 1.5,
              whiteSpace: "pre-line",
            }}
          >
            {EP_TOPIC}
          </div>
        </div>
      </AbsoluteFill>

      {/* ─── Logo — bottom left ─── */}
      <div
        style={{
          position: "absolute",
          bottom: 28,
          left: 62,
          opacity: 0.5,
        }}
      >
        <Img
          src={staticFile("logo.png")}
          style={{ height: 26, width: "auto" }}
        />
      </div>
    </AbsoluteFill>
  );
};
