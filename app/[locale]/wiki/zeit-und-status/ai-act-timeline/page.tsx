import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { TimelinePage } from "@/components/info/TimelinePage";
import { pageAlternates, pageOg } from "@/lib/seo";

const SLUG = "ai-act-timeline";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("timelines.aiActTimeline");
  const title = t("meta.title");
  const description = t("meta.description");
  return {
    title,
    description,
    alternates: pageAlternates(`wiki/zeit-und-status/${SLUG}`, locale),
    ...pageOg({
      slug: `wiki/zeit-und-status/${SLUG}`,
      locale,
      title,
      description,
      type: "article",
    }),
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <TimelinePage
      locale={locale}
      slug={SLUG}
      timeline="ai-act"
      messages="aiActTimeline"
      law="ai-act"
    />
  );
}
