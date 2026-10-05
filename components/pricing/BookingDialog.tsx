"use client";

import Cal, { getCalApi } from "@calcom/embed-react";
import { ExternalLink, X } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { campaignTags } from "@/lib/analytics/token-routes";
import { cn } from "@/lib/utils";
import { CALL_HOSTS, callHostNames } from "./founders";

const NAMESPACE = "booking";

/**
 * Cal's booker in the site's own colours, read from the theme tokens (packages/isms-ui/src/theme.css)
 * rather than copied, so a palette change reaches the calendar too. The site has no dark mode, so
 * the booker is pinned to light; Cal still asks for both sets.
 */
function calThemeVars(): Record<string, string> {
  const css = getComputedStyle(document.documentElement);
  const token = (name: string) => css.getPropertyValue(name).trim();
  return {
    "cal-brand": token("--primary"),
    "cal-brand-emphasis": token("--primary"),
    "cal-brand-text": token("--primary-foreground"),
    "cal-text-emphasis": token("--foreground"),
    "cal-bg": token("--background"),
    "cal-bg-muted": token("--muted"),
    "cal-border": token("--border"),
    "cal-border-subtle": token("--border"),
    // The dialog is the frame; a second border inside it reads as a box in a box.
    "cal-border-booker": "transparent",
  };
}

/**
 * The calendar itself. Mounted only while the dialog is open, so each opening starts from a fresh
 * booker and the cal.com script is fetched only by visitors who ask for it.
 */
function Booker({ calLink }: { calLink: string }) {
  const [ready, setReady] = useState(false);
  // Campaign tags only, as on the link's href (lib/booking.ts): cal.com takes them as hidden
  // booking questions.
  const [tags] = useState(() => Object.fromEntries(campaignTags(window.location.search)));

  useEffect(() => {
    const onReady = () => setReady(true);
    const api = getCalApi({ namespace: NAMESPACE }).then((cal) => {
      const vars = calThemeVars();
      cal("ui", {
        theme: "light",
        hideEventTypeDetails: false,
        layout: "month_view",
        cssVarsPerTheme: { light: vars, dark: vars },
      });
      cal("on", { action: "linkReady", callback: onReady });
      return cal;
    });
    return () => {
      void api.then((cal) => cal("off", { action: "linkReady", callback: onReady }));
    };
  }, []);

  return (
    // About the month view's own height, so the dialog does not jump when the calendar arrives.
    <div className="relative min-h-[36rem]">
      {!ready && <BookerPlaceholder />}
      <Cal
        namespace={NAMESPACE}
        calLink={calLink}
        config={{
          ...tags,
          layout: "month_view",
          theme: "light",
          useSlotsViewOnSmallScreen: "true",
        }}
        className={cn(
          "w-full transition-opacity duration-300 motion-reduce:transition-none",
          ready ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}

const PLACEHOLDER_DAYS = Array.from({ length: 35 }, (_, day) => `day-${day}`);

/** The shape of the month view while cal.com loads, so the dialog never opens onto a blank box. */
function BookerPlaceholder() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 flex gap-8 p-6 motion-safe:animate-pulse sm:p-8"
    >
      <div className="hidden w-56 shrink-0 space-y-3 md:block">
        <div className="h-4 w-24 rounded bg-muted" />
        <div className="h-6 w-44 rounded bg-muted" />
        <div className="h-4 w-32 rounded bg-muted" />
      </div>
      <div className="flex-1 space-y-4">
        <div className="h-5 w-36 rounded bg-muted" />
        <div className="grid grid-cols-7 gap-2">
          {PLACEHOLDER_DAYS.map((day) => (
            <div key={day} className="aspect-square rounded-md bg-muted/70" />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * The booking calendar over the page, opened by BookingLink. The header says who the call is with
 * in the words of the talk-first card the visitor just clicked; the foot keeps cal.com one click
 * away in a tab, for a browser that blocks the embedded calendar.
 */
export function BookingDialog({
  calLink,
  href,
  open,
  onOpenChange,
}: {
  calLink: string;
  /** The same booking page as the link that opened the dialog, campaign tags included. */
  href: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("pricing.tiers.talkFirst");
  const locale = useLocale();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        data-testid="booking-dialog"
        className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden rounded-xl p-0 sm:max-w-5xl"
      >
        <div className="flex items-center gap-3 border-b px-5 py-4 sm:gap-4 sm:px-6">
          <div className="flex shrink-0 -space-x-2.5">
            {CALL_HOSTS.map((person) => (
              <Image
                key={person.name}
                src={person.photo}
                alt={person.name}
                width={96}
                height={96}
                className="size-11 rounded-full object-cover ring-2 ring-background"
              />
            ))}
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <DialogTitle className="text-base leading-snug sm:text-lg">
              {t("title")}
            </DialogTitle>
            <DialogDescription className="leading-snug">
              {t("body", { names: callHostNames(locale) })}
            </DialogDescription>
          </div>
          <DialogClose className="-mr-1.5 inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <X className="size-5" aria-hidden />
            <span className="sr-only">{t("close")}</span>
          </DialogClose>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <Booker calLink={calLink} />
        </div>

        <div className="border-t px-5 py-3 sm:px-6">
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline decoration-muted-foreground/40 underline-offset-4 hover:text-foreground hover:decoration-foreground"
          >
            {t("newTab")}
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
