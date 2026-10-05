import type { LucideIcon } from "lucide-react";

/**
 * One promise of the walk on its front door: its sign, a title and one line. Plain text, nothing to
 * open (Simon, 05.10.2026: no screenshot preview on these cards), so no pointer and no hover
 * (ui-design principle 14).
 */
export function PromiseCard({
  icon: Icon,
  title,
  text,
}: {
  icon: LucideIcon | undefined;
  title: string;
  text: string;
}) {
  return (
    <li className="flex h-full flex-col rounded-2xl border bg-card p-5 shadow-xs">
      {Icon && (
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary/[0.08] text-primary">
          <Icon className="size-[1.125rem]" />
        </span>
      )}
      <span className="mt-3 font-semibold">{title}</span>
      <span className="mt-1 text-sm leading-6 text-muted-foreground">{text}</span>
    </li>
  );
}
