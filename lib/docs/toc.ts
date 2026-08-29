/**
 * Table of contents for /docs — the developer and operator documentation
 * for open-isms itself. Not to be confused with /wiki, which is the
 * NIS 2 subject-matter encyclopedia for a German-speaking audience.
 *
 * Single source of truth for the sidebar, the docs landing page, the
 * previous/next links, the sitemap entries and `generateStaticParams`.
 * A page exists here or it does not exist at all; every entry must have a
 * matching `content/docs/<section>/<page>.md`, which a unit test asserts.
 *
 * English only, on purpose. The rest of the site is translated into ten
 * languages because its readers are German Geschäftsführer and their EU
 * equivalents. These pages are read by whoever installs and runs the
 * software, and that audience already reads English documentation all day.
 * Ten machine translations of a `docker compose` walkthrough would be ten
 * more things to keep true.
 */

export interface DocsPage {
  /** URL segment and markdown filename, without extension. */
  readonly slug: string;
  readonly title: string;
  /** One line. Used on the section card, in search and as the meta description. */
  readonly description: string;
}

export interface DocsSection {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly pages: readonly DocsPage[];
}

export const DOCS_SECTIONS = [
  {
    slug: "getting-started",
    title: "Getting started",
    description: "What open-isms is, and how to get an instance running.",
    pages: [
      {
        slug: "introduction",
        title: "Introduction",
        description: "An open-source ISMS for the EU NIS 2 Directive, and what it does not do.",
      },
      {
        slug: "quickstart",
        title: "Quickstart",
        description: "One command, about ten minutes, and no Docker knowledge required.",
      },
      {
        slug: "how-it-works",
        title: "How it works",
        description: "The image, the database, the object store, and what happens at container start.",
      },
    ],
  },
  {
    slug: "self-hosting",
    title: "Self-hosting",
    description: "Running your own instance in production.",
    pages: [
      {
        slug: "requirements",
        title: "Requirements",
        description: "Hardware, architectures, Postgres versions, and what you do not need.",
      },
      {
        slug: "installation",
        title: "Installation",
        description: "The full walkthrough, including the optional compose profiles.",
      },
      {
        slug: "synology",
        title: "Synology NAS",
        description: "The path most Mittelstand operators actually take, with or without a terminal.",
      },
      {
        slug: "configuration",
        title: "Configuration",
        description: "Every environment variable, what breaks without it, and which two are mandatory.",
      },
      {
        slug: "framework-data",
        title: "Framework data",
        description: "Seeding NIS 2 and ISO 27001. Migrations create the tables; they do not fill them.",
      },
      {
        slug: "storage",
        title: "Evidence storage",
        description: "Bundled MinIO or your own S3, and why there are two endpoint variables.",
      },
      {
        slug: "email",
        title: "Email",
        description: "Nobody completes a first login without a mail route. The two ways to provide one.",
      },
      {
        slug: "domains-and-tls",
        title: "Domains and TLS",
        description: "The Caddy profile, the AUTH_URL trap, and when to turn on HSTS.",
      },
      {
        slug: "scheduled-jobs",
        title: "Scheduled jobs",
        description: "Two cron endpoints for deadline reminders and course follow-ups.",
      },
      {
        slug: "updating",
        title: "Updating",
        description: "Version tags, the update command, rollback, and the optional updater container.",
      },
      {
        slug: "backup-and-restore",
        title: "Backup and restore",
        description: "One encrypted archive holding both stores, and the restore procedure that has been run.",
      },
      {
        slug: "troubleshooting",
        title: "Troubleshooting",
        description: "Symptoms, causes, and the commands that tell them apart.",
      },
    ],
  },
  {
    slug: "platform",
    title: "Platform",
    description: "What the software models, and how compliance evidence is recorded.",
    pages: [
      {
        slug: "frameworks",
        title: "Frameworks and requirements",
        description: "219 requirements across five frameworks, and the pairs that satisfy each other.",
      },
      {
        slug: "evidence-and-sign-off",
        title: "Evidence and sign-off",
        description: "Owners, deadlines, sign-offs, and the append-only audit log behind them.",
      },
    ],
  },
  {
    slug: "packages",
    title: "Packages",
    description: "The schemas published on their own, for use without the platform.",
    pages: [
      {
        slug: "npm-packages",
        title: "npm packages",
        description: "Framework data, the incident notification format, and the supplier questionnaire.",
      },
    ],
  },
  {
    slug: "contributing",
    title: "Contributing",
    description: "Working on open-isms itself.",
    pages: [
      {
        slug: "local-development",
        title: "Local development",
        description: "Clone, install, database, and the dev server on port 3026.",
      },
      {
        slug: "project-structure",
        title: "Project structure",
        description: "Where the app ends and the workspace packages begin.",
      },
      {
        slug: "migrations",
        title: "Migrations",
        description: "Three chains, forward-only, and the rules that keep other people's databases safe.",
      },
      {
        slug: "testing",
        title: "Testing",
        description: "Unit tests, end-to-end tests, and the checks CI runs on every push.",
      },
      {
        slug: "releases",
        title: "Releases",
        description: "What a tag triggers, and the gate a release passes before stable moves.",
      },
      {
        slug: "security",
        title: "Security",
        description: "Reporting a vulnerability, and the controls that are actually in place.",
      },
    ],
  },
] as const satisfies readonly DocsSection[];

export interface DocsEntry {
  readonly section: DocsSection;
  readonly page: DocsPage;
  /** `<section>/<page>` — the URL path below /docs and the content path. */
  readonly path: string;
  readonly href: string;
}

/** Every page, in sidebar order. The basis for previous/next and the sitemap. */
export const DOCS_ENTRIES: readonly DocsEntry[] = DOCS_SECTIONS.flatMap(
  (section) =>
    section.pages.map((page) => ({
      section,
      page,
      path: `${section.slug}/${page.slug}`,
      href: `/docs/${section.slug}/${page.slug}`,
    })),
);

export function findEntry(path: string): DocsEntry | undefined {
  return DOCS_ENTRIES.find((entry) => entry.path === path);
}

export interface DocsNeighbours {
  readonly previous?: DocsEntry;
  readonly next?: DocsEntry;
}

export function neighbours(path: string): DocsNeighbours {
  const index = DOCS_ENTRIES.findIndex((entry) => entry.path === path);
  if (index === -1) return {};
  return {
    previous: DOCS_ENTRIES[index - 1],
    next: DOCS_ENTRIES[index + 1],
  };
}
