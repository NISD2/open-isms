"use client";

import { ArrowLeft, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { Art } from "@/components/durchgang/Art";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { WalkLock } from "@/lib/billing/access";
import { isFreeStep, resumeAt, WALK_ROUTES, type WalkFramework } from "@/lib/durchgang";
import { Duty, Heading } from "./ExplainScreens";
import { useSteps } from "./setup";
import { STAGE } from "./transition";
import type { WalkEntry } from "./view";
import { WalkPath } from "./WalkPath";

export interface ItemPreviewView {
  readonly framework: WalkFramework;
  readonly code: string;
  readonly section: string;
  readonly title: string;
  readonly image: string | null;
  /** The item's first explaining screen, as the walk words it. */
  readonly learn: {
    readonly title: string;
    readonly body: readonly string[];
    readonly duty: string;
  } | null;
  readonly duty: { readonly cite: string; readonly href: string };
  /** The titles of the screens that ask for input, in order. */
  readonly steps: readonly string[];
}

/**
 * A locked item, opened from a direct link or from the walk by an account that has not ordered:
 * what the item is and why, what it will ask, and where filling it in opens. Read only: no field,
 * no register, no button that saves. It sits in the walk home's frame, with the walk's steps
 * beside it and this one marked, so the person sees where it falls in the walk (Simon,
 * 23.10.2026).
 */
export function ItemPreview({
  preview,
  walk,
  setup,
  lock,
}: {
  preview: ItemPreviewView;
  walk: readonly WalkEntry[];
  /** The company is not set up yet: the walk shows setting it up as a step (`useSteps`). */
  setup: boolean;
  lock: WalkLock;
}) {
  const t = useTranslations("durchgang.ui.preview");
  const steps = useSteps(preview.framework, walk, setup);
  const next = resumeAt(
    steps.filter((w) => isFreeStep(w.code)),
    (w) => w.state,
  );
  // Where the walk's home sends a locked step: the order, or pricing where ordering is closed.
  const orderHref = lock.orderAt ?? "/pricing";
  return (
    <div
      style={STAGE}
      className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-[minmax(0,1fr)_28rem] xl:gap-16"
    >
      <div className="max-w-3xl lg:py-6">
        {/* The picture sits beside the title, as on the walk's home, so the explanation starts
            in the first screen. */}
        <div className="flex items-end gap-6">
          <div className="min-w-0 flex-1">
            <p className="mb-3 text-sm font-medium text-muted-foreground">
              {preview.section}
            </p>
            <Heading>{preview.title}</Heading>
          </div>
          {preview.image && (
            <Art src={preview.image} className="hidden h-32 shrink-0 sm:block" />
          )}
        </div>
        {preview.learn && (
          <>
            <h2 className="mt-8 text-xl font-semibold tracking-tight">
              {preview.learn.title}
            </h2>
            <div className="mt-4 max-w-[62ch] space-y-4 text-[17px] leading-8 text-foreground/85">
              {preview.learn.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <Duty
              text={preview.learn.duty}
              cite={preview.duty.cite}
              href={preview.duty.href}
            />
          </>
        )}
        {preview.steps.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-semibold tracking-tight">{t("stepsTitle")}</h2>
            <ol className="mt-4 divide-y overflow-hidden rounded-2xl border bg-card shadow-sm">
              {preview.steps.map((step, i) => (
                <li key={step} className="flex items-center gap-4 px-5 py-3.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold tabular-nums">
                    {i + 1}
                  </span>
                  <span className="min-w-0 font-medium">{step}</span>
                </li>
              ))}
            </ol>
          </section>
        )}
        <section className="mt-10 rounded-2xl bg-primary/[0.06] p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Lock aria-hidden className="size-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">{t("lockedTitle")}</h2>
              <p className="mt-1 max-w-[56ch] text-sm leading-6 text-muted-foreground">
                {t("lockedBody")}
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-col-reverse items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href={WALK_ROUTES[preview.framework].home}
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft aria-hidden className="size-4" />
              {t("back")}
            </Link>
            <Button asChild size="lg" className="h-11 rounded-lg px-5">
              <Link href={orderHref}>{t("order")}</Link>
            </Button>
          </div>
        </section>
      </div>

      <WalkPath
        framework={preview.framework}
        steps={steps}
        next={next}
        locked
        orderHref={orderHref}
        current={preview.code}
      />
    </div>
  );
}
