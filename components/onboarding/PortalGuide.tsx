"use client";

import { useEffect, useState } from "react";
import { CircleQuestionMark } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import type { Hint } from "@/lib/onboarding/hints";

type TourHint = RouteTour["hint"];
import { usePortalPath } from "@/components/portal/use-portal-path";
import { HelpDialog } from "./HelpDialog";
import { TourOverlay } from "./tour/TourOverlay";
import { tourForPath, type RouteTour, type TourStep } from "./tour/steps";

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
  // Per-walkthrough, so dismissing one leaves the other still to come.
  const [armed, setArmed] = useState<Record<TourHint, boolean>>({
    journeyTour: hints.journeyTour,
    requirementTour: hints.requirementTour,
  });
  const [helpAuto, setHelpAuto] = useState(hints.helpOffer);
  const [helpManual, setHelpManual] = useState(false);
  const [steps, setSteps] = useState<readonly TourStep[]>([]);
  const [index, setIndex] = useState(0);

  const routeTour = tourForPath(path);
  const routeArmed = routeTour ? armed[routeTour.hint] : false;

  // Re-resolve on every navigation. Each route asks whether ITS walkthrough is
  // still armed, so walking the journey and then opening a requirement starts
  // the second one, and skipping the journey does not cancel it.
  useEffect(() => {
    if (!routeTour || !routeArmed) {
      setSteps([]);
      return;
    }
    const frame = requestAnimationFrame(() => {
      setSteps(presentSteps(routeTour.steps));
      setIndex(0);
    });
    return () => cancelAnimationFrame(frame);
  }, [routeArmed, routeTour, path]);

  // Plain functions: nothing downstream is memoised and none of these sit in a
  // dependency array, so useCallback would only add a list to keep in step.
  const dismiss = (hint: Hint) => dismissHint.mutate({ hint });

  const closeTour = () => {
    if (!routeTour) return;
    setArmed((current) => ({ ...current, [routeTour.hint]: false }));
    setSteps([]);
    dismiss(routeTour.hint);
  };

  const closeHelp = () => {
    if (helpAuto) dismiss("helpOffer");
    setHelpAuto(false);
    setHelpManual(false);
  };

  const startTour = () => {
    if (!routeTour) return;
    // Leaving through the tour still counts as having met the offer of help,
    // otherwise the automatic one returns on the next page load.
    closeHelp();
    setSteps(presentSteps(routeTour.steps));
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
        onStartTour={routeTour ? startTour : undefined}
      />

      {step && (
        <TourOverlay
          // Remount per step so the measurement effect reruns cleanly rather
          // than chasing a target that changed underneath it. Keyed on the
          // step key, not the target: an establishing step has no target.
          key={step.key}
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
