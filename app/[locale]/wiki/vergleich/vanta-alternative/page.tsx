import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { pageAlternates, pageOg } from "@/lib/seo";
import { VendorAlternativePage } from "@/components/wiki/VendorAlternativePage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("info");
  const title = t("vantaAlternative.meta.title");
  const description = t("vantaAlternative.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/vergleich/vanta-alternative", locale),
    ...pageOg({
      slug: "wiki/vergleich/vanta-alternative",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

export default async function VantaAlternativePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <VendorAlternativePage
      namespace="vantaAlternative"
      slug="vanta-alternative"
      badge="Vanta vs open-isms"
      rawLocale={locale}
    />
  );
}
