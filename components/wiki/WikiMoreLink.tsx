import { ArrowRight } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { Link } from "@/i18n/navigation";

const CLASS =
  "inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline print:hidden";

/** A quiet link from a wiki page to the page, or the section, that covers a point in depth. */
export function WikiMoreLink({
  href,
  children,
}: {
  /**
   * The German-slug wiki path, localized by the router, a section of this page, or the one
   * non-wiki page the wiki sends readers to: the free management course.
   */
  href: `/wiki/${string}` | `#${string}` | "/training/nis2-ceo";
  children: ReactNode;
}) {
  const content = (
    <>
      {children}
      <ArrowRight aria-hidden className="size-3.5" />
    </>
  );
  return href.startsWith("#") ? (
    <a href={href} className={CLASS}>
      {content}
    </a>
  ) : (
    <Link
      // Wiki pathnames are built at runtime (wikiPathnames), so the typed union cannot list them.
      href={href as ComponentProps<typeof Link>["href"]}
      className={CLASS}
    >
      {content}
    </Link>
  );
}
