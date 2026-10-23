"use client";

import "./transitions.css";
import { ArrowRight, BadgeCheck, Clock, Footprints, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { WalkLock } from "@/lib/billing/access";
import {
  isFreeStep,
  policiesOf,
  resumeAt,
  SETUP_STEP,
  WALKS,
  type WalkFramework,
} from "@/lib/durchgang";
import { Art, HOME_ART } from "./Art";
import { PromiseRow } from "./PromiseRow";
import { hrefOf as stepHref, useSteps } from "./setup";
import { STAGE } from "./transition";
import type { WalkEntry } from "./view";
import { WalkOffer } from "./WalkOffer";
import { WalkPath } from "./WalkPath";

/**
 * Each promise carries the sign the person meets for it in the walk: the walk's own footprints,
 * the BSI default's shield, the clock of an item set aside, management's approval.
 */
const POINT_ICONS = [Footprints, ShieldCheck, Clock, BadgeCheck] as const;

/**
 * The Durchgang's front door: what the walk is on the left, pinned while the path scrolls, with
 * one way on (the next open item, else the first one waiting); "Ihr Weg" on the right
 * (`WalkPath`). There is no separate introduction screen; this page is it (Simon, 03.10.2026).
 *
 * `lock` (`walkLockFor`): an account that has not paid walks the first steps (`isFreeStep`, up to
 * the list of what the company has) and sees the rest locked: steps that show but do not open.
 * Once the free steps are filled in, even if some are set aside, the left side becomes the offer
 * (`WalkOffer`; Simon, 20.10.2026). An account that keeps its journey free (grandfathered) is
 * offered it beside the order, as the quieter way. `price` is what that account would pay, shown
 * under the order.
 *
 * `setup`: a company not set up yet walks one step more, setting itself up right after the
 * registration (`useSteps`).
 *
 * `call`: beside "Jetzt bestellen", the way to talk to us first (the pricing page's `TalkFirst`,
 * rendered by the server page and passed in).
 *
 * `forward`: under the order, the quiet way to hand the decision to management
 * (`ForwardToManagement`), passed in by the server page only for someone who may send it.
 */
export function DurchgangHome({
  framework,
  walk,
  lock,
  price,
  setup,
  call,
  forward,
}: {
  framework: WalkFramework;
  walk: readonly WalkEntry[];
  lock: WalkLock | null;
  price: string | null;
  setup: boolean;
  call?: ReactNode;
  forward?: ReactNode;
}) {
  const t = useTranslations("durchgang");
  const locked = lock !== null;
  const intro = `walks.${framework}.intro` as const;
  const points = t.raw(`${intro}.points`) as ReadonlyArray<{
    title: string;
    text: string;
  }>;
  const steps = useSteps(framework, walk, setup);
  // Setting the company up is not walking: a company set up but not walked yet still starts.
  const untouched = steps.every((w) => w.code === SETUP_STEP || w.state.kind === "open");
  // Without an order the walk ends at the last free step: "next" is the next one of those, and
  // none left means the free part is filled in or set aside, which is where the order begins.
  const reachable = locked ? steps.filter((w) => isFreeStep(w.code)) : steps;
  const next = resumeAt(reachable, (w) => w.state);

  /**
   * Where a locked step and the order button lead. Where ordering is not open (no live keys, so
   * no order page) the public pricing page is still there to read (Simon, 20.10.2026: nothing led
   * to pricing while locked).
   */
  const orderHref = lock?.orderAt ?? "/pricing";

  return (
    <div
      style={STAGE}
      className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-[minmax(0,1fr)_28rem] xl:gap-16"
    >
      <div className="flex flex-col lg:sticky lg:top-18 lg:self-start lg:py-6">
        {lock && !next ? (
          // The free part is filled in, set-aside steps included: the offer takes this side.
          <WalkOffer
            framework={framework}
            lock={lock}
            orderHref={orderHref}
            remaining={steps.filter((w) => !isFreeStep(w.code)).length}
            documents={
              policiesOf(WALKS[framework]).filter(
                (p) => !isFreeStep(p.code) && steps.some((w) => w.code === p.code),
              ).length
            }
            price={price}
            call={call}
            forward={forward}
          />
        ) : (
          <>
            {/* The picture sits beside the title, not above it, so the list and the button
                stay in the first screen (Simon, 20.10.2026). */}
            <div className="flex items-end gap-6">
              <div className="min-w-0 flex-1">
                <p className="inline-flex rounded-full bg-primary/[0.08] px-3 py-1 text-sm font-medium text-primary">
                  {t(`${intro}.eyebrow`)}
                </p>
                <h1 className="mt-5 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                  {t(`${intro}.title`)}
                </h1>
                <p className="mt-5 max-w-[52ch] text-lg leading-8 text-muted-foreground">
                  {t(`${intro}.lead`)}
                </p>
              </div>
              <Art src={HOME_ART} className="hidden h-36 shrink-0 sm:block" />
            </div>
            <ul className="mt-8 divide-y border-y">
              {points.map((point, i) => (
                <PromiseRow
                  key={point.title}
                  icon={POINT_ICONS[i]}
                  title={point.title}
                  text={point.text}
                />
              ))}
            </ul>
            {/* Without the order the free part is walked like the rest: the order is not
                mentioned until it is reached (Simon, 20.10.2026). */}
            {next ? (
              <Button
                asChild
                size="lg"
                className="mt-8 h-12 self-start rounded-xl px-7 text-base"
              >
                <Link href={stepHref(framework, next.code)}>
                  {untouched ? t(`${intro}.start`) : t(`walks.${framework}.continue`)}
                  <ArrowRight />
                </Link>
              </Button>
            ) : (
              <div className="mt-10 rounded-3xl border bg-card p-8">
                <p className="text-xl font-semibold">{t("ui.home.allFilled")}</p>
                <p className="mt-2 text-muted-foreground">{t("ui.home.allFilledNote")}</p>
              </div>
            )}
          </>
        )}
      </div>

      <WalkPath
        framework={framework}
        steps={steps}
        next={next}
        locked={locked}
        orderHref={orderHref}
      />
    </div>
  );
}
