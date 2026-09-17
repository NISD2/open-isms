"use client";

import { User, Users } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import type { JourneyMode } from "./journey-mode";

type Locale = "en" | "de" | "nl";

const OPTIONS: { mode: JourneyMode; de: string; en: string }[] = [
  { mode: "solo", de: "Geführt", en: "Guided" },
  { mode: "team", de: "Team", en: "Team" },
];

/**
 * Switches the layout back and forth. The fork is only defensible while it is
 * reversible in one click: anyone who answers the question wrong, or whose
 * company grows into a team, must never be stuck with the wrong path.
 */
export function JourneyModeToggle({
  mode,
  locale,
}: {
  mode: JourneyMode;
  locale: Locale;
}) {
  const router = useRouter();
  const setMode = trpc.journey.setMode.useMutation({
    onSuccess: () => router.refresh(),
  });
  const de = locale === "de";

  return (
    <fieldset
      aria-label={de ? "Ansicht" : "View"}
      className="inline-flex shrink-0 items-center gap-0.5 rounded-md border bg-muted/40 p-0.5"
    >
      {OPTIONS.map((option) => {
        const active = option.mode === mode;
        const Icon = option.mode === "solo" ? User : Users;
        return (
          <button
            key={option.mode}
            type="button"
            aria-pressed={active}
            disabled={active || setMode.isPending}
            onClick={() => setMode.mutate({ mode: option.mode })}
            className={cn(
              "inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {de ? option.de : option.en}
          </button>
        );
      })}
    </fieldset>
  );
}
