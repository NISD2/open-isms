import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";
import { CaptionOverlay } from "../components/CaptionOverlay";

// 42.88s source @ 23.98fps, rendered at 30fps → 1287 frames
export const ScotchSoda: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* ─── 16:9 source cropped to 9:16 — centred horizontally and vertically ─── */}
      <OffthreadVideo
        src={staticFile("shorts/scotch-soda.mp4")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "50% 50%",
        }}
      />

      {/* ─── Captions only — raised above platform UI ─── */}
      <CaptionOverlay captionsFile="captions-scotch-soda.json" bottomPadding={240} />
    </AbsoluteFill>
  );
};
