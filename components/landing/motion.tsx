"use client";

import { Pause, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { cn } from "@/lib/utils";

const STILL_QUERY = "(prefers-reduced-motion: reduce)";

const onStillChange = (notify: () => void) => {
  const query = window.matchMedia(STILL_QUERY);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};

/** Whether the visitor asked for less motion. Still until hydrated, so nothing moves before. */
export const usePrefersStill = (): boolean =>
  useSyncExternalStore(
    onStillChange,
    () => window.matchMedia(STILL_QUERY).matches,
    () => true,
  );

const Paused = createContext<{ readonly paused: boolean; readonly toggle: () => void }>({
  paused: false,
  toggle: () => {},
});

/**
 * One switch for every moving screenshot on the page, so pausing one pauses all. Moving content
 * that starts by itself and runs longer than five seconds needs a way to stop it (WCAG 2.2.2).
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  const [paused, setPaused] = useState(false);
  const value = useMemo(() => ({ paused, toggle: () => setPaused((p) => !p) }), [paused]);
  return <Paused.Provider value={value}>{children}</Paused.Provider>;
}

/** Whether screenshots may move: nobody paused them and no reduced motion is asked for. */
export function useMotionAllowed(): boolean {
  const { paused } = useContext(Paused);
  return !usePrefersStill() && !paused;
}

/**
 * The pause switch in a screenshot's corner. Gone under reduced motion, where nothing moves. On a
 * screenshot that has played all its rounds (`ended`) it offers play, which starts it over.
 */
export function MotionToggle({
  className,
  ended = false,
  onReplay,
}: {
  className?: string;
  ended?: boolean;
  onReplay?: () => void;
}) {
  const t = useTranslations("landing.walk");
  const { paused, toggle } = useContext(Paused);
  const still = usePrefersStill();
  if (still) return null;
  const resting = paused || ended;
  const label = resting ? t("play") : t("pause");
  return (
    <button
      type="button"
      onClick={() => {
        if (ended) onReplay?.();
        if (paused || !ended) toggle();
      }}
      aria-label={label}
      title={label}
      className={cn(
        "relative flex size-8 cursor-pointer items-center justify-center rounded-full border bg-background/90 text-foreground/70 shadow-xs backdrop-blur-sm transition-colors after:absolute after:-inset-1.5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        className,
      )}
    >
      {resting ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
    </button>
  );
}
