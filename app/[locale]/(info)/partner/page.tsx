import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CopyProtected } from "@/components/CopyProtected";
import { Separator } from "@/components/ui/separator";
import { ogImages } from "@/lib/og-card";
import { pageAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("info");
  return {
    title: t("partners.meta.title"),
    description: t("partners.meta.description"),
    alternates: pageAlternates("partner", locale),
    openGraph: {
      type: "website",
      images: ogImages("partner", locale, t("partners.meta.title")),
    },
  };
}

/* heightClass is tuned per logo, not shared: these lockups run from 8.9:1 wordmarks
   to a 2.2:1 stacked mark, so one uniform height either drowns the wide ones or
   shrinks the tall ones past legibility. The classes aim for a similar rendered width. */
const programmes = [
  {
    name: "nvidia",
    logo: "/partners/nvidia-inception-program-badge.svg",
    logoWidth: 450,
    logoHeight: 165,
    heightClass: "h-12",
    href: "https://www.nvidia.com/en-us/startups/",
  },
  {
    name: "microsoft",
    logo: "/partners/microsoft-for-startups.png",
    logoWidth: 792,
    logoHeight: 89,
    heightClass: "h-5",
    href: "https://www.microsoft.com/en-us/startups",
  },
  {
    name: "google",
    logo: "/partners/google-for-startups.svg",
    logoWidth: 824,
    logoHeight: 100,
    heightClass: "h-5",
    href: "https://startup.google.com/",
  },
  {
    name: "lambda",
    logo: "/partners/lambda.svg",
    logoWidth: 196,
    logoHeight: 42,
    heightClass: "h-6",
    href: "https://lambda.ai/",
  },
  {
    name: "notion",
    logo: "/partners/notion-for-startups.svg",
    logoWidth: 512,
    logoHeight: 178,
    heightClass: "h-8",
    href: "https://www.notion.com/startups",
  },
  {
    name: "smartcityhouse",
    logo: "/partners/smartcityhouse-logo.png",
    logoWidth: 701,
    logoHeight: 317,
    heightClass: "h-11",
    href: "https://smartcityhouse.de/",
  },
] as const;

export default async function PartnerPage() {
  const t = await getTranslations("info");

  return (
    <CopyProtected>
      <article>
        <header className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">{t("partners.title")}</h1>
          <p className="text-lg text-muted-foreground">{t("partners.subtitle")}</p>
        </header>

        <Separator className="my-8" />

        {/* The ACS Teilnehmer-Logo is shown unaltered on a white plate and carries the
            link the BSI prescribes. Its Nutzungsbedingungen (4)(b) allow only the given
            size and colour, so it stays out of the tinted programme row below. */}
        <section id="mitgliedschaften" className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("partners.memberships.heading")}
          </h2>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <a
              href="https://www.allianz-fuer-cybersicherheit.de"
              title="Verweis zur Webpräsenz der Allianz für Cyber-Sicherheit"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 rounded-md border border-border bg-white p-4"
            >
              {/* biome-ignore lint/performance/noImgElement: fixed-size third-party badge served from public/, next/image adds no value */}
              <img
                src="/partners/acs-teilnehmer.png"
                alt="Webpräsenz der Allianz für Cyber-Sicherheit"
                width={282}
                height={109}
                className="h-[109px] w-[282px]"
              />
            </a>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{t("partners.acs.title")}</p>
              <p>{t("partners.acs.description")}</p>
            </div>
          </div>
        </section>

        <Separator className="my-8" />

        <section id="programme" className="space-y-8">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("partners.programmes.heading")}
          </h2>

          <div className="flex flex-wrap items-center gap-x-12 gap-y-8">
            {programmes.map((programme) => (
              <a
                key={programme.name}
                href={programme.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                {/* biome-ignore lint/performance/noImgElement: programme logos are arbitrary aspect ratios from a static list; next/image adds no value here */}
                <img
                  src={programme.logo}
                  alt={t(`partners.${programme.name}.title`)}
                  width={programme.logoWidth}
                  height={programme.logoHeight}
                  className={`${programme.heightClass} w-auto max-w-[210px] object-contain opacity-60 brightness-0 transition-opacity group-hover:opacity-100 dark:invert`}
                />
              </a>
            ))}
          </div>

          <dl className="grid gap-6 sm:grid-cols-2">
            {programmes.map((programme) => (
              <div key={programme.name}>
                <dt className="font-medium text-foreground">
                  {t(`partners.${programme.name}.title`)}
                </dt>
                <dd className="mt-1 text-sm text-muted-foreground">
                  {t(`partners.${programme.name}.description`)}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <Separator className="my-8" />

        <footer>
          <p className="text-xs text-muted-foreground">{t("partners.legal")}</p>
        </footer>
      </article>
    </CopyProtected>
  );
}
