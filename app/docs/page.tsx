import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Boxes, Rocket, Server, Wrench } from "lucide-react";
import { DOCS_SECTIONS } from "@/lib/docs/toc";

export const metadata: Metadata = {
  title: "open-isms documentation",
  description:
    "Install, configure, operate and contribute to open-isms: the open-source ISMS for the EU NIS 2 Directive.",
  alternates: { canonical: "/docs" },
};

const SHORTCUTS = [
  {
    href: "/docs/getting-started/quickstart",
    title: "Quickstart",
    body: "One command. It installs, starts and loads the framework data for you.",
    icon: Rocket,
  },
  {
    href: "/docs/self-hosting/installation",
    title: "Self-hosting",
    body: "Put it on a server: profiles, TLS, storage, backups, updates.",
    icon: Server,
  },
  {
    href: "/docs/packages/npm-packages",
    title: "Use the schemas",
    body: "219 requirements and the incident notification format, on npm, without the platform.",
    icon: Boxes,
  },
  {
    href: "/docs/contributing/local-development",
    title: "Contribute",
    body: "Run it locally, understand the layout, and ship a change.",
    icon: Wrench,
  },
] as const;

export default function DocsHome() {
  return (
    <div className="py-14">
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-primary">Documentation</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">open-isms</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          A self-hostable information security management system built for the EU NIS 2
          Directive, with GDPR, the EU AI Act, the CRA and ISO 27001 alongside it. Free
          software under AGPL-3.0, published as a container image, with no licence key and
          nothing phoning home.
        </p>
      </div>

      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:max-w-4xl">
        {SHORTCUTS.map((shortcut) => (
          <Link
            key={shortcut.href}
            href={shortcut.href}
            className="group rounded-xl border border-border p-5 transition-colors hover:border-primary/40 hover:bg-muted/40"
          >
            <shortcut.icon className="size-5 text-primary" aria-hidden="true" />
            <p className="mt-3 flex items-center gap-1.5 font-medium">
              {shortcut.title}
              <ArrowRight
                className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100"
                aria-hidden="true"
              />
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {shortcut.body}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-16 space-y-10 lg:max-w-4xl">
        {DOCS_SECTIONS.map((section) => (
          <section key={section.slug}>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              {section.title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
            <ul className="mt-4 grid gap-x-8 gap-y-1 border-t border-border/60 pt-4 sm:grid-cols-2">
              {section.pages.map((page) => (
                <li key={page.slug}>
                  <Link
                    href={`/docs/${section.slug}/${page.slug}`}
                    className="group flex flex-col gap-0.5 rounded-md px-2 py-2 transition-colors hover:bg-muted/50"
                  >
                    <span className="text-sm font-medium group-hover:text-primary">
                      {page.title}
                    </span>
                    <span className="text-xs leading-relaxed text-muted-foreground">
                      {page.description}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
