"use client";

import { ArrowLeft, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { Art } from "@/components/durchgang/Art";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { WalkLock } from "@/lib/billing/access";
import { WALK_ROUTES, type WalkFramework } from "@/lib/durchgang";
import { Duty, Heading } from "./ExplainScreens";

export interface ItemPreviewView {
  readonly framework: WalkFramework;
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
 * A locked item, opened from a direct link by an account that has not ordered: what the item is
 * and why, what it will ask, and where filling it in opens. Read only: no field, no register, no
 * button that saves. The walk's home stays the place that lists every step.
 */
export function ItemPreview({
  preview,
  orderHref,
}: {
  preview: ItemPreviewView;
  /** Where the walk's home sends a locked step: the order, or pricing where ordering is closed. */
  orderHref: NonNullable<WalkLock["orderAt"]> | "/pricing";
}) {
  const t = useTranslations("durchgang.ui.preview");
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <p className="mb-3 text-sm font-medium text-muted-foreground">{preview.section}</p>
      {preview.image && (
        <div className="mb-8 flex h-44 items-end justify-center overflow-hidden rounded-3xl bg-primary/[0.06] sm:h-52">
          <Art src={preview.image} className="h-40 translate-y-2 sm:h-48" />
        </div>
      )}
      <Heading>{preview.title}</Heading>
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
  );
}
