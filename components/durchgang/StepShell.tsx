"use client";

/**
 * One question per screen, with the teaching beside it.
 *
 * This is the layout the compliance step does not have. `RequirementDetail` puts a whole category's
 * fields on one page with the context in an aside, which works for someone who already knows the
 * domain and loses everyone else. Here the main column holds exactly one question and the sidebar
 * holds exactly one explanation, so there is never a decision about where to look.
 *
 * Three things are deliberate.
 *
 *   - **Forward is one button and it is never disabled.** Whatever is filled in is kept; anything
 *     still blank leaves the screen outstanding and the next session returns to it. Disabling it
 *     would make an unanswerable screen a dead end, and the alternative to an easy skip is a guess.
 *   - **The statute is collapsed, not absent.** The explanation is in the reader's terms; the law
 *     is one click away and verbatim. Front-loading the legal text is what makes people stop
 *     reading, and paraphrasing it without offering the original is what makes them distrust it.
 *   - **No percentage bar.** Over a flow this long a bar that crawls is discouraging. The honest
 *     progress signal is the count of what is left, and that lives in the header.
 */

import { ArrowLeft, ArrowRight, BookOpen, Clock } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { UI } from "@/lib/compliance/guided-form/content.de";

/**
 * What the sidebar shows. Both halves come from content that already exists: the explanation from
 * `data/guidance/<locale>.json`, the citation from the requirement's own `legalRef`.
 *
 * It explains and never recommends. The moment it recommends we are selling an opinion, which is
 * what the proportionality engine was retired for.
 */
export interface SidebarCopy {
  readonly explains: string;
  /** For example "§30(2) Nr. 1 BSIG, CIR 2.1.2". Empty where the item names no source. */
  readonly cite: string;
  readonly furtherReading?: { readonly label: string; readonly href: string };
}

export interface StepShellProps {
  readonly question: string;
  readonly subline: string;
  readonly sidebar: SidebarCopy | null;
  /** The verbatim statute text for this step's citation, sliced server side. */
  readonly statute: string | null;
  readonly stepNumber: number;
  readonly stepCount: number;
  /**
   * Which journey item this screen serves, so the reader can see that the screens are the journey
   * and not a questionnaire in front of it.
   *
   * There is no counter here on purpose. The version deleted on 25.09.2026 showed a running count
   * of what still applied, which only ever moved four of fifty-three and read "53 von 53" for most
   * companies. The honest count is of control decisions and it needs the crosswalk.
   */
  readonly item: string | null;
  readonly onBack: (() => void) | null;
  /**
   * The only way forward, and it is never disabled.
   *
   * There used to be a second button beside it for leaving a screen open. Simon removed it: "the
   * Continue button should be the same button as Do It Later because it doesn't make a difference."
   * It makes no difference to the person, so it is one control. What they filled in is kept either
   * way, and an incomplete screen simply stays outstanding.
   */
  readonly onNext: (() => void) | null;
  readonly isWaiting: boolean;
  readonly nextLabel?: string;
  readonly children: React.ReactNode;
}

export function StepShell({
  question,
  subline,
  sidebar,
  statute,
  stepNumber,
  stepCount,
  item,
  onBack,
  onNext,
  isWaiting,
  nextLabel,
  children,
}: StepShellProps) {
  const [statuteOpen, setStatuteOpen] = useState(false);

  return (
    <div className="mx-auto flex min-h-[38rem] w-full max-w-5xl flex-col">
      <header className="flex items-baseline justify-between gap-4 pb-6">
        <span className="text-muted-foreground text-sm tabular-nums">
          {UI.stepOf(stepNumber, stepCount)}
        </span>
        {item ? <span className="text-muted-foreground text-sm">{item}</span> : null}
      </header>

      <div className="grid flex-1 gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="min-w-0 space-y-6">
          <div className="space-y-2">
            <h1 className="text-balance font-semibold text-2xl leading-tight tracking-tight sm:text-3xl">
              {question}
            </h1>
            <p className="text-balance text-muted-foreground">{subline}</p>
          </div>
          {children}
          {isWaiting ? (
            <p className="flex items-center gap-2 text-muted-foreground text-sm">
              <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {UI.waitingNote}
            </p>
          ) : null}
        </div>

        {sidebar ? (
          <aside className="space-y-4 lg:border-l lg:pl-10">
            <p className="text-pretty text-muted-foreground text-sm leading-relaxed">
              {sidebar.explains}
            </p>
            <Separator />
            <div className="space-y-3">
              <Badge variant="outline" className="font-normal">
                {sidebar.cite}
              </Badge>
              {statute ? (
                <Collapsible open={statuteOpen} onOpenChange={setStatuteOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="-ml-2 h-auto px-2 py-1">
                      <BookOpen className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                      {UI.readStatute}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <p className="mt-2 max-h-72 overflow-y-auto text-pretty rounded-md border bg-muted/40 p-3 text-muted-foreground text-xs leading-relaxed">
                      {statute}
                    </p>
                  </CollapsibleContent>
                </Collapsible>
              ) : null}
              {sidebar.furtherReading ? (
                <a
                  className="block text-sm underline underline-offset-4 hover:no-underline"
                  href={sidebar.furtherReading.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {sidebar.furtherReading.label}
                </a>
              ) : null}
            </div>
          </aside>
        ) : null}
      </div>

      {/*
        Sticky so that forward is always reachable. An item with five inputs pushes a footer in
        the flow below the fold, and a way out you cannot see is one nobody takes.
      */}
      <footer className="sticky bottom-0 mt-10 flex items-center gap-3 border-t bg-background/95 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        {onBack ? (
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden />
            {UI.back}
          </Button>
        ) : (
          <span />
        )}
        <div className="flex-1" />
        {onNext ? (
          <Button onClick={onNext}>
            {nextLabel ?? UI.next}
            <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
          </Button>
        ) : null}
      </footer>
    </div>
  );
}
