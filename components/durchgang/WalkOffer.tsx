"use client";

import { ArrowRight, BadgeCheck, History, ListChecks, ScrollText } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { WalkLock } from "@/lib/billing/access";
import { Art, HOME_ART } from "./Art";
import { PromiseRow } from "./PromiseRow";

/**
 * The walk home's left side once an account that has not ordered has filled in the free steps:
 * the offer in place of the introduction (Simon, 20.10.2026: "since that was the free example,
 * try the rest for 30 days with a money-back guarantee"). It counts what the rest holds for this
 * company: the steps still locked and the documents they write. The order button leads to the
 * order, or to the pricing page where ordering is not open (`orderHref`).
 */
export function WalkOffer({
  lock,
  orderHref,
  remaining,
  documents,
  price,
  call,
  forward,
}: {
  lock: WalkLock;
  orderHref: ComponentProps<typeof Link>["href"];
  /** The steps of this company's walk that need the order. */
  remaining: number;
  /** The documents those steps write. */
  documents: number;
  price: string | null;
  call?: ReactNode;
  forward?: ReactNode;
}) {
  const t = useTranslations("durchgang.ui");
  const points = [
    {
      icon: ListChecks,
      key: "steps",
      title: t("offer.steps.title", { count: remaining }),
    },
    {
      icon: ScrollText,
      key: "documents",
      title: t("offer.documents.title", { count: documents }),
    },
    { icon: History, key: "kept", title: t("offer.kept.title") },
    { icon: BadgeCheck, key: "signs", title: t("offer.signs.title") },
  ] as const;

  return (
    <>
      <div className="flex items-end gap-6">
        <div className="min-w-0 flex-1">
          <p className="inline-flex rounded-full bg-primary/[0.08] px-3 py-1 text-sm font-medium text-primary">
            {t("intro.eyebrow")}
          </p>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            {t("offer.title")}
          </h1>
          <p className="mt-5 max-w-[52ch] text-lg leading-8 text-muted-foreground">
            {t("offer.lead")}
          </p>
        </div>
        <Art src={HOME_ART} className="hidden h-36 shrink-0 sm:block" />
      </div>
      <ul className="mt-8 divide-y border-y">
        {points.map((point) => (
          <PromiseRow
            key={point.key}
            icon={point.icon}
            title={point.title}
            text={t(`offer.${point.key}.text`)}
          />
        ))}
      </ul>
      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
        <Button asChild size="lg" className="h-12 rounded-xl px-7 text-base">
          <Link href={orderHref}>
            {t("home.unlock")}
            <ArrowRight />
          </Link>
        </Button>
        {call}
        {lock.journey && (
          <Link
            href="/journey"
            className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {t("home.toJourney")}
          </Link>
        )}
        {price && (
          <p className="w-full text-sm text-muted-foreground">
            {t("home.price", { price })}
          </p>
        )}
        {forward && <div className="w-full">{forward}</div>}
      </div>
    </>
  );
}
