import { ArrowRight } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { Link } from "@/i18n/navigation";

/**
 * One line under a wiki page's header that points to the page owning a closely related search,
 * with that page's own title as the link text. Two of our pages competed for the same search and
 * Google picked the broader one; this link says which page is the answer.
 */
export function RelatedPage({
  href,
  children,
}: {
  /** The German-slug wiki path, localized by the router. */
  href: `/wiki/${string}`;
  children: ReactNode;
}) {
  return (
    <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
      <ArrowRight aria-hidden className="size-3.5 shrink-0" />
      <Link
        // Wiki pathnames are built at runtime (wikiPathnames), so the typed union cannot list them.
        href={href as ComponentProps<typeof Link>["href"]}
        className="font-medium underline underline-offset-2 hover:text-foreground"
      >
        {children}
      </Link>
    </p>
  );
}
