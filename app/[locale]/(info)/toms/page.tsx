import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CopyProtected } from "@/components/CopyProtected";
import { pageAlternates } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("info");
  return {
    title: t("toms.meta.title"),
    description: t("toms.meta.description"),
    alternates: pageAlternates("toms", locale),
  };
}

const hostingKeys = ["appServers", "fileStorage", "noUSTransfer"] as const;
const pseudoKeys = ["transit", "rest", "secrets"] as const;
const confidentialityKeys = ["physical", "auth", "rbac", "separation", "secrets"] as const;
const integrityKeys = ["input", "checksum", "transfer", "evidenceHash", "signoff"] as const;
const availabilityKeys = ["backup", "redundancy", "rateLimit", "uploadLimit"] as const;
const evaluationKeys = ["review", "patch", "incident", "code"] as const;

export default async function TomsPage() {
  const t = await getTranslations("info");

  return (
    <CopyProtected><article>
      <header className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">{t("toms.title")}</h1>
        <p className="text-lg text-muted-foreground">{t("toms.subtitle")}</p>
        <p className="text-xs text-muted-foreground">{t("toms.lastUpdated")}</p>
      </header>

      <Separator className="my-8" />

      <section id="intro">
        <Card>
          <CardHeader>
            <CardTitle>{t("toms.intro.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t("toms.intro.p1")}</p>
            <p>{t("toms.intro.p2")}</p>
          </CardContent>
        </Card>
      </section>

      <section id="hosting" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("toms.hosting.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t("toms.hosting.p1")}</p>
            <ul className="space-y-2">
              {hostingKeys.map((key) => (
                <li key={key} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{t(`toms.hosting.items.${key}`)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <section id="pseudonymization" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("toms.pseudonymization.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ul className="space-y-2">
              {pseudoKeys.map((key) => (
                <li key={key} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{t(`toms.pseudonymization.items.${key}`)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <section id="confidentiality" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("toms.confidentiality.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t("toms.confidentiality.p1")}</p>
            <ul className="space-y-2">
              {confidentialityKeys.map((key) => (
                <li key={key} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{t(`toms.confidentiality.items.${key}`)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <section id="integrity" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("toms.integrity.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ul className="space-y-2">
              {integrityKeys.map((key) => (
                <li key={key} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{t(`toms.integrity.items.${key}`)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <section id="availability" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("toms.availability.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ul className="space-y-2">
              {availabilityKeys.map((key) => (
                <li key={key} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{t(`toms.availability.items.${key}`)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <section id="evaluation" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("toms.evaluation.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ul className="space-y-2">
              {evaluationKeys.map((key) => (
                <li key={key} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{t(`toms.evaluation.items.${key}`)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <section id="subprocessors" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("toms.subprocessors.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t("toms.subprocessors.p1")}</p>
            <p>
              <a
                href={t("toms.subprocessors.linkHref")}
                className="underline hover:text-foreground"
              >
                {t("toms.subprocessors.linkLabel")}
              </a>
            </p>
          </CardContent>
        </Card>
      </section>

      <section id="contact" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("toms.contact.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t("toms.contact.p1")}</p>
            <p>
              <a
                href={`mailto:${t("toms.contact.email")}`}
                className="underline hover:text-foreground"
              >
                {t("toms.contact.email")}
              </a>
            </p>
          </CardContent>
        </Card>
      </section>
    </article></CopyProtected>
  );
}
