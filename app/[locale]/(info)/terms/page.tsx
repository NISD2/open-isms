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
    title: t("terms.meta.title"),
    description: t("terms.meta.description"),
    alternates: pageAlternates("terms", locale),
  };
}

const customerResponsibilityKeys = ["accuracy", "applicability", "compliance", "decisions", "review"] as const;
const noGuaranteeKeys = ["audit", "compliant", "penalty", "requirements"] as const;
const indemnificationKeys = ["misuse", "data", "claims"] as const;

export default async function TermsPage() {
  const t = await getTranslations("info");

  return (
    <CopyProtected><article>
      <header className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          {t("terms.title")}
        </h1>
        <p className="text-lg text-muted-foreground">
          {t("terms.subtitle")}
        </p>
        <p className="text-sm text-muted-foreground">
          {t("terms.lastUpdated")}
        </p>
      </header>

      <Separator className="my-8" />

      {/* 1. Scope of Service */}
      <section id="scope">
        <Card>
          <CardHeader>
            <CardTitle>{t("terms.scope.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t("terms.scope.p1")}</p>
            <p className="font-medium text-foreground">{t("terms.scope.p2")}</p>
          </CardContent>
        </Card>
      </section>

      {/* 2. No Legal Advice */}
      <section id="no-legal-advice" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("terms.noLegalAdvice.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{t("terms.noLegalAdvice.p1")}</p>
            <p>{t("terms.noLegalAdvice.p2")}</p>
            <p>{t("terms.noLegalAdvice.p3")}</p>
          </CardContent>
        </Card>
      </section>

      {/* 3. Customer Responsibility */}
      <section id="customer-responsibility" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("terms.customerResponsibility.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t("terms.customerResponsibility.p1")}</p>
            <ul className="space-y-2">
              {customerResponsibilityKeys.map((key) => (
                <li key={key} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{t(`terms.customerResponsibility.items.${key}`)}</span>
                </li>
              ))}
            </ul>
            <p className="font-medium text-foreground">{t("terms.customerResponsibility.p2")}</p>
          </CardContent>
        </Card>
      </section>

      {/* 4. No Guarantee */}
      <section id="no-guarantee" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("terms.noGuarantee.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t("terms.noGuarantee.p1")}</p>
            <ul className="space-y-2">
              {noGuaranteeKeys.map((key) => (
                <li key={key} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{t(`terms.noGuarantee.items.${key}`)}</span>
                </li>
              ))}
            </ul>
            <p>{t("terms.noGuarantee.p2")}</p>
          </CardContent>
        </Card>
      </section>

      {/* 5. Limitation of Liability */}
      <section id="liability" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("terms.liability.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t("terms.liability.p1")}</p>
            <p>{t("terms.liability.p2")}</p>
            <p>{t("terms.liability.p3")}</p>
          </CardContent>
        </Card>
      </section>

      {/* 6. Indemnification */}
      <section id="indemnification" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("terms.indemnification.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t("terms.indemnification.p1")}</p>
            <ul className="space-y-2">
              {indemnificationKeys.map((key) => (
                <li key={key} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{t(`terms.indemnification.items.${key}`)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* 7. Intellectual Property */}
      <section id="ip" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("terms.ip.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t("terms.ip.p1")}</p>
            <p>{t("terms.ip.p2")}</p>
          </CardContent>
        </Card>
      </section>

      {/* 8. Availability */}
      <section id="availability" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("terms.availability.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>{t("terms.availability.p1")}</p>
          </CardContent>
        </Card>
      </section>

      {/* 9. Changes */}
      <section id="changes" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("terms.changes.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>{t("terms.changes.p1")}</p>
          </CardContent>
        </Card>
      </section>

      {/* 10. Governing Law */}
      <section id="governing" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("terms.governing.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>{t("terms.governing.p1")}</p>
          </CardContent>
        </Card>
      </section>

      {/* 11. Severability */}
      <section id="severability" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("terms.severability.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>{t("terms.severability.p1")}</p>
          </CardContent>
        </Card>
      </section>

      {/* 12. Contact */}
      <section id="contact" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("terms.contact.heading")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <p>{t("terms.contact.p1")}</p>
            <p className="mt-3 font-medium text-foreground">{t("terms.contact.name")}</p>
            <p>{t("terms.contact.address")}</p>
            <p>{t("terms.contact.emailLabel")}: {t("terms.contact.email")}</p>
          </CardContent>
        </Card>
      </section>
    </article></CopyProtected>
  );
}
