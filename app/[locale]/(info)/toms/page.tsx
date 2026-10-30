import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { pageAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("toms");
  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: pageAlternates("toms", locale),
  };
}

// Keys corrected on 26.09.2026 against the code carry new names, so a locale that still has the old
// wording falls back to the corrected English instead of repeating the old claim.
const hostingKeys = ["appServers", "fileStorage", "usServices"] as const;
const pseudoKeys = ["transit", "restStorage", "secrets"] as const;
const confidentialityKeys = [
  "physical",
  "personnel",
  "authMethods",
  "roles",
  "tenantSeparation",
  "secrets",
] as const;
const integrityKeys = [
  "inputLog",
  "rowChecksum",
  "transfer",
  "evidenceHash",
  "signoff",
] as const;
const availabilityKeys = [
  "backupSetup",
  "redundancy",
  "rateLimits",
  "uploadLimit",
  "statusPage",
] as const;
const evaluationKeys = ["review", "dependencyUpdates", "incident", "code"] as const;

export default async function TomsPage() {
  const t = await getTranslations("toms");

  return (
    <article>
      <header className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-lg text-muted-foreground">{t("subtitle")}</p>
        <p className="text-xs text-muted-foreground">{t("revised")}</p>
      </header>

      <Separator className="my-8" />

      <section id="intro">
        <Card>
          <CardHeader>
            <CardTitle>{t("intro.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t("intro.p1")}</p>
            <p>{t("intro.p2")}</p>
          </CardContent>
        </Card>
      </section>

      <section id="hosting" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("hosting.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t("hosting.scopeNote")}</p>
            <ul className="space-y-2">
              {hostingKeys.map((key) => (
                <li key={key} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{t(`hosting.items.${key}`)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <section id="pseudonymization" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("pseudonymization.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ul className="space-y-2">
              {pseudoKeys.map((key) => (
                <li key={key} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{t(`pseudonymization.items.${key}`)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <section id="confidentiality" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("confidentiality.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t("confidentiality.p1")}</p>
            <ul className="space-y-2">
              {confidentialityKeys.map((key) => (
                <li key={key} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{t(`confidentiality.items.${key}`)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <section id="integrity" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("integrity.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ul className="space-y-2">
              {integrityKeys.map((key) => (
                <li key={key} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{t(`integrity.items.${key}`)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <section id="availability" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("availability.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ul className="space-y-2">
              {availabilityKeys.map((key) => (
                <li key={key} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{t(`availability.items.${key}`)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <section id="evaluation" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("evaluation.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ul className="space-y-2">
              {evaluationKeys.map((key) => (
                <li key={key} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{t(`evaluation.items.${key}`)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <section id="subprocessors" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("subprocessors.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t("subprocessors.p1")}</p>
            <p>
              <a
                href={t("subprocessors.linkHref")}
                className="underline hover:text-foreground"
              >
                {t("subprocessors.linkLabel")}
              </a>
            </p>
          </CardContent>
        </Card>
      </section>

      <section id="contact" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("contact.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t("contact.p1")}</p>
            <p>
              <a
                href={`mailto:${t("contact.email")}`}
                className="underline hover:text-foreground"
              >
                {t("contact.email")}
              </a>
            </p>
          </CardContent>
        </Card>
      </section>
    </article>
  );
}
