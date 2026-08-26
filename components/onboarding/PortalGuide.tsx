"use client";

import { useEffect, useState } from "react";
import { CircleQuestionMark } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import type { Hint } from "@/lib/onboarding/hints";
import { usePortalPath } from "@/components/portal/use-portal-path";
import { HelpDialog } from "./HelpDialog";
import { TourOverlay } from "./tour/TourOverlay";
import { tourForPath, type TourStep } from "./tour/steps";

/** Drop steps whose target is not on this page before the tour starts. */
function presentSteps(steps: readonly TourStep[]): readonly TourStep[] {
  return steps.filter((step) =>
    document.querySelector(`[data-tour="${step.target}"]`),
  );
}

/**
 * Owns every guided surface in the portal: the question mark in the header,
 * the offer of help behind it, and the tour.
 *
 * One mount point, one piece of state. The pages being explained carry nothing
 * but `data-tour` attributes, so adding a tour to another screen never means
 * importing a hook into that screen's component.
 */
export function PortalGuide({
  hints,
  calLink,
}: {
  hints: Record<Hint, boolean>;
  /** Cal.com handle from CAL_LINK, "" where the instance sets no calendar. */
  calLink: string;
}) {
  const t = useTranslations("guide");
  const path = usePortalPath();
  const dismissHint = trpc.user.dismissHint.useMutation();

  // Seeded from the server-resolved hints and owned by the client from then
  // on. The portal layout does not remount between pages, so a dismissal
  // holds for the rest of the session without waiting on the round trip that
  // persists it.
  const [tourArmed, setTourArmed] = useState(hints.tour);
  const [helpAuto, setHelpAuto] = useState(hints.helpOffer);
  const [helpManual, setHelpManual] = useState(false);
  const [steps, setSteps] = useState<readonly TourStep[]>([]);
  const [index, setIndex] = useState(0);

  const routeSteps = tourForPath(path);

  // Re-resolve on every navigation: the tour follows the user across pages for
  // as long as it is armed, and the targets only exist once the page has
  // painted.
  useEffect(() => {
    if (!tourArmed || !routeSteps) {
      setSteps([]);
      return;
    }
    const frame = requestAnimationFrame(() => {
      setSteps(presentSteps(routeSteps));
      setIndex(0);
    });
    return () => cancelAnimationFrame(frame);
  }, [tourArmed, routeSteps, path]);

  // Plain functions: nothing downstream is memoised and none of these sit in a
  // dependency array, so useCallback would only add a list to keep in step.
  const dismiss = (hint: Hint) => dismissHint.mutate({ hint });

  const closeTour = () => {
    setTourArmed(false);
    setSteps([]);
    dismiss("tour");
  };

  const closeHelp = () => {
    if (helpAuto) dismiss("helpOffer");
    setHelpAuto(false);
    setHelpManual(false);
  };

  const startTour = () => {
    if (!routeSteps) return;
    // Leaving through the tour still counts as having met the offer of help,
    // otherwise the automatic one returns on the next page load.
    closeHelp();
    setSteps(presentSteps(routeSteps));
    setIndex(0);
  };

  const step = steps[index];

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={t("help.trigger")}
        title={t("help.trigger")}
        onClick={() => setHelpManual(true)}
      >
        <CircleQuestionMark className="size-4" />
      </Button>

      <HelpDialog
        open={helpAuto || helpManual}
        onOpenChange={(open) => !open && closeHelp()}
        calLink={calLink}
        permanent={helpAuto}
        onStartTour={routeSteps ? startTour : undefined}
      />

      {step && (
        <TourOverlay
          // Remount per step so the measurement effect reruns cleanly rather
          // than chasing a target that changed underneath it.
          key={step.target}
          step={step}
          index={index}
          total={steps.length}
          onNext={() => setIndex((current) => current + 1)}
          onClose={closeTour}
        />
      )}
    </>
  );
}
