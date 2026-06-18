import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { pageAlternates } from "@/lib/seo";
import { ogImages } from "@/lib/og-card";
import { Separator } from "@/components/ui/separator";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("info");
  return {
    title: t("subprozessoren.meta.title"),
    description: t("subprozessoren.meta.description"),
    alternates: pageAlternates("subprozessoren", locale),
    openGraph: {
      images: ogImages("subprozessoren", locale, t("subprozessoren.meta.title")),
    },
  };
}

const processors = [
  {
    key: "hetzner",
    name: "Hetzner Online GmbH",
    location: "Deutschland (DE)",
    basisKey: "EU",
    url: "https://www.hetzner.com",
  },
  {
    key: "aws",
    name: "Amazon Web Services EMEA SARL",
    location: "Luxemburg (EU)",
    basisKey: "EU",
    url: "https://aws.amazon.com/compliance/gdpr-center/",
  },
  {
    key: "google",
    name: "Google Ireland Limited",
    location: "Irland (EU)",
    basisKey: "EU",
    url: "https://policies.google.com/privacy",
  },
  {
    key: "resend",
    name: "Resend Inc.",
    location: "USA",
    basisKey: "SCC",
    url: "https://resend.com/privacy",
  },
  {
    key: "xai",
    name: "xAI Corp.",
    location: "USA",
    basisKey: "SCC",
    url: "https://x.ai/legal/privacy-policy",
  },
] as const;

export default async function SubprocessorsPage() {
  const t = await getTranslations("info");

  return (
    <article className="space-y-10 max-w-3xl">
      <header className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">{t("subprozessoren.title")}</h1>
        <p className="text-lg text-muted-foreground">{t("subprozessoren.subtitle")}</p>
        <p className="text-muted-foreground">{t("subprozessoren.intro")}</p>
        <p className="text-xs text-muted-foreground">{t("subprozessoren.lastUpdated")}</p>
      </header>

      <Separator />

      <section>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 pr-4 font-medium text-muted-foreground">{t("subprozessoren.tableHeaders.name")}</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground">{t("subprozessoren.tableHeaders.purpose")}</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground">{t("subprozessoren.tableHeaders.location")}</th>
                <th className="pb-3 font-medium text-muted-foreground">{t("subprozessoren.tableHeaders.basis")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {processors.map((p) => (
                <tr key={p.key} className="align-top">
                  <td className="py-3 pr-4 font-medium">
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-4 hover:text-muted-foreground transition-colors"
                    >
                      {p.name}
                    </a>
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">{t(`subprozessoren.processors.${p.key}.purpose`)}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{p.location}</td>
                  <td className="py-3 text-muted-foreground">
                    {p.basisKey === "EU"
                      ? t("subprozessoren.basisEU")
                      : t("subprozessoren.basisSCC")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Separator />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t("subprozessoren.noteHeading")}</h2>
        <p className="text-sm text-muted-foreground">{t("subprozessoren.noteBody")}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t("subprozessoren.changesHeading")}</h2>
        <p className="text-sm text-muted-foreground">{t("subprozessoren.changesBody")}</p>
      </section>
    </article>
  );
}
