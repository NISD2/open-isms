import { Globe } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { GetStarted } from "@/components/GetStarted";
import { JsonLd } from "@/components/JsonLd";
import { OpenSourceNote } from "@/components/landing/OpenSourceNote";
import { PartnerLogoStrip } from "@/components/PartnerLogoStrip";
import { buildAboutPageJsonLd, type Locale, pageAlternates, pageOg } from "@/lib/seo";

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

function LinkedinIcon({ className }: { className?: string }) {
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
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

const FOUNDERS = [
  {
    name: "Simon Orzel",
    photo: "/images/people/simon-cutout.png",
    role: "simonRole",
    bio: "simon",
    links: [
      { label: "Website", href: "https://sorzel.com", Icon: Globe },
      { label: "GitHub", href: "https://github.com/simonorzel26", Icon: GithubIcon },
      {
        label: "LinkedIn",
        href: "https://www.linkedin.com/in/simon-orzel-5a974b180/",
        Icon: LinkedinIcon,
      },
    ],
  },
  {
    name: "Cory Hisey",
    photo: "/images/people/cory.png",
    role: "coryRole",
    bio: "cory",
    links: [
      { label: "GitHub", href: "https://github.com/CoryHisey", Icon: GithubIcon },
      {
        label: "LinkedIn",
        href: "https://www.linkedin.com/in/cory-hisey/",
        Icon: LinkedinIcon,
      },
    ],
  },
] as const;

const EYEBROW = "text-xs font-semibold uppercase tracking-wider text-muted-foreground";
const SECTION_TITLE = "text-3xl font-semibold tracking-tight text-balance sm:text-4xl";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("info");
  const title = t("teamPage.meta.title");
  const description = t("teamPage.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("about", locale),
    ...pageOg({
      slug: "about",
      locale,
      title,
      description,
      type: "website",
      image: `/og/about-${locale}.png`,
    }),
  };
}

export default async function TeamPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const t = await getTranslations("info");
  const tLanding = await getTranslations("landing");

  return (
    <div className="relative">
      {/* The landing page's navy dot grid, behind the people */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-28 -z-10 h-[44rem]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgb(40 75 99 / 0.06) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          maskImage: "radial-gradient(92% 60% at 64% 24%, black 0%, transparent 78%)",
          WebkitMaskImage:
            "radial-gradient(92% 60% at 64% 24%, black 0%, transparent 78%)",
        }}
      />
      <JsonLd
        data={buildAboutPageJsonLd({
          slug: "about",
          locale,
          name: t("teamPage.meta.title"),
          description: t("teamPage.meta.description"),
        })}
      />

      <header>
        <p className={EYEBROW}>{t("teamPage.badge")}</p>
        <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
          {t("teamPage.title")}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          {t("teamPage.subtitle")}
        </p>
      </header>

      <ul className="mt-14 grid gap-14 md:grid-cols-2 md:gap-12">
        {FOUNDERS.map((founder) => (
          <li key={founder.name}>
            <article>
              <Image
                src={founder.photo}
                alt={founder.name}
                width={128}
                height={128}
                className="size-28 rounded-2xl object-cover sm:size-32"
                style={{ boxShadow: "0 24px 48px -16px rgb(40 75 99 / 0.35)" }}
              />
              <h2 className="mt-7 text-2xl font-semibold tracking-tight">
                {founder.name}
              </h2>
              <p className="mt-1 text-sm font-medium text-primary">
                {t(`teamPage.${founder.role}`)}
              </p>
              <p className="mt-4 text-[0.9375rem] leading-7 text-muted-foreground">
                {t(`teamPage.${founder.bio}`)}
              </p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {founder.links.map(({ label, href, Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      // The chip stays small; its tap area reaches 44px tall (after:-inset-y-2.5).
                      className="relative inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs after:absolute after:-inset-y-2.5 after:inset-x-0 hover:bg-muted"
                    >
                      <Icon className="size-3.5" />
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </article>
          </li>
        ))}
      </ul>

      <section className="mt-20">
        <p className={EYEBROW}>{tLanding("partnersLabel")}</p>
        <div className="mt-6">
          <PartnerLogoStrip variant="landing" />
        </div>
      </section>

      <section className="mt-24 grid gap-6 sm:mt-32 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-16">
        <h2 className={SECTION_TITLE}>{t("teamPage.whyUs.heading")}</h2>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground lg:pt-2">
          {t("teamPage.whyUs.body")}
        </p>
      </section>

      <section className="mt-24 grid gap-6 sm:mt-32 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-16">
        <div>
          <p className={EYEBROW}>{t("mission.badge")}</p>
          <h2 className={`mt-3 ${SECTION_TITLE}`}>{t("mission.subtitle")}</h2>
        </div>
        <div className="max-w-2xl lg:pt-8">
          <div className="space-y-5 text-base leading-relaxed text-muted-foreground">
            <p>{t("mission.problem.p1")}</p>
            <p>
              {t("mission.plan.p1")} {t("mission.plan.p2")}
            </p>
          </div>
          <OpenSourceNote className="mt-10 border-t border-border/60 pt-8" />
        </div>
      </section>

      <GetStarted variant="funnel" className="mt-16" />
    </div>
  );
}
