import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { pageAlternates } from "@/lib/seo";
import { Mail } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("info");
  return {
    title: t("corrections.meta.title"),
    description: t("corrections.meta.description"),
    alternates: pageAlternates("corrections", locale),
  };
}

export default async function CorrectionsPage() {
  const t = await getTranslations("info");

  return (
    <div className="space-y-8">
      <header>
        <Badge variant="secondary" className="mb-3">
          {t("corrections.badge")}
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">
          {t("corrections.title")}
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {t("corrections.subtitle")}
        </p>
      </header>

      <Separator />

      <section className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("corrections.body")}
        </p>

        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <Mail className="size-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-medium">{t("corrections.emailLabel")}</p>
              <a
                href="mailto:corrections@nisd2.eu"
                className="text-sm text-primary hover:underline"
              >
                corrections@nisd2.eu
              </a>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground">
          {t("corrections.response")}
        </p>
      </section>
    </div>
  );
}
