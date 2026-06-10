import type { Metadata } from "next";
import { sql } from "drizzle-orm";
import { getTranslations, getLocale } from "next-intl/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CopyProtected } from "@/components/CopyProtected";
import { pageAlternates } from "@/lib/seo";
import { db } from "@/lib/db";
import incidentsData from "@/data/incidents.json";

export const revalidate = 30;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("info");
  return {
    title: t("status.meta.title"),
    description: t("status.meta.description"),
    alternates: pageAlternates("status", locale),
  };
}

interface Incident {
  date: string;
  titleDe: string;
  titleEn: string;
  bodyDe: string;
  bodyEn: string;
  resolved: boolean;
}

async function checkPlatform(): Promise<"ok" | "error"> {
  try {
    await db.execute(sql`SELECT 1`);
    return "ok";
  } catch {
    return "error";
  }
}

export default async function StatusPage() {
  const t = await getTranslations("info");
  const locale = await getLocale();
  const isDe = locale === "de";

  const platformStatus = await checkPlatform();
  const overall = platformStatus === "ok" ? "operational" : "degraded";
  const incidents = (incidentsData.incidents as Incident[]).slice(0, 10);
  const now = new Date();
  const formatted = now.toLocaleString(isDe ? "de-DE" : "en-GB", {
    dateStyle: "long",
    timeStyle: "short",
  });

  return (
    <CopyProtected><article>
      <header className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">{t("status.title")}</h1>
        <p className="text-lg text-muted-foreground">{t("status.subtitle")}</p>
      </header>

      <Separator className="my-8" />

      <section id="overall">
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="inline-flex items-center gap-3">
                <span
                  className={`inline-block h-3 w-3 rounded-full ${
                    overall === "operational" ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                  aria-hidden
                />
                {t(`status.overall.${overall}`)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <p>{t("status.overall.description")}</p>
            <p className="text-xs">
              {t("status.lastChecked")}: <time dateTime={now.toISOString()}>{formatted}</time>
            </p>
          </CardContent>
        </Card>
      </section>

      <section id="components" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("status.components.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ul className="space-y-2">
              <li className="flex items-center justify-between gap-3">
                <span>{t("status.components.platform")}</span>
                <span className="inline-flex items-center gap-2">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      platformStatus === "ok" ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                    aria-hidden
                  />
                  <span className="text-xs">{t(`status.componentState.${platformStatus}`)}</span>
                </span>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span>{t("status.components.database")}</span>
                <span className="inline-flex items-center gap-2">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      platformStatus === "ok" ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                    aria-hidden
                  />
                  <span className="text-xs">{t(`status.componentState.${platformStatus}`)}</span>
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </section>

      <section id="incidents" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("status.incidents.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {incidents.length === 0 ? (
              <p>{t("status.incidents.none")}</p>
            ) : (
              <ul className="space-y-4">
                {incidents.map((inc) => (
                  <li key={inc.date} className="space-y-1">
                    <p className="flex items-center gap-2">
                      <time dateTime={inc.date} className="text-xs font-mono">{inc.date}</time>
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${
                          inc.resolved ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                        aria-hidden
                      />
                      <span className="text-xs">
                        {inc.resolved
                          ? t("status.incidents.resolved")
                          : t("status.incidents.active")}
                      </span>
                    </p>
                    <p className="font-medium text-foreground">{isDe ? inc.titleDe : inc.titleEn}</p>
                    <p>{isDe ? inc.bodyDe : inc.bodyEn}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <section id="contact" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("status.contact.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t("status.contact.p1")}</p>
            <p>
              <a
                href="mailto:contact@nisd2.eu"
                className="underline hover:text-foreground"
              >
                contact@nisd2.eu
              </a>
            </p>
          </CardContent>
        </Card>
      </section>
    </article></CopyProtected>
  );
}
