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
    title: t("avv.meta.title"),
    description: t("avv.meta.description"),
    alternates: pageAlternates("avv", locale),
  };
}

const scopeKeys = [
  "subject",
  "purpose",
  "instructions",
  "confidentiality",
  "toms",
  "subprocessors",
  "rights",
  "audit",
  "deletion",
  "liability",
] as const;

const requestKeys = ["company", "register", "represented", "contact"] as const;

const subprocessorKeys = ["hetzner", "aws", "google", "resend", "xai"] as const;

export default async function AvvPage() {
  const t = await getTranslations("info");

  return (
    <CopyProtected><article>
      <header className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">{t("avv.title")}</h1>
        <p className="text-lg text-muted-foreground">{t("avv.subtitle")}</p>
      </header>

      <Separator className="my-8" />

      <section id="intro">
        <Card>
          <CardHeader>
            <CardTitle>{t("avv.intro.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t("avv.intro.p1")}</p>
            <p>{t("avv.intro.p2")}</p>
          </CardContent>
        </Card>
      </section>

      <section id="scope" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("avv.scope.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t("avv.scope.p1")}</p>
            <ul className="space-y-2">
              {scopeKeys.map((key) => (
                <li key={key} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{t(`avv.scope.items.${key}`)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <section id="request" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("avv.request.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t("avv.request.p1")}</p>
            <ul className="space-y-2">
              {requestKeys.map((key) => (
                <li key={key} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{t(`avv.request.items.${key}`)}</span>
                </li>
              ))}
            </ul>
            <p>{t("avv.request.p2")}</p>
            <p className="pt-2">
              <a
                href={t("avv.request.emailHref")}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                {t("avv.request.emailLabel")}
              </a>
            </p>
          </CardContent>
        </Card>
      </section>

      <section id="subprocessors" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("avv.subprocessors.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t("avv.subprocessors.p1")}</p>
            <ul className="space-y-2">
              {subprocessorKeys.map((key) => (
                <li key={key} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{t(`avv.subprocessors.items.${key}`)}</span>
                </li>
              ))}
            </ul>
            <p>{t("avv.subprocessors.p2")}</p>
          </CardContent>
        </Card>
      </section>

      <section id="toms" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("avv.toms.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t("avv.toms.p1")}</p>
            <p>
              <a
                href={t("avv.toms.linkHref")}
                className="underline hover:text-foreground"
              >
                {t("avv.toms.linkLabel")}
              </a>
            </p>
          </CardContent>
        </Card>
      </section>
    </article></CopyProtected>
  );
}
