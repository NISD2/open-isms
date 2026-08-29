/**
 * Table of contents for /docs — the developer and operator documentation
 * for open-isms itself. Not to be confused with /wiki, which is the
 * NIS 2 subject-matter encyclopedia for a German-speaking audience.
 *
 * Single source of truth for the sidebar, the docs landing page, the
 * previous/next links, the sitemap entries, `generateStaticParams`, the
 * per-page metadata and the JSON-LD. A page exists here or it does not exist
 * at all; every entry must have a matching `content/docs/<section>/<page>.md`,
 * which a unit test asserts.
 *
 * English only, on purpose. The rest of the site is translated into ten
 * languages because its readers are German Geschäftsführer and their EU
 * equivalents. These pages are read by whoever installs and runs the
 * software, and that audience already reads English documentation all day.
 * Ten machine translations of a `docker compose` walkthrough would be ten
 * more things to keep true.
 *
 * On the two title fields: `title` is the navigation label, which has to stay
 * short enough to sit in a sidebar and read as part of a list. `seoTitle` is
 * what goes in the <title> tag and in the JSON-LD headline, where "Email" or
 * "Requirements" alone would be meaningless in a result page. Both are
 * required to be distinct in intent; keeping one field and truncating it
 * would compromise both jobs.
 */

export interface DocsPage {
  /** URL segment and markdown filename, without extension. */
  readonly slug: string;
  /** Navigation label. Short, reads as part of a list. */
  readonly title: string;
  /** <title> tag and JSON-LD headline. Aim for 50 to 60 characters. */
  readonly seoTitle: string;
  /** One line. Section card, search, and the meta description. */
  readonly description: string;
  /** What this page should be findable by. Four to six, no padding. */
  readonly keywords: readonly string[];
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
        seoTitle: "Open source ISMS for the EU NIS 2 Directive",
        description:
          "An open-source ISMS for the EU NIS 2 Directive, and what it does not do.",
        keywords: [
          "open source ISMS",
          "NIS 2 compliance software",
          "AGPL ISMS",
          "NIS 2 Directive tooling",
          "GRC open source",
        ],
      },
      {
        slug: "quickstart",
        title: "Quickstart",
        seoTitle: "Install a self-hosted NIS 2 ISMS in one command",
        description:
          "One command, about ten minutes, and no Docker knowledge required.",
        keywords: [
          "self-hosted ISMS install",
          "docker compose ISMS",
          "NIS 2 software quickstart",
          "install open-isms",
        ],
      },
      {
        slug: "how-it-works",
        title: "How it works",
        seoTitle: "How open-isms runs: image, database, migrations",
        description:
          "The image, the database, the object store, and what happens at container start.",
        keywords: [
          "ISMS architecture",
          "database migrations at startup",
          "multi-arch container image",
          "self-hosted architecture",
        ],
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
        seoTitle: "Self-hosting requirements: Docker, Postgres, ARM64",
        description:
          "Hardware, architectures, Postgres versions, and what you do not need.",
        keywords: [
          "self-hosting requirements",
          "ARM64 docker image",
          "Postgres 17",
          "NAS compliance software",
        ],
      },
      {
        slug: "installation",
        title: "Installation",
        seoTitle: "Install open-isms on your own server",
        description:
          "The full walkthrough, including the optional compose profiles.",
        keywords: [
          "install ISMS on server",
          "docker compose profiles",
          "self-hosted compliance platform",
          "Caddy automatic HTTPS",
        ],
      },
      {
        slug: "synology",
        title: "Synology NAS",
        seoTitle: "Run a NIS 2 ISMS on a Synology NAS",
        description:
          "The path most Mittelstand operators actually take, with or without a terminal.",
        keywords: [
          "Synology Container Manager",
          "NAS self-hosting",
          "DSM 7.2 docker compose",
          "ISMS on a NAS",
        ],
      },
      {
        slug: "configuration",
        title: "Configuration",
        seoTitle: "Environment variable reference for open-isms",
        description:
          "Every environment variable, what breaks without it, and which two are mandatory.",
        keywords: [
          "environment variables reference",
          "AUTH_SECRET",
          "self-hosted configuration",
          "docker env file",
        ],
      },
      {
        slug: "framework-data",
        title: "Framework data",
        seoTitle: "NIS 2 framework data: what loads, and when",
        description:
          "Seeding NIS 2 and ISO 27001. Migrations create the tables; they do not fill them.",
        keywords: [
          "NIS 2 requirements database",
          "framework seed data",
          "ISO 27001 reference data",
          "requirement catalogue",
        ],
      },
      {
        slug: "storage",
        title: "Evidence storage",
        seoTitle: "Evidence storage with MinIO or your own S3",
        description:
          "Bundled MinIO or your own S3, and why there are two endpoint variables.",
        keywords: [
          "MinIO evidence storage",
          "S3 presigned upload",
          "self-hosted object storage",
          "compliance evidence files",
        ],
      },
      {
        slug: "email",
        title: "Email",
        seoTitle: "Email setup, and a first login without a provider",
        description:
          "Nobody completes a first login without a mail route. The two ways to provide one.",
        keywords: [
          "one-time code email",
          "Resend API key",
          "self-hosted email setup",
          "first login without email",
        ],
      },
      {
        slug: "domains-and-tls",
        title: "Domains and TLS",
        seoTitle: "Domains, TLS, and the AUTH_URL trap",
        description:
          "The Caddy profile, the AUTH_URL trap, and when to turn on HSTS.",
        keywords: [
          "AUTH_URL cookie",
          "Caddy reverse proxy",
          "self-hosted HTTPS",
          "HSTS",
        ],
      },
      {
        slug: "scheduled-jobs",
        title: "Scheduled jobs",
        seoTitle: "Cron endpoints for deadlines and housekeeping",
        description:
          "Two cron endpoints for deadline reminders, escalation and GDPR retention.",
        keywords: [
          "cron endpoint bearer token",
          "deadline reminders",
          "GDPR retention job",
          "scheduled tasks",
        ],
      },
      {
        slug: "updating",
        title: "Updating",
        seoTitle: "Updating and rolling back a self-hosted instance",
        description:
          "Version tags, the update command, rollback, and the optional updater container.",
        keywords: [
          "docker compose update",
          "rollback release",
          "watchtower updater",
          "air-gapped update",
        ],
      },
      {
        slug: "backup-and-restore",
        title: "Backup and restore",
        seoTitle: "Backup and restore for a compliance database",
        description:
          "One encrypted archive holding both stores, and a restore procedure that has been run.",
        keywords: [
          "encrypted backup",
          "pg_dump restore",
          "backup drill",
          "compliance evidence backup",
        ],
      },
      {
        slug: "troubleshooting",
        title: "Troubleshooting",
        seoTitle: "Troubleshooting a self-hosted NIS 2 ISMS",
        description:
          "Symptoms, causes, and the commands that tell them apart.",
        keywords: [
          "container restart loop",
          "login redirect loop",
          "port already allocated",
          "CSP upload error",
        ],
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
        seoTitle: "NIS 2, GDPR, AI Act, CRA and ISO 27001 as data",
        description:
          "219 requirements across five frameworks, and the pairs that satisfy each other.",
        keywords: [
          "NIS 2 requirements list",
          "ISO 27001 NIS 2 mapping",
          "cross-framework crosswalk",
          "GDPR AI Act CRA",
        ],
      },
      {
        slug: "evidence-and-sign-off",
        title: "Evidence and sign-off",
        seoTitle: "Evidence, sign-off and a tamper-evident audit trail",
        description:
          "Owners, deadlines, sign-offs, and the append-only audit log behind them.",
        keywords: [
          "audit trail hash chain",
          "compliance sign-off",
          "evidence versioning",
          "tamper-evident log",
        ],
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
        seoTitle: "NIS 2 requirements and schemas on npm",
        description:
          "Framework data, the incident notification format, and the supplier questionnaire.",
        keywords: [
          "NIS 2 npm package",
          "incident notification schema",
          "supplier questionnaire schema",
          "grc data model",
        ],
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
        seoTitle: "Run open-isms locally with Bun and Postgres",
        description:
          "Clone, install, database, and the dev server on port 3026.",
        keywords: [
          "local development setup",
          "bun dev server",
          "drizzle seed",
          "contributing setup",
        ],
      },
      {
        slug: "project-structure",
        title: "Project structure",
        seoTitle: "open-isms project structure and workspace layout",
        description:
          "Where the app ends and the workspace packages begin.",
        keywords: [
          "monorepo layout",
          "bun workspaces",
          "Next.js app router structure",
          "where to put a change",
        ],
      },
      {
        slug: "migrations",
        title: "Migrations",
        seoTitle: "Migration policy for other people's databases",
        description:
          "Three chains, forward-only, and the rules that keep other people's databases safe.",
        keywords: [
          "drizzle migrations",
          "expand and contract",
          "forward-only migrations",
          "migration safety rules",
        ],
      },
      {
        slug: "testing",
        title: "Testing",
        seoTitle: "Tests, drills, and what CI runs on every push",
        description:
          "Unit tests, end-to-end tests, and the checks CI runs on every push.",
        keywords: [
          "playwright end to end",
          "backup restore drill",
          "migration failure drill",
          "CI checks",
        ],
      },
      {
        slug: "releases",
        title: "Releases",
        seoTitle: "How an open-isms release is built and promoted",
        description:
          "What a tag triggers, and the gate a release passes before stable moves.",
        keywords: [
          "release pipeline",
          "multi-arch build",
          "upgrade gate",
          "container image promotion",
        ],
      },
      {
        slug: "security",
        title: "Security",
        seoTitle: "Security policy, and what is actually in place",
        description:
          "Reporting a vulnerability, and the controls that are actually in place.",
        keywords: [
          "vulnerability disclosure",
          "security policy",
          "default deny authorisation",
          "tenant isolation",
        ],
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
