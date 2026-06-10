import "./index.css";
import { Composition, Still } from "remotion";
import { Promo60 } from "./compositions/Promo60";
import { Promo30 } from "./compositions/Promo30";
import { Promo15 } from "./compositions/Promo15";
import { PromoDemo60 } from "./compositions/PromoDemo60";
import { PromoDemo30 } from "./compositions/PromoDemo30";
import { PromoDemo15 } from "./compositions/PromoDemo15";
import { WhatIsNIS2v2 } from "./compositions/WhatIsNIS2v2";
import { WhatIsNIS2v3 } from "./compositions/WhatIsNIS2v3";
import { WhatIsNIS2v3Thumbnail } from "./compositions/WhatIsNIS2v3Thumbnail";
import { IncidentReporting2 } from "./compositions/IncidentReporting2";
import { NIS2Short } from "./compositions/NIS2Short";
import type { NIS2ShortProps } from "./compositions/NIS2Short";
import { PersonallyLiable } from "./compositions/PersonallyLiable";
import { PersonallyLiableThumbnail } from "./compositions/PersonallyLiableThumbnail";
import { RawShort } from "./compositions/RawShort";
import type { RawShortProps } from "./compositions/RawShort";
import { MultiSegmentShort } from "./compositions/MultiSegmentShort";
import type { MultiSegmentShortProps } from "./compositions/MultiSegmentShort";
import { LongformYouTube } from "./compositions/LongformYouTube";
import type { LongformYouTubeProps } from "./compositions/LongformYouTube";
import { OutroCard } from "./compositions/OutroCard";
import { ScotchSoda } from "./compositions/ScotchSoda";
import { SitdownEpisode } from "./compositions/SitdownEpisode";
import type { SitdownEpisodeProps } from "./compositions/SitdownEpisode";
import { SitdownThumbnail } from "./compositions/SitdownThumbnail";
import { WhatIsNIS2Thumbnail } from "./compositions/WhatIsNIS2Thumbnail";
import { IncidentReportingThumbnail } from "./compositions/IncidentReportingThumbnail";
import {
  FPS,
  DIMENSIONS,
  SCENE_60,
  SCENE_30,
  SCENE_15,
  TRANSITION_FRAMES,
} from "./lib/timing";

function totalFrames(scenes: Record<string, number>, transitionCount: number) {
  const sum = Object.values(scenes).reduce((a, b) => a + b, 0);
  return sum - transitionCount * TRANSITION_FRAMES;
}

