import { Suspense } from "react";
import { PitchSlideScreen } from "@/components/pitch/PitchSlideScreen";

// Skip static rendering during `next build` to avoid Coolify-build OOM in
// worker-thread page generation. Cheap to render on demand.
export const dynamic = "force-dynamic";

const PITCH_STATS = {
  users: 173,
  courseStarts: 77,
  courseCompletions: 0,
};

export default async function PitchPreviewPage() {
  return (
    <Suspense>
      <PitchSlideScreen liveStats={PITCH_STATS} />
    </Suspense>
  );
}
