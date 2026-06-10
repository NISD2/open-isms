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
    title: t("datenschutz.meta.title"),
    description: t("datenschutz.meta.description"),
    alternates: pageAlternates("datenschutz", locale),
  };
}

const dataTypes = ["account", "forms", "files", "technical"] as const;
const purposeKeys = ["contract", "auth", "security", "legal"] as const;
const processorKeys = ["google", "aws", "resend", "xai"] as const;
const rightKeys = ["access", "rectification", "erasure", "restriction", "portability", "objection"] as const;

export default async function DatenschutzPage() {
  const t = await getTranslations("info");

  return (
    <CopyProtected><article>
      <header className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          {t("datenschutz.title")}
        </h1>
        <p className="text-lg text-muted-foreground">
          {t("datenschutz.subtitle")}
        </p>
      </header>

      <Separator className="my-8" />

      {/* Responsible Party */}
      <section id="responsible">
        <Card>
          <CardHeader>
            <CardTitle>{t("datenschutz.responsible.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <p>{t("datenschutz.responsible.p1")}</p>
            <p className="mt-3 font-medium text-foreground">{t("datenschutz.responsible.company")}</p>
            <p>{t("datenschutz.responsible.represented")}</p>
            <p>{t("datenschutz.responsible.registration")}</p>
            <p>{t("datenschutz.responsible.address")}</p>
            <p>{t("datenschutz.responsible.emailLabel")}: {t("datenschutz.responsible.email")}</p>
          </CardContent>
        </Card>
      </section>

      {/* Data Collected */}
      <section id="data-collected" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("datenschutz.dataCollected.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t("datenschutz.dataCollected.p1")}</p>
            <ul className="space-y-2">
              {dataTypes.map((key) => (
                <li key={key} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{t(`datenschutz.dataCollected.${key}`)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Purpose */}
      <section id="purpose" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("datenschutz.purpose.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t("datenschutz.purpose.p1")}</p>
            <ul className="space-y-2">
              {purposeKeys.map((key) => (
                <li key={key} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{t(`datenschutz.purpose.items.${key}`)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Third-Party Processors */}
      <section id="processors" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("datenschutz.processors.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t("datenschutz.processors.p1")}</p>
            <ul className="space-y-2">
              {processorKeys.map((key) => (
                <li key={key} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{t(`datenschutz.processors.${key}`)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Analytics */}
      <section id="analytics" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("datenschutz.analytics.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>{t("datenschutz.analytics.p1")}</p>
          </CardContent>
        </Card>
      </section>

      {/* Cookies */}
      <section id="cookies" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("datenschutz.cookies.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t("datenschutz.cookies.p1")}</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>{t("datenschutz.cookies.session")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>{t("datenschutz.cookies.locale")}</span>
              </li>
            </ul>
            <p>{t("datenschutz.cookies.p2")}</p>
          </CardContent>
        </Card>
      </section>

      {/* Rights */}
      <section id="rights" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("datenschutz.rights.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t("datenschutz.rights.p1")}</p>
            <ul className="space-y-2">
              {rightKeys.map((key) => (
                <li key={key} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{t(`datenschutz.rights.${key}`)}</span>
                </li>
              ))}
            </ul>
            <p>{t("datenschutz.rights.p2")}</p>
          </CardContent>
        </Card>
      </section>

      {/* Supervisory Authority */}
      <section id="authority" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("datenschutz.authority.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <p>{t("datenschutz.authority.p1")}</p>
            <p className="mt-3 font-medium text-foreground">{t("datenschutz.authority.name")}</p>
            <p>{t("datenschutz.authority.url")}</p>
          </CardContent>
        </Card>
      </section>

      {/* SSL/TLS */}
      <section id="encryption" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("datenschutz.encryption.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>{t("datenschutz.encryption.p1")}</p>
          </CardContent>
        </Card>
      </section>

      {/* Retention */}
      <section id="retention" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("datenschutz.retention.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>{t("datenschutz.retention.p1")}</p>
          </CardContent>
        </Card>
      </section>

      {/* Changes */}
      <section id="changes" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("datenschutz.changes.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>{t("datenschutz.changes.p1")}</p>
          </CardContent>
        </Card>
      </section>
    </article></CopyProtected>
  );
}
