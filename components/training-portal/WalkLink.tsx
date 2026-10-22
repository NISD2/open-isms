"use client";

import { ArrowUpRight, Footprints } from "lucide-react";
import { Art } from "@/components/durchgang/Art";
import { Link } from "@/i18n/navigation";
import { pickLocalized } from "@/lib/locale";

const IN_THE_WALK = {
  de: "Im NIS 2 Durchgang",
  en: "In the NIS 2 walkthrough",
  cs: "V průvodci NIS 2",
} as const;

interface WalkLinkProps {
  /** The walk item's code (e.g. "5.1"). Lookup happens server-side. */
  code: string;
  /** The walk's own headline of that item. */
  headline: string;
  /** The item's own picture, the one its walk card shows; null where none is drawn. */
  image: string | null;
  /** The lesson it sits in, for the click count. */
  lessonId: string;
  locale: string;
}

/**
 * The lesson's way into the walk item where it is put into practice, under the lesson's title so
 * it is seen before the reading starts. Opens in a new tab so the learner keeps their place. A
 * locked item opens read only (its preview), so the link never ends on the order page.
 *
 * Umami counts the click as `course-walk-link` with the lesson and the item, nothing about the
 * person (the tag is cookieless and the before-send hook strips the query).
 */
export function WalkLink({ code, headline, image, lessonId, locale }: WalkLinkProps) {
  return (
    <Link
      href={{ pathname: "/durchgang/nis2/[code]", params: { code } }}
      target="_blank"
      rel="noopener noreferrer"
      data-umami-event="course-walk-link"
      data-umami-event-lesson={lessonId}
      data-umami-event-item={code}
      className="group mb-8 flex items-center gap-4 rounded-xl bg-primary px-4 py-3 text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:max-w-xl"
    >
      <span className="flex size-14 shrink-0 items-end justify-center overflow-hidden rounded-lg bg-white">
        {image ? (
          <Art src={image} className="h-16 translate-y-1.5" />
        ) : (
          <Footprints aria-hidden className="size-5 text-primary" />
        )}
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-medium text-primary-foreground/75">
          {pickLocalized<string>(IN_THE_WALK, locale)}
        </span>
        <span className="block font-semibold leading-snug">{headline}</span>
      </span>
      <ArrowUpRight
        aria-hidden
        className="ml-auto size-5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
      />
    </Link>
  );
}
