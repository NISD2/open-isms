import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowRight, ShieldCheck, FileCheck2, Bell, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingHero } from "@/components/marketing/MarketingHero";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("supplierPortal.marketing");
  return {
    title: t("headline1"),
    description: t("intro").replace(/<[^>]+>/g, ""),
  };
}

export default async function SupplierPortalLandingPage() {
  const t = await getTranslations("supplierPortal.marketing");

  return (
    <>
      {/* Hero */}
      <div className="mb-16">
        <MarketingHero
          centered
          eyebrow={t("eyebrow")}
          headline={t("headline1")}
          accent={t("headline2")}
          subhead={t.rich("intro", {
            strong: (chunks) => (
              <strong className="text-foreground">{chunks}</strong>
            ),
          })}
        >
          <div className="mt-6 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <ShieldCheck className="h-3 w-3" />
              {t("anchorBadge")}
            </span>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="h-12 gap-2">
              <Link href="/auth/signin">
                {t("ctaCreate")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12">
              <Link href="/applicability">{t("ctaEntity")}</Link>
            </Button>
          </div>
        </MarketingHero>
      </div>

      {/* BSI quote */}
      <section className="rounded-lg border bg-muted/40 p-6 sm:p-8 mb-16">
        <blockquote className="text-base sm:text-lg italic text-foreground/90 max-w-3xl mx-auto text-center">
          „{t("bsiQuote")}"
        </blockquote>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t("bsiAttribution")}
        </p>
      </section>

      {/* Benefits */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-16">
        <BenefitCard
          icon={<FileCheck2 className="h-5 w-5" />}
          title={t("benefit1Title")}
          body={t("benefit1Body")}
        />
        <BenefitCard
          icon={<ShieldCheck className="h-5 w-5" />}
          title={t("benefit2Title")}
          body={t("benefit2Body")}
        />
        <BenefitCard
          icon={<Bell className="h-5 w-5" />}
          title={t("benefit3Title")}
          body={t("benefit3Body")}
        />
        <BenefitCard
          icon={<Globe className="h-5 w-5" />}
          title={t("benefit4Title")}
          body={t("benefit4Body")}
        />
      </section>

      {/* CTA */}
      <section className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight mb-3">
          {t("footerHeadline")}
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto mb-6">
          {t("footerBody")}
        </p>
        <Button asChild size="lg" className="h-12 gap-2">
          <Link href="/auth/signin">
            {t("footerCta")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </section>
    </>
  );
}

function BenefitCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="rounded-md bg-primary/10 text-primary p-2">{icon}</span>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}
