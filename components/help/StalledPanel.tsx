"use client";

import { useTranslations } from "next-intl";
import { CircleQuestionMark, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";

/** A path that has not moved for this long is treated as stalled. */
const STALL_DAYS = 14;

/**
 * Shown on the journey when nothing has changed for two weeks.
 *
 * Gated on data rather than on a stored dismissal, so it leaves on its own the
 * moment the company does anything at all. That is why it needs no column of
 * its own and no dismiss control: the condition that raises it is the same one
 * that clears it.
 *
 * `lastActivityAt` null means the company has never mutated anything, which is
 * a brand new account rather than a stalled one, so nothing renders.
 */
export function StalledPanel({
  lastActivityAt,
  done,
  total,
}: {
  lastActivityAt: Date | null;
  done: number;
  total: number;
}) {
  const t = useTranslations("help");

  if (!lastActivityAt) return null;
  // An empty aggregate is not a stalled path. journey.getItems reports
  // total = items.length, which is 0 whenever the assessment exists but has
  // no requirement rows (part-way seeding, a framework swap). Without this
  // the panel tells the company its progress has been stuck at "0 of 0
  // steps" for two weeks, which is not a sentence anyone should read.
  if (total === 0) return null;
  // Nor is a finished one. A company on 49 of 49 has nothing left to move,
  // so two weeks of quiet is the expected shape of done, not a stall, and
  // "you have been stuck at 49 of 49" is the wrong sentence to hand it.
  if (done >= total) return null;

  const daysIdle =
    (Date.now() - lastActivityAt.getTime()) / (1000 * 60 * 60 * 24);
  if (daysIdle < STALL_DAYS) return null;

  return (
    <div className="rounded-md border bg-muted/20 px-4 py-3">
      <div className="flex gap-3">
        <CircleQuestionMark
          className="mt-0.5 size-4 shrink-0 text-primary"
          aria-hidden
        />
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {t("inApp.idle.body", { done, total })}
          </p>
          <Link
            href="/hilfe"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium underline underline-offset-4 hover:text-primary"
          >
            {t("inApp.idle.cta")}
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
