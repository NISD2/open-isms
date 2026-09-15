"use client";

import { CircleQuestionMark } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { usePortalPath } from "@/components/portal/use-portal-path";
import { Button } from "@/components/ui/button";
import type { Hint } from "@/lib/onboarding/hints";
import { trpc } from "@/lib/trpc/client";
import { HelpDialog } from "./HelpDialog";
import { type RouteTour, type TourStep, toursForPath } from "./tour/steps";
import { TourOverlay } from "./tour/TourOverlay";

/** Drop steps whose target is not on this page before the tour starts. */
function presentSteps(steps: readonly TourStep[]): readonly TourStep[] {
  return steps.filter((step) => document.querySelector(`[data-tour="${step.target}"]`));
}

/**
 * How long to keep waiting for a walkthrough's page to render before giving
 * up on it. Long, deliberately: waiting costs nothing, and being impatient
 * costs the walkthrough, which is the one thing this component exists to do.
 *
 * A minute rather than fifteen seconds because the journey now withholds its
 * anchor until the mode question is answered, and the wait has to cover a
 * person reading two options and deciding, not just a route rendering.
 */
const TARGET_WAIT_MS = 60_000;

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
  /** Support address from SUPPORT_EMAIL, "" where the instance sets none. */
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
    journeyTourGuided: false,
    journeyTourTeam: false,
    requirementTour: false,
    helpOffer: false,
  });
  const [helpManual, setHelpManual] = useState(false);
  const [steps, setSteps] = useState<readonly TourStep[]>(NO_STEPS);
  const [index, setIndex] = useState(0);
  // Which candidate actually started, so dismissal stamps the right hint.
  const [routeTour, setRouteTour] = useState<RouteTour | null>(null);

  const helpAuto = hints.helpOffer && !dismissed.helpOffer;
  const helpOpen = helpAuto || helpManual;

  // Still-armed candidates for this route. The journey offers two, one per
  // layout, and the anchor present on the page picks between them. Memoised
  // because it is an effect dependency: a fresh array each render restarts the
  // walkthrough at step one on every keystroke of state.
  const candidates = useMemo(
    () => toursForPath(path).filter((tour) => hints[tour.hint] && !dismissed[tour.hint]),
    [path, hints, dismissed],
  );

  // Re-resolve on every navigation. Each route asks whether ITS walkthrough is
  // still armed, so walking the journey and then opening a requirement starts
  // the second one, and skipping the journey does not cancel it.
  //
  // biome-ignore lint/correctness/useExhaustiveDependencies: path is deliberate. toursForPath returns module constants, so moving between two requirement pages leaves the candidate list identical and the walkthrough would never re-resolve for the page actually on screen.
  useEffect(() => {
    // Hold back while the offer of help is up. The journey walkthroughs are no
    // longer gated to the first login (a user meets the second layout whenever
    // they switch), so this is what keeps a spotlight from opening behind that
    // dialog. It re-runs when the dialog closes, so nothing is lost.
    if (candidates.length === 0 || helpOpen) {
      setSteps(NO_STEPS);
      setRouteTour(null);
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
    // So wait for a candidate's opening target instead. Every tour opens on
    // something its layout always renders (see TourSteps), so that element
    // arriving is both the signal that the page is here and the answer to
    // which of two layouts it is. presentSteps then drops only the sections
    // that genuinely do not apply.
    const start = () => {
      const match = candidates.find((tour) =>
        document.querySelector(`[data-tour="${tour.steps[0].target}"]`),
      );
      if (!match) return false;
      setRouteTour(match);
      setSteps(presentSteps(match.steps));
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
  }, [candidates, helpOpen, path]);

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
    // Replay whichever layout is on screen, falling back to the route's first
    // candidate: the help trigger is deliberately replayable, so an already
    // dismissed walkthrough is a legitimate thing to ask for here.
    const routeTours = toursForPath(path);
    const match =
      routeTours.find((tour) =>
        document.querySelector(`[data-tour="${tour.steps[0].target}"]`),
      ) ?? routeTours[0];
    if (!match) return;
    // Leaving through the tour still counts as having met the offer of help,
    // otherwise the automatic one returns on the next page load.
    closeHelp();
    setRouteTour(match);
    setSteps(presentSteps(match.steps));
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
        onStartTour={toursForPath(path).length > 0 ? startTour : undefined}
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
