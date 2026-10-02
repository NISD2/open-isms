"use client";

import { Check, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * Common answers under a text field: a tap adds one to what is written, after what is there,
 * separated by a semicolon; a second tap takes it out again. The person can still write anything.
 */
export function Suggestions({
  items,
  value,
  onChange,
  own = false,
}: {
  items: readonly string[];
  value: string;
  onChange: (value: string) => void;
  /** The answers come from the company's own records, and the row says so. */
  own?: boolean;
}) {
  const t = useTranslations("durchgang.ui");
  const written = value.split(";").map((part) => part.trim());
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      <span className="text-xs text-muted-foreground">
        {own ? t("suggestionsOwn") : t("suggestions")}
      </span>
      {items.map((s) => {
        const on = written.includes(s);
        return (
          <button
            key={s}
            type="button"
            aria-pressed={on}
            onClick={() =>
              onChange(
                on
                  ? written.filter((w) => w && w !== s).join("; ")
                  : [...written.filter(Boolean), s].join("; "),
              )
            }
            className={cn(
              "inline-flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors",
              on
                ? "border-primary bg-primary/[0.06] text-foreground"
                : "text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {on ? <Check className="size-3" /> : <Plus className="size-3" />}
            {s}
          </button>
        );
      })}
    </div>
  );
}
