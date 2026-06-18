import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { pageAlternates } from "@/lib/seo";
import { ogImages } from "@/lib/og-card";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, ArrowRight, Server, Scale, Shield, Eye } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("info");
  return {
    title: t("vertrauen.meta.title"),
    description: t("vertrauen.meta.description"),
    alternates: pageAlternates("vertrauen", locale),
    openGraph: {
      images: ogImages("vertrauen", locale, t("vertrauen.meta.title")),
    },
  };
}

export default async function TrustCenterPage() {
  const t = await getTranslations("info");

  return (
    <div className="space-y-10">
      <header className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">{t("vertrauen.title")}</h1>
        <p className="text-lg text-muted-foreground max-w-2xl">{t("vertrauen.subtitle")}</p>
        <p className="text-muted-foreground max-w-2xl">{t("vertrauen.intro")}</p>
      </header>

      <Separator />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Legal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Scale className="size-4 text-muted-foreground" />
              {t("vertrauen.sections.legal.heading")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <TrustLink href="/avv" label={t("vertrauen.sections.legal.avv.title")} description={t("vertrauen.sections.legal.avv.description")} viewLabel={t("vertrauen.viewDoc")} />
            <TrustLink href="/toms" label={t("vertrauen.sections.legal.toms.title")} description={t("vertrauen.sections.legal.toms.description")} viewLabel={t("vertrauen.viewDoc")} />
            <TrustLink href="/datenschutz" label={t("vertrauen.sections.legal.datenschutz.title")} description={t("vertrauen.sections.legal.datenschutz.description")} viewLabel={t("vertrauen.viewDoc")} />
          </CardContent>
        </Card>

        {/* Infrastructure */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Server className="size-4 text-muted-foreground" />
              {t("vertrauen.sections.infrastructure.heading")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("vertrauen.sections.infrastructure.hosting")}</p>
            <TrustLink href="/subprozessoren" label={t("vertrauen.sections.infrastructure.subprocessors.title")} description={t("vertrauen.sections.infrastructure.subprocessors.description")} viewLabel={t("vertrauen.viewDoc")} />
            <TrustLink href="/status" label={t("vertrauen.sections.infrastructure.status.title")} description={t("vertrauen.sections.infrastructure.status.description")} viewLabel={t("vertrauen.viewDoc")} />
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="size-4 text-muted-foreground" />
              {t("vertrauen.sections.security.heading")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <TrustLink href="/open-source" label={t("vertrauen.sections.security.openSource.title")} description={t("vertrauen.sections.security.openSource.description")} viewLabel={t("vertrauen.viewDoc")} />
            <TrustLink href="/sicherheit" label={t("vertrauen.sections.security.disclosure.title")} description={t("vertrauen.sections.security.disclosure.description")} viewLabel={t("vertrauen.viewDoc")} />
            <TrustExternalLink href="/.well-known/security.txt" label={t("vertrauen.sections.security.securityTxt.title")} description={t("vertrauen.sections.security.securityTxt.description")} viewLabel={t("vertrauen.viewDoc")} />
          </CardContent>
        </Card>

        {/* Transparency */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="size-4 text-muted-foreground" />
              {t("vertrauen.sections.trust.heading")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <TrustLink href="/changelog" label={t("vertrauen.sections.trust.changelog.title")} description={t("vertrauen.sections.trust.changelog.description")} viewLabel={t("vertrauen.viewDoc")} />
            <TrustLink href="/corrections" label={t("vertrauen.sections.trust.corrections.title")} description={t("vertrauen.sections.trust.corrections.description")} viewLabel={t("vertrauen.viewDoc")} />
          </CardContent>
        </Card>
      </div>

      <Separator />

      <p className="text-sm text-muted-foreground">
        {t("vertrauen.contact")}{" "}
        <a
          href="mailto:security@nisd2.eu"
          className="underline underline-offset-4 hover:text-foreground transition-colors"
        >
          security@nisd2.eu
        </a>
      </p>
    </div>
  );
}

function TrustLink({ href, label, description, viewLabel }: { href: string; label: string; description: string; viewLabel: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Link
        href={href as Parameters<typeof Link>[0]["href"]}
        className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {viewLabel}
        <ArrowRight className="size-3" />
      </Link>
    </div>
  );
}

function TrustExternalLink({ href, label, description, viewLabel }: { href: string; label: string; description: string; viewLabel: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {viewLabel}
        <ExternalLink className="size-3" />
      </a>
    </div>
  );
}
