import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { pageAlternates } from "@/lib/seo";
import { ogImages } from "@/lib/og-card";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("info");
  return {
    title: t("sicherheit.meta.title"),
    description: t("sicherheit.meta.description"),
    alternates: pageAlternates("sicherheit", locale),
    openGraph: {
      title: t("sicherheit.meta.title"),
      description: t("sicherheit.meta.description"),
      images: ogImages("sicherheit", locale, t("sicherheit.meta.title")),
    },
  };
}

export default async function DisclosurePage() {
  const t = await getTranslations("info");

  const processItems = ["ack", "triage", "patch", "notify", "credit"] as const;
  const scopeItems = ["app", "api", "auth", "data"] as const;
  const outScopeItems = ["social", "dos", "thirdParty"] as const;

  return (
    <article className="space-y-10 max-w-2xl">
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="size-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">{t("sicherheit.title")}</h1>
        </div>
        <p className="text-lg text-muted-foreground">{t("sicherheit.subtitle")}</p>
        <p className="text-muted-foreground">{t("sicherheit.intro")}</p>
      </header>

      <Separator />

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{t("sicherheit.howHeading")}</h2>
        <p className="text-muted-foreground">{t("sicherheit.howP1")}</p>
        <p>
          <a
            href="mailto:security@nisd2.eu"
            className="font-medium underline underline-offset-4 hover:text-muted-foreground transition-colors"
          >
            security@nisd2.eu
          </a>
        </p>
        <p className="text-sm text-muted-foreground">{t("sicherheit.howP2")}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{t("sicherheit.processHeading")}</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {processItems.map((key) => (
            <li key={key} className="flex items-start gap-2">
              <span className="mt-1.5 size-1.5 rounded-full bg-primary shrink-0" />
              <span>{t(`sicherheit.processItems.${key}`)}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-6 sm:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">{t("sicherheit.scopeHeading")}</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {scopeItems.map((key) => (
              <li key={key} className="flex items-start gap-2">
                <span className="mt-1.5 size-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>{t(`sicherheit.scopeItems.${key}`)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">{t("sicherheit.outScopeHeading")}</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {outScopeItems.map((key) => (
              <li key={key} className="flex items-start gap-2">
                <span className="mt-1.5 size-1.5 rounded-full bg-destructive/60 shrink-0" />
                <span>{t(`sicherheit.outScopeItems.${key}`)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{t("sicherheit.policyHeading")}</h2>
        <p className="text-muted-foreground">{t("sicherheit.policyP1")}</p>
      </section>

      <Separator />

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{t("sicherheit.contactHeading")}</h2>
        <p className="text-muted-foreground">
          <a
            href="mailto:security@nisd2.eu"
            className="font-medium underline underline-offset-4 hover:text-foreground transition-colors"
          >
            security@nisd2.eu
          </a>
        </p>
        <p className="text-sm text-muted-foreground">
          <a
            href="/.well-known/security.txt"
            className="underline underline-offset-4 hover:text-foreground transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("sicherheit.securityTxtLink")}
          </a>
        </p>
      </section>
    </article>
  );
}
