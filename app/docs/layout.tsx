import type { Metadata } from "next";
import Link from "next/link";
import { Shield } from "lucide-react";
import { DocsSidebar } from "@/components/docs/DocsSidebar";
import { DocsSearch } from "@/components/docs/DocsSearch";
import { MobileNav } from "@/components/docs/MobileNav";
import "./docs.css";

/**
 * /docs lives outside app/[locale] on purpose.
 *
 * The marketing site and the portal are translated into ten languages and
 * routed by next-intl. These pages are English only and have one canonical
 * URL each, so they skip the locale segment entirely — which also keeps ten
 * duplicate URLs per page out of the index. proxy.ts bypasses the i18n
 * middleware for this prefix.
 */

const GITHUB_URL = "https://github.com/NISD2/open-isms";

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

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="docs-root min-h-screen bg-background text-foreground antialiased">
        <a href="#docs-content" className="docs-skip-link">
          Skip to content
        </a>
        <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-sm">
          <div className="mx-auto flex h-14 max-w-[92rem] items-center gap-3 px-4 sm:px-6">
            <MobileNav />

            <Link href="/docs" className="flex items-center gap-2.5">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary">
                <Shield className="size-3.5 text-primary-foreground" />
              </span>
              <span className="text-sm font-semibold tracking-tight">open-isms</span>
              <span className="rounded border border-border px-1.5 py-0.5 text-[0.625rem] font-medium uppercase tracking-wider text-muted-foreground">
                Docs
              </span>
            </Link>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <DocsSearch />
              <a
                href="https://www.nisd2.eu"
                className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground md:block"
              >
                nisd2.eu
              </a>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="open-isms on GitHub"
                className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <GithubIcon className="size-4" />
              </a>
            </div>
          </div>
        </header>

        <div className="mx-auto flex max-w-[92rem] px-4 sm:px-6">
          <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 overflow-y-auto py-10 pr-6 lg:block">
            <DocsSidebar />
          </aside>

          <div id="docs-content" className="min-w-0 flex-1">
            {children}
          </div>
        </div>

        <footer className="mt-16 border-t border-border/60">
          <div className="mx-auto flex max-w-[92rem] flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>
              open-isms is free software under{" "}
              <a
                href={`${GITHUB_URL}/blob/main/LICENSE`}
                className="underline underline-offset-4 hover:text-foreground"
              >
                AGPL-3.0-or-later
              </a>
              .
            </p>
            <p className="flex gap-4">
              <a href={`${GITHUB_URL}/issues`} className="hover:text-foreground">
                Issues
              </a>
              <a href={`${GITHUB_URL}/discussions`} className="hover:text-foreground">
                Discussions
              </a>
              <a href="https://www.nisd2.eu" className="hover:text-foreground">
                nisd2.eu
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
