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
    title: t("agb.meta.title"),
    description: t("agb.meta.description"),
    alternates: pageAlternates("terms", locale),
  };
}

/** Part A applies to every use of the hosted platform, part B to the paid annual licence. */
const GENERAL = [
  "provider",
  "scope",
  "noLegalAdvice",
  "customerResponsibility",
  "noGuarantee",
  "availability",
  "liability",
  "indemnification",
  "ip",
  "dataProtection",
  "changes",
] as const;

const PAID = [
  "licence",
  "businessOnly",
  "formation",
  "price",
  "payment",
  "term",
  "moneyBack",
  "cancelAfter",
  "nonPayment",
  "endOfContract",
] as const;

const FINAL = ["governing", "language", "severability", "contact"] as const;

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("info");

  return (
    // Not copy-protected: contract terms must be storable by the customer (§ 312i Abs. 1 Nr. 4 BGB).
    <article>
      <header className="space-y-4">
        <h1 className="font-bold text-4xl tracking-tight">{t("agb.title")}</h1>
        <p className="text-lg text-muted-foreground">{t("agb.subtitle")}</p>
        <p className="font-medium text-sm">
          {t("agb.version", { date: termsVersionLabel(locale) })}
        </p>
      </header>

      <Separator className="my-8" />

      <h2 className="mb-6 font-semibold text-2xl">{t("agb.partA")}</h2>
      <LegalSections base="agb.sections" keys={GENERAL} />

      <h2 className="mt-12 mb-6 font-semibold text-2xl">{t("agb.partB")}</h2>
      <LegalSections base="agb.sections" keys={PAID} />

      <h2 className="mt-12 mb-6 font-semibold text-2xl">{t("agb.partC")}</h2>
      <LegalSections base="agb.sections" keys={FINAL} />
    </article>
  );
}
