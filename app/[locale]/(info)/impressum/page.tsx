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
    title: t("impressum.meta.title"),
    description: t("impressum.meta.description"),
    alternates: pageAlternates("impressum", locale),
  };
}

export default async function ImpressumPage() {
  const t = await getTranslations("info");

  return (
    <CopyProtected><article>
      <header className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          {t("impressum.title")}
        </h1>
        <p className="text-lg text-muted-foreground">
          {t("impressum.subtitle")}
        </p>
      </header>

      <Separator className="my-8" />

      <section id="responsible">
        <Card>
          <CardHeader>
            <CardTitle>{t("impressum.responsible.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{t("impressum.responsible.company")}</p>
            <p>{t("impressum.responsible.address")}</p>
            <p>{t("impressum.responsible.represented")}</p>
            <p>{t("impressum.responsible.registration")}</p>
            <p>{t("impressum.responsible.euid")}</p>
            <p>{t("impressum.responsible.vatId")}</p>
            <p>{t("impressum.responsible.emailLabel")}: {t("impressum.responsible.email")}</p>
          </CardContent>
        </Card>
      </section>

      <section id="mstv" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("impressum.mstv.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{t("impressum.mstv.name")}</p>
            <p>{t("impressum.mstv.address")}</p>
          </CardContent>
        </Card>
      </section>

      <section id="dispute" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("impressum.dispute.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              {t("impressum.dispute.p1")}{" "}
              <a
                href={t("impressum.dispute.url")}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                {t("impressum.dispute.url")}
              </a>
            </p>
            <p>{t("impressum.dispute.p2")}</p>
          </CardContent>
        </Card>
      </section>

      <section id="liability" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("impressum.liability.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t("impressum.liability.p1")}</p>
            <p>{t("impressum.liability.p2")}</p>
          </CardContent>
        </Card>
      </section>

      <section id="links" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("impressum.links.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t("impressum.links.p1")}</p>
            <p>{t("impressum.links.p2")}</p>
          </CardContent>
        </Card>
      </section>

      <section id="copyright" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("impressum.copyright.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t("impressum.copyright.p1")}</p>
            <p>{t("impressum.copyright.p2")}</p>
          </CardContent>
        </Card>
      </section>
    </article></CopyProtected>
  );
}
