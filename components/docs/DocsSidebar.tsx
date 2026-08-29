"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { DOCS_SECTIONS } from "@/lib/docs/toc";

/**
 * The docs navigation tree.
 *
 * `usePathname` comes from next/navigation, not from @/i18n/navigation:
 * /docs sits outside the localized route tree, so the next-intl hook would
 * hand back a pathname template instead of the URL the reader is on.
 */
export function DocsSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Documentation" className="flex flex-col gap-7 text-sm">
      {DOCS_SECTIONS.map((section) => (
        <div key={section.slug}>
          <p className="mb-2 px-3 text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground/80">
            {section.title}
          </p>
          <ul className="border-l border-border/70">
            {section.pages.map((page) => {
              const href = `/docs/${section.slug}/${page.slug}`;
              const active = pathname === href;
              return (
                <li key={page.slug}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "-ml-px block border-l py-1.5 pl-3 pr-2 leading-snug transition-colors",
                      active
                        ? "border-primary font-medium text-primary"
                        : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                    )}
                  >
                    {page.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
