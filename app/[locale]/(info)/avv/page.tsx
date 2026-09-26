import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalSections } from "@/components/legal/LegalSections";
import { Separator } from "@/components/ui/separator";
import { termsVersionLabel } from "@/lib/billing/terms";
import { pageAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("info");
  return {
    title: t("avvContract.meta.title"),
    description: t("avvContract.meta.description"),
    alternates: pageAlternates("avv", locale),
  };
}

/**
 * The frame that incorporates the Commission's standard contractual clauses (2021/915) by
 * reference, then the four annexes the clauses ask the parties to fill in. The clause text itself is
 * linked, never copied, so it cannot drift from the official wording.
 */
const FRAME = [
  "clauses",
  "conclusion",
  "subprocessorChanges",
  "instructions",
  "liability",
] as const;

const ANNEXES = ["annex1", "annex2", "annex3", "annex4"] as const;

export default async function AvvPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("info");

  return (
    // Not copy-protected: a customer's data protection officer must be able to copy and file it.
    <article>
      <header className="space-y-4">
        <h1 className="font-bold text-4xl tracking-tight">{t("avvContract.title")}</h1>
        <p className="text-lg text-muted-foreground">{t("avvContract.subtitle")}</p>
        <p className="font-medium text-sm">
          {t("avvContract.version", { date: termsVersionLabel(locale) })}
        </p>
      </header>

      <Separator className="my-8" />

      <LegalSections base="avvContract.sections" keys={FRAME} />

      <h2 className="mt-12 mb-6 font-semibold text-2xl">
        {t("avvContract.annexesTitle")}
      </h2>
      <LegalSections base="avvContract.sections" keys={ANNEXES} />
    </article>
  );
}
