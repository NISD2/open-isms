"use client";

import { useSearchParams } from "next/navigation";
import { renderSlide, type PitchStats } from "./PitchDeckViewer";

export function PitchSlideScreen({ liveStats }: { liveStats?: PitchStats }) {
  const params = useSearchParams();
  const index = Math.min(10, Math.max(0, parseInt(params.get("s") ?? "0")));
  const locale = params.get("l") === "de" ? ("de" as const) : ("en" as const);

  return (
    <div style={{ width: 896, height: 504, overflow: "hidden" }}>
      {renderSlide(index, locale, liveStats)}
    </div>
  );
}
