import type { LucideIcon } from "lucide-react";

/**
 * One promise of the walk on its front door, as a row of a list: its sign, a title and one line.
 * Plain text, nothing to open (Simon, 05.10.2026: no screenshot preview here), so no pointer and no
 * hover (ui-design principle 14). A list, not cards (Simon, 20.10.2026), so four promises and the
 * way in fit the first screen.
 */
export function PromiseRow({
  icon: Icon,
  title,
  text,
}: {
  icon: LucideIcon | undefined;
  title: string;
  text: string;
}) {
  return (
    <li className="flex items-start gap-4 py-3.5">
      {Icon && (
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/[0.08] text-primary">
          <Icon className="size-4" />
        </span>
      )}
      <p className="min-w-0 leading-6">
        <span className="font-semibold">{title}</span>
        <span className="text-muted-foreground"> {text}</span>
      </p>
    </li>
  );
}
