import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { DocsSidebar } from "@/components/docs/DocsSidebar";
import { DocsSearch } from "@/components/docs/DocsSearch";
import { MobileNav } from "@/components/docs/MobileNav";
import "./docs.css";

/**
 * /docs is a section of this website, laid out the way /wiki is: the site's
 * own header, one `max-w-6xl` column, the site's footer. It had a header,
 * container width and footer of its own for about a day, and the result read
 * as a different site that happened to share a domain.
 *
 * The one structural difference from /wiki is the route, not the chrome:
 * these pages sit outside app/[locale] because they are English only and
 * have one canonical URL each, where ten locale variants of a `docker
 * compose` walkthrough would be ten more things to keep true. Two
 * consequences follow, and both are handled here rather than pushed into the
 * shared components:
 *
 *   - `setRequestLocale("en")` gives next-intl a locale to work from. Without
 *     it the request config falls back to the default, and the site header
 *     would render in German above English documentation.
 *   - `NextIntlClientProvider` is what the client half needs. next-intl's
 *     Link is a client component that reads the locale from context, so
 *     without a provider the header throws "No intl context found".
 *
 * No messages are passed to the provider. Nothing in this subtree calls
 * useTranslations on the client, and the `info` namespace alone is ~1.8 MB
 * per locale — the locale layout trims it for the same reason.
 */

export const metadata: Metadata = {
  title: {
    default: "open-isms documentation",
    template: "%s — open-isms docs",
  },
  description:
    "Install, configure, operate and contribute to open-isms: the open-source ISMS for the EU NIS 2 Directive.",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "open-isms docs",
  },
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  setRequestLocale("en");

  return (
    <html lang="en" className="scroll-smooth">
      <body className="docs-root min-h-screen bg-background text-foreground antialiased">
        <NextIntlClientProvider locale="en" messages={{}}>
          <a href="#docs-content" className="docs-skip-link">
            Skip to content
          </a>

          <PublicNav variant="docs" />

          <main className="mx-auto flex max-w-6xl gap-8 px-6 pt-16 pb-16 sm:pt-20 lg:px-0">
            {/*
              Search sits at the top of the documentation's own column rather
              than in a second global bar. One header, and the tool that only
              this section needs stays inside this section.
            */}
            <aside className="sticky top-20 hidden h-[calc(100vh-6rem)] w-52 shrink-0 flex-col gap-6 overflow-y-auto py-2 pr-4 lg:flex">
              <DocsSearch />
              <DocsSidebar />
            </aside>

            <div id="docs-content" className="min-w-0 flex-1">
              <div className="mb-6 flex items-center gap-3 lg:hidden">
                <MobileNav />
                <DocsSearch />
              </div>
              {children}
            </div>
          </main>

          <PublicFooter variant="docs" />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
