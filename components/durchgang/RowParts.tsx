"use client";

import { Check, Minus } from "lucide-react";
import { useTranslations } from "next-intl";
import type { RiskLevel } from "@/lib/compliance/bsi-200-3";
import { cn } from "@/lib/utils";
import { LevelChip } from "./RatingScreens";

/** One answer of a row: a pill that shows a tick while it is chosen. */
export function Toggle({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-left text-sm transition-colors",
        on
          ? "border-primary bg-primary/[0.06] text-foreground"
          : "text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
    >
      {on && <Check className="size-3.5 shrink-0" />}
      {children}
    </button>
  );
}

/** A row's rating from 2.3, or a dashed chip where it has none yet. */
export function RowLevel({
  level,
  locale,
}: {
  level: RiskLevel | null;
  locale: "de" | "en";
}) {
  const t = useTranslations("durchgang.ui");
  return level ? (
    <LevelChip level={level} locale={locale} />
  ) : (
    <span className="inline-flex h-9 items-center gap-1.5 rounded-md border border-dashed px-3 text-sm text-muted-foreground">
      <Minus className="size-3.5" />
      {t("unrated")}
    </span>
  );
}
