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
    title: t("openSource.meta.title"),
    description: t("openSource.meta.description"),
    alternates: pageAlternates("open-source", locale),
    openGraph: {
      type: "website",
      images: ogImages("open-source", locale, t("openSource.meta.title")),
    },
  };
}

const repos = [
  {
    name: "open-isms",
    href: "https://github.com/NISD2/open-isms",
    titleKey: "platform.title",
    descKey: "platform.description",
  },
  {
    name: "nis2-gap-assessment-schema",
    href: "https://github.com/NISD2/nis2-gap-assessment-schema",
    titleKey: "gapAssessment.title",
    descKey: "gapAssessment.description",
  },
  {
    name: "nis2-supply-chain-questionnaire-schema",
    href: "https://github.com/NISD2/nis2-supply-chain-questionnaire-schema",
    titleKey: "supplierQuestionnaire.title",
    descKey: "supplierQuestionnaire.description",
  },
  {
    name: "grc-data-model",
    href: "https://github.com/NISD2/grc-data-model",
    titleKey: "grcDataModel.title",
    descKey: "grcDataModel.description",
  },
  {
    name: "eu-compliance-resources",
    href: "https://github.com/NISD2/eu-compliance-resources",
    titleKey: "euResources.title",
    descKey: "euResources.description",
  },
] as const;

export default async function OpenSourcePage() {
  const t = await getTranslations("info");

  return (
    <CopyProtected><article>
      <header className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">{t("openSource.title")}</h1>
        <p className="text-lg text-muted-foreground">{t("openSource.subtitle")}</p>
      </header>

      <Separator className="my-8" />

      <section id="why">
        <Card>
          <CardHeader>
            <CardTitle>{t("openSource.why.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t("openSource.why.p1")}</p>
            <p>{t("openSource.why.p2")}</p>
          </CardContent>
        </Card>
      </section>

      <section id="repos" className="mt-8 space-y-4">
        <h2 className="text-2xl font-semibold">{t("openSource.repos.heading")}</h2>
        {repos.map((repo) => (
          <Card key={repo.name}>
            <CardHeader>
              <CardTitle className="font-mono text-lg">
                <a
                  href={repo.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  NISD2/{repo.name}
                </a>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">
                {t(`openSource.${repo.titleKey}`)}
              </p>
              <p>{t(`openSource.${repo.descKey}`)}</p>
              <p>
                <a
                  href={repo.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                >
                  {t("openSource.viewOnGitHub")}
                </a>
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section id="licence" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("openSource.licence.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t("openSource.licence.p1")}</p>
            <p>{t("openSource.licence.p2")}</p>
          </CardContent>
        </Card>
      </section>

      <section id="contribute" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("openSource.contribute.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t("openSource.contribute.p1")}</p>
          </CardContent>
        </Card>
      </section>
    </article></CopyProtected>
  );
}