const DURATION_60 = totalFrames(SCENE_60, 5);
const DURATION_30 = totalFrames(SCENE_30, 4);
const DURATION_15 = totalFrames(SCENE_15, 2);

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* ─── Promo (text + screenshots, 16:9) ─── */}
      <Composition
        id="PromoVideo-60s"
        component={Promo60}
        durationInFrames={DURATION_60}
        fps={FPS}
        width={DIMENSIONS["16x9"].width}
        height={DIMENSIONS["16x9"].height}
      />
      <Composition
        id="PromoVideo-30s"
        component={Promo30}
        durationInFrames={DURATION_30}
        fps={FPS}
        width={DIMENSIONS["16x9"].width}
        height={DIMENSIONS["16x9"].height}
      />
      <Composition
        id="PromoVideo-15s"
        component={Promo15}
        durationInFrames={DURATION_15}
        fps={FPS}
        width={DIMENSIONS["16x9"].width}
        height={DIMENSIONS["16x9"].height}
      />
      {/* ─── App Demo (screen recording, 16:9) ─── */}
      <Composition
        id="AppDemo-60s"
        component={PromoDemo60}
        durationInFrames={1800}
        fps={FPS}
        width={DIMENSIONS["16x9"].width}
        height={DIMENSIONS["16x9"].height}
      />
      <Composition
        id="AppDemo-30s"
        component={PromoDemo30}
        durationInFrames={900}
        fps={FPS}
        width={DIMENSIONS["16x9"].width}
        height={DIMENSIONS["16x9"].height}
      />
      <Composition
        id="AppDemo-15s"
        component={PromoDemo15}
        durationInFrames={450}
        fps={FPS}
        width={DIMENSIONS["16x9"].width}
        height={DIMENSIONS["16x9"].height}
      />
      {/* ─── What is NIS2? — talking-head, 16:9 ─── */}
      <Composition
        id="WhatIsNIS2-YouTube"
        component={WhatIsNIS2v2}
        durationInFrames={11486}
        fps={FPS}
        width={DIMENSIONS["16x9"].width}
        height={DIMENSIONS["16x9"].height}
      />
      {/* Shorts — 9:16, cut from WhatIsNIS2 */}
      <Composition
        id="WhatIsNIS2-Short-AreYouAffected"
        component={NIS2Short}
        durationInFrames={3024}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={
          {
            videoSrc: "what-is-nis2-2.mp4",
            captionsFile: "captions-what-is-nis2-2.json",
            clipStartMs: 107900,
            clipEndMs: 208700,
            sectionTitle: "Are You Affected?",
            sectionSubtitle: "NIS2 Scope",
            stats: [
              {
                fromFrame: 1524,
                value: "50+",
                label: "employees\nor €10M revenue",
              },
            ],
          } satisfies NIS2ShortProps
        }
      />
      <Composition
        id="WhatIsNIS2-Short-WhatItRequires"
        component={NIS2Short}
        durationInFrames={2772}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={
          {
            videoSrc: "what-is-nis2-2.mp4",
            captionsFile: "captions-what-is-nis2-2.json",
            clipStartMs: 234400,
            clipEndMs: 326800,
            sectionTitle: "What It Actually Requires",
            sectionSubtitle: "NIS2 Obligations",
            stats: [
              { fromFrame: 110, value: "132", label: "NIS2\nrequirements" },
              { fromFrame: 200, value: "12", label: "compliance\ncategories" },
            ],
          } satisfies NIS2ShortProps
        }
      />
      <Composition
        id="WhatIsNIS2-Short-RegisterAndStart"
        component={NIS2Short}
        durationInFrames={1683}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={
          {
            videoSrc: "what-is-nis2-2.mp4",
            captionsFile: "captions-what-is-nis2-2.json",
            clipStartMs: 326800,
            clipEndMs: 382900,
            sectionTitle: "Register & Start Free",
            sectionSubtitle: "First Steps",
            stats: [],
          } satisfies NIS2ShortProps
        }
      />
      {/* ─── What is NIS2? v3 — gap-edited, 2:46, talking-head 16:9 ─── */}
      <Composition
        id="WhatIsNIS2v3-YouTube"
        component={WhatIsNIS2v3}
        durationInFrames={4987}
        fps={FPS}
        width={DIMENSIONS["16x9"].width}
        height={DIMENSIONS["16x9"].height}
      />
      {/* Shorts — 9:16, cut from WhatIsNIS2v3 */}
      {/* Short 1: What is NIS2 + 132 requirements (0s–65s → 0–1950ms) */}
      <Composition
        id="WhatIsNIS2v3-Short-WhatIsIt"
        component={NIS2Short}
        durationInFrames={1950}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={
          {
            videoSrc: "what-is-nis2-3.mp4",
            captionsFile: "captions-what-is-nis2-3.json",
            clipStartMs: 0,
            clipEndMs: 65000,
            sectionTitle: "What is NIS2?",
            sectionSubtitle: "The Law Explained",
            stats: [
              { fromFrame: 966, value: "132", label: "NIS2\nrequirements" },
            ],
          } satisfies NIS2ShortProps
        }
      />
      {/* Short 2: Are You Affected? scope + criteria (65s–128s) */}
      <Composition
        id="WhatIsNIS2v3-Short-AreYouAffected"
        component={NIS2Short}
        durationInFrames={1890}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={
          {
            videoSrc: "what-is-nis2-3.mp4",
            captionsFile: "captions-what-is-nis2-3.json",
            clipStartMs: 65000,
            clipEndMs: 128000,
            sectionTitle: "Are You Affected?",
            sectionSubtitle: "NIS2 Scope",
            stats: [
              {
                fromFrame: 855,
                value: "50+",
                label: "employees\nor €10M revenue",
              },
            ],
          } satisfies NIS2ShortProps
        }
      />
      {/* ─── Incident Reporting — talking-head, 16:9 ─── */}
      <Composition
        id="IncidentReporting-YouTube"
        component={IncidentReporting2}
        durationInFrames={10082}
        fps={FPS}
        width={DIMENSIONS["16x9"].width}
        height={DIMENSIONS["16x9"].height}
      />
      {/* Shorts — 9:16, cut from IncidentReporting */}
      <Composition
        id="IncidentReporting-Short-WhatIsAnIncident"
        component={NIS2Short}
        durationInFrames={1530}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={
          {
            videoSrc: "incident-reporting-2.mp4",
            captionsFile: "captions-incident-reporting-2.json",
            clipStartMs: 25000,
            clipEndMs: 76000,
            sectionTitle: "Significant Incidents",
            sectionSubtitle: "When to Report",
            stats: [],
          } satisfies NIS2ShortProps
        }
      />
      <Composition
        id="IncidentReporting-Short-24HourRule"
        component={NIS2Short}
        durationInFrames={2250}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={
          {
            videoSrc: "incident-reporting-2.mp4",
            captionsFile: "captions-incident-reporting-2.json",
            clipStartMs: 70000,
            clipEndMs: 145000,
            sectionTitle: "The 24-Hour Rule",
            sectionSubtitle: "Three Deadlines",
            stats: [
              { fromFrame: 185, value: "24h", label: "early warning\nto BSI" },
              {
                fromFrame: 1071,
                value: "72h",
                label: "full notification\nto BSI",
              },
              {
                fromFrame: 2010,
                value: "1 month",
                label: "final incident\nreport",
              },
            ],
          } satisfies NIS2ShortProps
        }
      />
      <Composition
        id="IncidentReporting-Short-BuildThePlan"
        component={NIS2Short}
        durationInFrames={1800}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={
          {
            videoSrc: "incident-reporting-2.mp4",
            captionsFile: "captions-incident-reporting-2.json",
            clipStartMs: 180000,
            clipEndMs: 240000,
            sectionTitle: "Why a Protocol?",
            sectionSubtitle: "The SOP Mindset",
            stats: [],
          } satisfies NIS2ShortProps
        }
      />
      <Composition
        id="IncidentReporting-Short-5Components"
        component={NIS2Short}
        durationInFrames={2550}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={
          {
            videoSrc: "incident-reporting-2.mp4",
            captionsFile: "captions-incident-reporting-2.json",
            clipStartMs: 230000,
            clipEndMs: 315000,
            sectionTitle: "5 IR Plan Components",
            sectionSubtitle: "What to Prepare",
            stats: [
              { fromFrame: 150, value: "5", label: "protocol\ncomponents" },
            ],
          } satisfies NIS2ShortProps
        }
      />
      {/* ─── Personal Liability — talking-head, 16:9 ─── */}
      <Composition
        id="PersonalLiability-YouTube"
        component={PersonallyLiable}
        durationInFrames={4049}
        fps={FPS}
        width={DIMENSIONS["16x9"].width}
        height={DIMENSIONS["16x9"].height}
      />
      {/* Shorts — 9:16, cut from PersonallyLiable */}
      {/* Short 1: GDPR vs NIS2 — the fine (0s – 87s) */}
      <Composition
        id="PersonalLiability-Short-TheFine"
        component={NIS2Short}
        durationInFrames={2610}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={
          {
            videoSrc: "personally-liable.mp4",
            captionsFile: "captions-personally-liable.json",
            clipStartMs: 0,
            clipEndMs: 87000,
            sectionTitle: "Personal Liability",
            sectionSubtitle: "NIS2 vs GDPR",
            stats: [
              {
                fromFrame: 1543,
                value: "€10M",
                label: "or 2% of\nglobal turnover",
              },
            ],
          } satisfies NIS2ShortProps
        }
      />
      {/* Short 3: No Corporate Shield — GDPR vs NIS2 personal liability (8s – 53s) */}
      <Composition
        id="PersonalLiability-Short-NoCorporateShield"
        component={NIS2Short}
        durationInFrames={1350} // (53000 - 8000) / 1000 * 30
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={
          {
            videoSrc: "personally-liable.mp4",
            captionsFile: "captions-personally-liable.json",
            clipStartMs: 8000,
            clipEndMs: 53000,
            sectionTitle: "No Corporate Shield",
            sectionSubtitle: "NIS2 vs GDPR",
            stats: [
              // "10 million euros" → absolute frame 1543, relative to clip start (8000ms): (51440-8000)/1000*30 = 1303
              {
                fromFrame: 1303,
                value: "€10M",
                label: "personal fine\nor 2% revenue",
              },
            ],
          } satisfies NIS2ShortProps
        }
      />
      {/* Short 2: CEO training + sign-off obligation (82s – 135s) */}
      <Composition
        id="PersonalLiability-Short-CEOObligations"
        component={NIS2Short}
        durationInFrames={1590}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={
          {
            videoSrc: "personally-liable.mp4",
            captionsFile: "captions-personally-liable.json",
            clipStartMs: 82000,
            clipEndMs: 135000,
            sectionTitle: "CEO Obligations",
            sectionSubtitle: "What You Must Do",
            stats: [],
          } satisfies NIS2ShortProps
        }
      />
      {/* ─── Standup 06-03 — daily meeting shorts ─── */}
      {/* Clips calibrated from captions-standup-06-03.json */}
      {/* Clip 1: Intro — "we think we got him" + letters + proof of concept (0s–55s) */}
      <Composition
        id="Standup-06-03-Clip1"
        component={RawShort}
        durationInFrames={1650}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={
          {
            videoSrc: "standup-06-03.mp4",
            captionsFile: "captions-standup-06-03.json",
            clipStartMs: 0,
            clipEndMs: 55000,
          } satisfies RawShortProps
        }
      />
      {/* Clip 2: "3 weeks, nobody can do this" (1:14–1:41 → 74720ms–100940ms) */}
      <Composition
        id="Standup-06-03-Clip2"
        component={RawShort}
        durationInFrames={780} // (100940-74720)/1000*30
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={
          {
            videoSrc: "standup-06-03.mp4",
            captionsFile: "captions-standup-06-03.json",
            clipStartMs: 74720,
            clipEndMs: 100740,
          } satisfies RawShortProps
        }
      />
      {/* Clip 2b: "one coffee and all over the walls" (1:40–1:46 → 99040ms–106000ms) */}
      <Composition
        id="Standup-06-03-Clip2b-Coffee"
        component={RawShort}
        durationInFrames={179} // (106000-99040)/1000*30
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={
          {
            videoSrc: "standup-06-03.mp4",
            captionsFile: "captions-standup-06-03.json",
            clipStartMs: 100040,
            clipEndMs: 106000,
          } satisfies RawShortProps
        }
      />

      {/* Clip 3: Follow-up call script (1:46–2:08 → 104890ms–126170ms) */}
      <Composition
        id="Standup-06-03-Clip3"
        component={RawShort}
        durationInFrames={638}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={
          {
            videoSrc: "standup-06-03.mp4",
            captionsFile: "captions-standup-06-03.json",
            clipStartMs: 104890,
            clipEndMs: 126170,
          } satisfies RawShortProps
        }
      />
      {/* Clip 4: "Give it for free, throw GRC companies under the bus" (2:08–end → 126170ms–172480ms) */}
      <Composition
        id="Standup-06-03-Clip4"
        component={RawShort}
        durationInFrames={1389}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={
          {
            videoSrc: "standup-06-03.mp4",
            captionsFile: "captions-standup-06-03.json",
            clipStartMs: 126170,
            clipEndMs: 172480,
          } satisfies RawShortProps
        }
      />
      {/* ─── Scotch & Soda — banter short ─── */}
      <Composition
        id="ScotchSoda-Short"
        component={ScotchSoda}
        durationInFrames={1287}
        fps={FPS}
        width={1080}
        height={1920}
      />
      {/* ─── Sitdown Podcast — Episode 1 (Mar 5, 2026) ─── */}
      {/* Frames calibrated from captions-sitdown-ep1.json via phrase-finder */}
      <Composition
        id="Sitdown-Ep1-YouTube"
        component={SitdownEpisode}
        durationInFrames={24400} // 24,371 actual last frame + small buffer
        fps={FPS}
        width={DIMENSIONS["16x9"].width}
        height={DIMENSIONS["16x9"].height}
        defaultProps={
          {
            videoSrc: "NISD2-Episode-1.mp4",
            captionsFile: "captions-sitdown-ep1.json",
            episodeNumber: 1,
            episodeDate: "March 5, 2026",
            sections: [
              // "risk management thing" → frame 1332
              { from: 1302, title: "Dev Update", subtitle: "Risk × Assets" },
              // "initial prototype" → frame 3887 (forms getting convoluted)
              {
                from: 3857,
                title: "Forms vs Simplicity",
                subtitle: "Keep It Simple",
              },
              // "way better" → frame 6046 (video feedback)
              {
                from: 6016,
                title: "Video Feedback",
                subtitle: "Content Growth",
              },
              // "cards" → frame 8632 (business cards topic)
              {
                from: 8602,
                title: "Business Cards",
                subtitle: "Beautiful Garbage",
              },
              // "linkedin" → frame 13358 (channel setup)
              {
                from: 13328,
                title: "YouTube + LinkedIn",
                subtitle: "Channel Setup",
              },
              // "partner" → frame 20245 (partnership program)
              {
                from: 20215,
                title: "Partnership Program",
                subtitle: "20% Commission",
              },
            ],
            stats: [
              // "20%" → frame 20356
              { from: 20356, value: "20%", label: "commission\non sales" },
            ],
          } satisfies SitdownEpisodeProps
        }
      />
      {/* Sitdown Ep1 — Shorts (9:16) */}
      {/* Short 1: Risk × Assets explanation (frame 1930–4443 → ms 64330–148090) */}
      <Composition
        id="Sitdown-Ep1-Short-RiskAssets"
        component={NIS2Short}
        durationInFrames={2554} // (148090 - 64330) / 1000 * 30
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={
          {
            videoSrc: "NISD2-Episode-1.mp4",
            captionsFile: "captions-sitdown-ep1.json",
            clipStartMs: 64330,
            clipEndMs: 148090,
            sectionTitle: "Risk × Assets",
            sectionSubtitle: "How NIS2 Risk Works",
            stats: [],
          } satisfies NIS2ShortProps
        }
      />
      {/* Short 2: Partnership 20% commission (frame 20245–22003 → ms 674830–733440) */}
      <Composition
        id="Sitdown-Ep1-Short-Partnership"
        component={NIS2Short}
        durationInFrames={1758} // (733440 - 674830) / 1000 * 30
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={
          {
            videoSrc: "NISD2-Episode-1.mp4",
            captionsFile: "captions-sitdown-ep1.json",
            clipStartMs: 674830,
            clipEndMs: 733440,
            sectionTitle: "Partnership Program",
            sectionSubtitle: "20% Commission",
            stats: [
              {
                fromFrame: 330,
                value: "20%",
                label: "commission\non every sale",
              },
            ],
          } satisfies NIS2ShortProps
        }
      />
      {/* ─── Outro card — logo reveal for appending to videos ─── */}
      <Composition
        id="OutroCard"
        component={OutroCard}
        durationInFrames={90}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="OutroCard-16x9"
        component={OutroCard}
        durationInFrames={90}
        fps={FPS}
        width={DIMENSIONS["16x9"].width}
        height={DIMENSIONS["16x9"].height}
      />
      {/* ─── Thumbnails ─── */}
      <Still
        id="PersonalLiability-Thumbnail"
        component={PersonallyLiableThumbnail}
        width={1280}
        height={720}
      />
      <Still
        id="WhatIsNIS2-Thumbnail"
        component={WhatIsNIS2Thumbnail}
        width={1280}
        height={720}
      />
      <Still
        id="Sitdown-Ep1-Thumbnail"
        component={SitdownThumbnail}
        width={1280}
        height={720}
      />
      <Still
        id="WhatIsNIS2v3-Thumbnail"
        component={WhatIsNIS2v3Thumbnail}
        width={1280}
        height={720}
      />
      {/* ─── Pipeline: dynamic compositions for automated rendering ─── */}
      {/* PipelineClip — single segment (legacy, kept for static compositions) */}
      <Composition
        id="PipelineClip"
        component={RawShort}
        calculateMetadata={({ props }) => ({
          durationInFrames: Math.round(((props.clipEndMs - props.clipStartMs) / 1000) * FPS),
        })}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={
          {
            videoSrc: "",
            captionsFile: "",
            clipStartMs: 0,
            clipEndMs: 30000,
          } satisfies RawShortProps
        }
      />
      {/* PipelineMultiClip — multi-segment, used by server/jobs/render.ts */}
      <Composition
        id="PipelineMultiClip"
        component={MultiSegmentShort}
        calculateMetadata={({ props }) => ({
          durationInFrames: Math.round(
            props.segments.reduce((acc, s) => acc + (s.endMs - s.startMs), 0) / 1000 * FPS
          ) + 90, // +90 frames for OutroCard
        })}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={
          {
            videoSrc: "",
            captionsFile: "",
            segments: [{ startMs: 0, endMs: 30000 }],
          } satisfies MultiSegmentShortProps
        }
      />
      {/* PipelineLongform — 16:9 longform YouTube with section overlays + captions */}
      <Composition
        id="PipelineLongform"
        component={LongformYouTube}
        calculateMetadata={({ props }) => ({
          durationInFrames: Math.round((props.durationMs / 1000) * FPS),
        })}
        fps={FPS}
        width={DIMENSIONS["16x9"].width}
        height={DIMENSIONS["16x9"].height}
        defaultProps={
          {
            videoSrc: "",
            captionsFile: "",
            sections: [],
            durationMs: 300000,
          } satisfies LongformYouTubeProps
        }
      />
      {/* ─── Meme stills ─── */}
      {/* "one coffee and you're all over the walls" — Simon, 06-03 standup */}

      <Still
        id="IncidentReporting-Thumbnail"
        component={IncidentReportingThumbnail}
        width={1280}
        height={720}
      />
    </>
  );
};
