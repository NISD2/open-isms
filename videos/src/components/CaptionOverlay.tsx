import { useCallback, useEffect, useMemo, useState } from "react";
import { createTikTokStyleCaptions } from "@remotion/captions";
import type { Caption, TikTokPage } from "@remotion/captions";
import {
  AbsoluteFill,
  Sequence,
  staticFile,
  useCurrentFrame,
  useDelayRender,
  useVideoConfig,
} from "remotion";
import { BRAND } from "../lib/colors";

const SWITCH_EVERY_MS = 1400;
const HIGHLIGHT_COLOR = BRAND.accentLight;

const CaptionPage: React.FC<{ page: TikTokPage }> = ({ page }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeMs = (frame / fps) * 1000;
  const absoluteTimeMs = page.startMs + currentTimeMs;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        padding: "16px 28px",
        background: "rgba(0, 0, 0, 0.65)",
        borderRadius: 10,
        maxWidth: "82%",
        backdropFilter: "blur(4px)",
      }}
    >
      {page.tokens.map((token) => {
        const isActive =
          token.fromMs <= absoluteTimeMs && token.toMs > absoluteTimeMs;
        return (
          <span
            key={token.fromMs}
            style={{
              color: isActive ? HIGHLIGHT_COLOR : "white",
              fontSize: 46,
              fontWeight: 700,
              whiteSpace: "pre",
              lineHeight: 1.3,
              textShadow: isActive
                ? `0 0 20px ${HIGHLIGHT_COLOR}66`
                : "0 2px 6px rgba(0,0,0,0.9)",
              transition: "color 0.05s",
            }}
          >
            {token.text}
          </span>
        );
      })}
    </div>
  );
};

interface CaptionOverlayProps {
  captionsFile?: string;
  /** ms offset into the source video where this composition starts (for clip extracts) */
  startOffsetMs?: number;
  /** ms offset where the clip ends — captions beyond this are excluded */
  endOffsetMs?: number;
  /** px from bottom edge — increase for shorts to clear platform UI (default 80) */
  bottomPadding?: number;
}

export const CaptionOverlay: React.FC<CaptionOverlayProps> = ({
  captionsFile = "captions-what-is-nis2.json",
  startOffsetMs = 0,
  endOffsetMs = Infinity,
  bottomPadding = 80,
}) => {
  const [captions, setCaptions] = useState<Caption[] | null>(null);
  const [missing, setMissing] = useState(false);
  const { fps } = useVideoConfig();
  const { delayRender, continueRender } = useDelayRender();
  const [handle] = useState(() => delayRender("Loading captions"));

  const fetchCaptions = useCallback(async () => {
    try {
      const response = await fetch(
        staticFile(captionsFile),
      );
      if (!response.ok) {
        setMissing(true);
        continueRender(handle);
        return;
      }
      const data = await response.json();
      setCaptions(data as Caption[]);
      continueRender(handle);
    } catch {
      setMissing(true);
      continueRender(handle);
    }
  }, [continueRender, handle, captionsFile]);

  useEffect(() => {
    fetchCaptions();
  }, [fetchCaptions]);

  const pages = useMemo(() => {
    if (!captions) return [];
    const clipped = captions.filter(
      (c) => c.endMs > startOffsetMs && c.startMs < endOffsetMs,
    );
    const { pages: p } = createTikTokStyleCaptions({
      captions: clipped,
      combineTokensWithinMilliseconds: SWITCH_EVERY_MS,
    });
    return p;
  }, [captions, startOffsetMs, endOffsetMs]);

  if (missing || !captions) return null;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: bottomPadding,
        pointerEvents: "none",
      }}
    >
      {pages.map((page, index) => {
        const nextPage = pages[index + 1] ?? null;
        // Subtract the clip start offset so frame 0 = start of clip
        const startFrame = ((page.startMs - startOffsetMs) / 1000) * fps;
        const endFrame = Math.min(
          nextPage
            ? ((nextPage.startMs - startOffsetMs) / 1000) * fps
            : Infinity,
          startFrame + (SWITCH_EVERY_MS / 1000) * fps,
        );
        const durationInFrames = Math.floor(endFrame - startFrame);
        if (durationInFrames <= 0) return null;
        return (
          <Sequence
            key={index}
            from={Math.floor(startFrame)}
            durationInFrames={durationInFrames}
            layout="none"
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                width: "100%",
              }}
            >
              <CaptionPage page={page} />
            </div>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
