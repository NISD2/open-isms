"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { JourneyHeading, ProgressChip } from "../(portal)/journey/JourneyHeading";
import { JourneyModeCards, journeyModeCopy } from "../(portal)/journey/JourneyModeCards";
import type { JourneyMode } from "../(portal)/journey/journey-mode";
import { PathFlow } from "../(portal)/journey/PathFlow";
import { PathHero } from "../(portal)/journey/PathHero";
import type { Aggregate, FlowNode } from "../(portal)/journey/path-nodes";
import { SoloPath } from "../(portal)/journey/SoloPath";
import type { JourneyItem } from "../(portal)/journey/views";

type Locale = "en" | "de" | "nl";

/**
 * Design route only. Renders both journey layouts against the full 49-step
 * sample, with the fork question over them exactly as the real page shows it.
 *
 * The layout switcher and the button that re-opens the question exist only
 * here: on the real page the answer is written to the company row and the
 * layout follows from it. Answering here just moves the layout.
 */
export function JourneyPreviewSwitcher({
  reqNodes,
  aggregate,
  live,
  locale,
}: {
  reqNodes: FlowNode[];
  aggregate: Aggregate;
  live: JourneyItem | null;
  locale: Locale;
}) {
  // The question is a modal the layout opens over itself, so it is not a tab.
  // A button re-opens it, because a design route wants to look at it more than
  // once and answering here only moves the layout.
  const [tab, setTab] = useState<JourneyMode>("solo");
  const [askingMode, setAskingMode] = useState(true);
  const de = locale === "de";
  const copy = journeyModeCopy(locale);

  const TABS: { key: JourneyMode; label: string }[] = [
    { key: "solo", label: de ? "Geführter Weg" : "Guided path" },
    { key: "team", label: de ? "Teamansicht" : "Team view" },
  ];

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-start justify-between gap-4">
        <JourneyHeading locale={locale} />
        <div className="flex shrink-0 items-center gap-3">
          <div className="inline-flex items-center gap-0.5 rounded-md border bg-muted/40 p-0.5">
            {TABS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setTab(option.key)}
                className={cn(
                  "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                  tab === option.key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setAskingMode(true)}
            className="rounded-md border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {de ? "Frage zeigen" : "Show the question"}
          </button>
          <ProgressChip done={aggregate.done} total={aggregate.total} locale={locale} />
        </div>
      </div>

      <PathHero
        assetCount={12}
        liveNode={live}
        locale={locale}
        showLiveStep={tab === "team"}
      />
      {tab === "team" ? (
        <PathFlow
          reqNodes={reqNodes}
          aggregate={aggregate}
          locale={locale}
          focusCategory={null}
        />
      ) : (
        <SoloPath reqNodes={reqNodes} locale={locale} />
      )}

      {/* The real page renders the question as a modal over the path behind
          it, which is the thing worth reviewing; here the answer only moves
          the tab, so the dialog is reachable again from the tab bar. */}
      <Dialog open={askingMode}>
        <DialogContent
          showCloseButton={false}
          onEscapeKeyDown={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
          className="sm:max-w-xl"
        >
          <DialogHeader>
            <DialogTitle>{copy.question}</DialogTitle>
            <DialogDescription>{copy.lede}</DialogDescription>
          </DialogHeader>
          <JourneyModeCards
            locale={locale}
            onSelect={(mode) => {
              setTab(mode);
              setAskingMode(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
