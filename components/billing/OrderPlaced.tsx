"use client";

/**
 * After the order: a clear end, what was recorded, and one way on into what they bought.
 *
 * The Durchgang opens at once, because the session reads the access level per request
 * (lib/auth/config.ts), so the button works without signing in again. A company not yet set up
 * sets itself up in the Durchgang, right after the registration.
 */
import { ArrowRight, CircleCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export function OrderPlaced({
  number,
  gross,
  email,
  dueDate,
}: {
  readonly number: string;
  readonly gross: string;
  readonly email: string;
  /** Already formatted for the reader. */
  readonly dueDate: string;
}) {
  const t = useTranslations("billing");
  const section = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  // The form it replaces was long and the click was at its foot: bring the outcome into view and
  // move focus to it, so neither the eye nor a screen reader is left below an empty page.
  useEffect(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    section.current?.scrollIntoView({
      block: "start",
      behavior: still ? "auto" : "smooth",
    });
    heading.current?.focus({ preventScroll: true });
  }, []);
  const recorded = [
    ["invoice", number],
    ["amount", gross],
    ["sentTo", email],
    ["due", dueDate],
  ] as const;

  return (
    <section
      ref={section}
      aria-labelledby="order-placed-title"
      className="mx-auto max-w-2xl scroll-mt-28 space-y-8"
    >
      <div className="rounded-xl bg-primary px-8 py-10 text-center text-primary-foreground">
        <CircleCheck className="mx-auto h-12 w-12" aria-hidden />
        <h2
          ref={heading}
          id="order-placed-title"
          tabIndex={-1}
          className="mt-4 font-bold text-3xl tracking-tight outline-none"
        >
          {t("result.title")}
        </h2>
        <p className="mt-2 text-lg opacity-90">{t("result.accessOpen")}</p>
      </div>

      <div className="space-y-3">
        <dl className="divide-y rounded-lg border">
          {recorded.map(([key, value]) => (
            <div key={key} className="flex justify-between gap-4 px-5 py-3 text-sm">
              <dt className="text-muted-foreground">{t(`result.${key}`)}</dt>
              <dd className="truncate text-right font-medium tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="text-muted-foreground text-sm">{t("result.arrives")}</p>
      </div>

      <div className="flex flex-col-reverse items-center gap-4 sm:flex-row sm:justify-between">
        <Link
          href="/billing"
          className="text-muted-foreground text-sm underline underline-offset-4 hover:text-foreground"
        >
          {t("order.toInvoices")}
        </Link>
        <Button asChild size="lg" className="h-12 w-full px-8 text-base sm:w-auto">
          <Link href="/durchgang/nis2">
            {t("result.start")}
            <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </section>
  );
}
