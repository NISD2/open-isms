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
  const title = t("drataAlternative.meta.title");
  const description = t("drataAlternative.meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("wiki/vergleich/drata-alternative", locale),
    ...pageOg({
      slug: "wiki/vergleich/drata-alternative",
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

export default async function DrataAlternativePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <VendorAlternativePage
      namespace="drataAlternative"
      slug="drata-alternative"
      badge="Drata vs open-isms"
      rawLocale={locale}
    />
  );
}
