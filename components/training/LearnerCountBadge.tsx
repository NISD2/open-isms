import { User } from "lucide-react";
import type { ReactNode } from "react";

const AVATAR_TONES = [
  "bg-blue-500/20 text-blue-700 dark:text-blue-300",
  "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
  "bg-amber-500/20 text-amber-700 dark:text-amber-300",
] as const;

/**
 * A learner count the way the course pages show it: three generic user avatars and a label. The
 * avatars are decoration, not people; the label carries the number.
 */
export function LearnerCountBadge({ children }: { readonly children: ReactNode }) {
  return (
    <div className="flex w-fit items-center gap-2 rounded-full bg-muted/50 px-3 py-1.5">
      <div aria-hidden className="flex -space-x-1.5">
        {AVATAR_TONES.map((tone) => (
          <span
            key={tone}
            className={`flex size-5 items-center justify-center rounded-full border-2 border-background ${tone}`}
          >
            <User className="size-2.5" />
          </span>
        ))}
      </div>
      <span className="whitespace-nowrap text-xs text-muted-foreground">{children}</span>
    </div>
  );
}
