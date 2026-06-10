import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { Separator } from "@/components/ui/separator";
import { CopyProtected } from "@/components/CopyProtected";
import { pageAlternates } from "@/lib/seo";
import { changelog } from "@/lib/changelog/load";
import { ChangelogList } from "@/components/info/ChangelogList";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("info");
  return {
    title: t("changelog.meta.title"),
    description: t("changelog.meta.description"),
    alternates: pageAlternates("changelog", locale),
  };
}

export default async function ChangelogPage() {
  const t = await getTranslations("info");
  const locale = await getLocale();

  return (
    <CopyProtected><article>
      <header className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">{t("changelog.title")}</h1>
        <p className="text-lg text-muted-foreground">{t("changelog.subtitle")}</p>
      </header>

      <Separator className="my-8" />

      <ChangelogList
        entries={changelog.entries}
        locale={locale}
        labels={{
          all: t("changelog.tabs.all"),
          product: t("changelog.tabs.product"),
          content: t("changelog.tabs.content"),
          course: t("changelog.tabs.course"),
          compliance: t("changelog.tabs.compliance"),
          regulatory: t("changelog.tabs.regulatory"),
          empty: t("changelog.empty"),
        }}
      />
    </article></CopyProtected>
  );
}
