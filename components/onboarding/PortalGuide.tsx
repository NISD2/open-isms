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
 * How long to keep waiting for a walkthrough's page to render before giving
 * up on it. Long, deliberately: waiting costs nothing, and being impatient
 * costs the walkthrough, which is the one thing this component exists to do.
 */
const TARGET_WAIT_MS = 15_000;

/** Shared so "no tour here" is the same value every time and React bails out. */
const NO_STEPS: readonly TourStep[] = [];

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
  supportEmail,
}: {
  hints: Record<Hint, boolean>;
  /** Cal.com handle from CAL_LINK, "" where the instance sets no calendar. */
  calLink: string;
  /** Direct line from IN_APP_SUPPORT_EMAIL, "" where the instance offers none. */
  supportEmail: string;
}) {
  const t = useTranslations("guide");
  const path = usePortalPath();
  const dismissHint = trpc.user.dismissHint.useMutation();

  // What this session has dismissed, per surface, so skipping one leaves the
  // others still to come. Only the dismissals are held here: the portal layout
  // does not remount between pages, so a dismissal has to hold for the rest of
  // the session without waiting on the round trip that persists it.
  //
  // Whether a surface is armed is derived from the prop rather than copied
  // into state beside it. Copying froze it at whatever the first render of
  // this layout saw, so re-arming a surface could not reach the component at
  // all until the whole document was reloaded by hand.
  const [dismissed, setDismissed] = useState<Record<Hint, boolean>>({
    journeyTour: false,
    requirementTour: false,
    helpOffer: false,
  });
  const [helpManual, setHelpManual] = useState(false);
  const [steps, setSteps] = useState<readonly TourStep[]>(NO_STEPS);
  const [index, setIndex] = useState(0);

  const helpAuto = hints.helpOffer && !dismissed.helpOffer;

  const routeTour = tourForPath(path);
  const routeArmed = routeTour
    ? hints[routeTour.hint] && !dismissed[routeTour.hint]
    : false;

  // Re-resolve on every navigation. Each route asks whether ITS walkthrough is
  // still armed, so walking the journey and then opening a requirement starts
  // the second one, and skipping the journey does not cancel it.
  useEffect(() => {
    if (!routeTour || !routeArmed) {
      setSteps(NO_STEPS);
      return;
    }

    // The page being explained is not necessarily in the DOM yet. This header
    // lives in the portal layout, which hydrates as soon as the shell arrives,
    // while a route with a loading.tsx is still showing its skeleton. Sampling
    // once and keeping whatever happened to be present lost the walkthrough on
    // exactly those loads: the anchor was missing, the step list came back
    // empty, and nothing was left to re-run the check. That is the reload-it-
    // three-times bug.
    //
    // So wait for the opening step's target instead. Every tour opens on
    // something its route always renders (see TourSteps), so that element
    // arriving is the signal that the page is here. The rest of it landed in
    // the same commit, and presentSteps then drops only the sections that
    // genuinely do not apply to this requirement.
    const anchor = routeTour.steps[0].target;
    const start = () => {
      if (!document.querySelector(`[data-tour="${anchor}"]`)) return false;
      setSteps(presentSteps(routeTour.steps));
      setIndex(0);
      return true;
    };
    if (start()) return;

    const observer = new MutationObserver(() => {
      if (start()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    const giveUp = setTimeout(() => observer.disconnect(), TARGET_WAIT_MS);
    return () => {
      observer.disconnect();
      clearTimeout(giveUp);
    };
  }, [routeArmed, routeTour, path]);

  // Plain functions: nothing downstream is memoised and none of these sit in a
  // dependency array, so useCallback would only add a list to keep in step.
  const dismiss = (hint: Hint) => dismissHint.mutate({ hint });

  const closeTour = () => {
    if (!routeTour) return;
    setDismissed((current) => ({ ...current, [routeTour.hint]: true }));
    setSteps(NO_STEPS);
    dismiss(routeTour.hint);
  };

  const closeHelp = () => {
    // Only the automatic offer is a one-time surface worth stamping. Closing
    // one the user opened from the header themselves records nothing.
    if (helpAuto) dismiss("helpOffer");
    setDismissed((current) => ({ ...current, helpOffer: true }));
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
        supportEmail={supportEmail}
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
