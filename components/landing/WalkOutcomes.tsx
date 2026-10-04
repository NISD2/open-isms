"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { MotionToggle, useMotionAllowed } from "./motion";
import { type ShotName, shotImage, zoomSizes } from "./shots";
import { useZoomLoop } from "./useZoomLoop";
import { ZoomImage } from "./ZoomShot";

/** In walk order, so the one document that holds everything comes last. */
const CARDS = [
  { key: "registers", shot: "assetList" },
  { key: "log", shot: "activityLog" },
  { key: "export", shot: "export" },
] as const satisfies readonly { readonly key: string; readonly shot: ShotName }[];

/** A card's width on a large screen: a third of the page's 72rem less the two gaps. */
const CARD_PX = 368;
/** How much of a card must show before it may zoom. */
const SHARE = 0.6;

/**
 * What the walk leaves behind, three cards in a row. Only one zooms at a time, taking turns among
 * those on screen: all three on a large screen, the one in view on a phone, where they stack.
 */
export function WalkOutcomes() {
  const t = useTranslations("landing.walk.outcomes");
  const locale = useLocale();
  const list = useRef<HTMLUListElement>(null);
  const [visible, setVisible] = useState<readonly number[]>([]);
  const allowed = useMotionAllowed();
  const { round } = useZoomLoop(visible.length > 0 && allowed);
  const zoomedCard = round === null ? null : visible[round % visible.length];

  useEffect(() => {
    const element = list.current;
    if (!element) return;
    const shown = new Set<number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const card = Number(entry.target.getAttribute("data-card"));
          if (entry.intersectionRatio >= SHARE) shown.add(card);
          else shown.delete(card);
        }
        setVisible([...shown].sort((a, b) => a - b));
      },
      { threshold: SHARE },
    );
    for (const card of element.querySelectorAll("[data-card]")) observer.observe(card);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      aria-labelledby="outcomes-title"
      className="mx-auto mt-24 w-full max-w-6xl sm:mt-32"
    >
      <h2
        id="outcomes-title"
        className="max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
      >
        {t("title")}
      </h2>
      <ul ref={list} className="mt-10 grid gap-x-6 gap-y-12 lg:grid-cols-3">
        {CARDS.map((card, index) => (
          <li key={card.key}>
            <figure>
              <div
                data-card={index}
                className="relative overflow-hidden rounded-xl border border-border/60 bg-muted shadow-md"
              >
                <ZoomImage
                  image={shotImage(card.shot, locale, t(`${card.key}.alt`))}
                  sizes={zoomSizes(card.shot, CARD_PX)}
                  stop={zoomedCard === index ? 0 : null}
                />
                {index === CARDS.length - 1 && (
                  <MotionToggle className="absolute right-3 bottom-3" />
                )}
              </div>
              <figcaption className="mt-5">
                <h3 className="text-lg font-semibold tracking-tight">
                  {t(`${card.key}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t(`${card.key}.text`)}
                </p>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
