"use client";

import { User, Users } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import type { JourneyMode } from "./journey-mode";
import { journeyLocaleOf, type Localized } from "./path-nodes";

const OPTIONS: { mode: JourneyMode; label: Localized }[] = [
  { mode: "solo", label: { de: "Geführt", en: "Guided", cs: "Krok za krokem" } },
  { mode: "team", label: { de: "Team", en: "Team", cs: "Tým" } },
];

const VIEW: Localized = { de: "Ansicht", en: "View", cs: "Zobrazení" };

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
  locale: string;
}) {
  const router = useRouter();
  const setMode = trpc.journey.setMode.useMutation({
    onSuccess: () => router.refresh(),
  });
  const lang = journeyLocaleOf(locale);

  return (
    <fieldset
      aria-label={VIEW[lang]}
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
            {option.label[lang]}
          </button>
        );
      })}
    </fieldset>
  );
}
