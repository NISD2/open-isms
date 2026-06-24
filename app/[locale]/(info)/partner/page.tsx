import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CopyProtected } from "@/components/CopyProtected";
import { pageAlternates } from "@/lib/seo";
import { ogImages } from "@/lib/og-card";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
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

const partners = [
  {
    name: "nvidia-inception",
    logo: "/partners/nvidia-inception.webp",
    href: "https://www.nvidia.com/en-us/startups/",
    titleKey: "nvidia.title",
    descKey: "nvidia.description",
  },
] as const;

export default async function PartnerPage() {
  const t = await getTranslations("info");

  return (
    <CopyProtected><article>
      <header className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">{t("partners.title")}</h1>
        <p className="text-lg text-muted-foreground">{t("partners.subtitle")}</p>
      </header>

      <Separator className="my-8" />

      <section id="partners" className="space-y-4">
        {partners.map((partner) => (
          <Card key={partner.name}>
            <CardHeader>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={partner.logo}
                alt={t(`partners.${partner.titleKey}`)}
                width={300}
                height={184}
                className="h-20 w-auto"
              />
              <CardTitle className="sr-only">{t(`partners.${partner.titleKey}`)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{t(`partners.${partner.titleKey}`)}</p>
              <p>{t(`partners.${partner.descKey}`)}</p>
              <p>
                <a
                  href={partner.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                >
                  {t("partners.learnMore")}
                </a>
              </p>
            </CardContent>
          </Card>
        ))}
      </section>
    </article></CopyProtected>
  );
}
