import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  ShieldCheck,
  ArrowRight,
  UserPlus,
  ClipboardList,
  Mail,
  Check,
  HelpCircle,
  Cloud,
  HardDrive,
  Users,
  Wrench,
} from "lucide-react";
import { supplierQuestionnaire } from "@nisd2/nis2-supply-chain-questionnaire-schema";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { JsonLd } from "@/components/JsonLd";
import {
  pageAlternates,
  pageOg,
  buildSoftwareApplicationJsonLd,
  type Locale,
} from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("sicherheitsfragebogen");
  const title = t("meta.title");
  const description = t("meta.description");
  return {
    title,
    description,
    alternates: pageAlternates("sicherheitsfragebogen", locale),
    ...pageOg({
      slug: "sicherheitsfragebogen",
      locale,
      title,
      description,
      type: "website",
    }),
  };
}

const stepIcons = [UserPlus, ClipboardList, Mail] as const;
const serviceTypeIcons = [Cloud, HardDrive, Users, Wrench] as const;

type Step = { title: string; body: string };
type RelatedItem = { title: string; body: string; href: string };
type ServiceTypeBlock = { title: string; fields: string };

export default async function SicherheitsfragebogenLanding({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("sicherheitsfragebogen");
  const steps = t.raw("landing.steps.items") as Step[];
  const sections = t.raw("landing.sections.items") as string[];
  const serviceTypes = t.raw("landing.serviceTypes.items") as ServiceTypeBlock[];
  const related = t.raw("landing.related.items") as RelatedItem[];

  // Six representative sample questions pulled directly from the schema
  // package so the landing always shows current help text — no copy
  // duplication, no risk of drift. Covers identity, ISMS baseline, contract
  // clauses, TIPS commitments, AI declarations, and a service-type-conditional
  // section. Schema ships DE+EN; NL renders EN.
  const previewIds = [
    "legalName",
    "hasIsms",
    "acceptRightToAudit",
    "incidentAssistanceCommitment",
    "usesAiSystems",
    "saasHostingRegion",
  ] as const;
  const previewLocale: "de" | "en" = locale === "de" ? "de" : "en";
  const previewFields = previewIds
    .map((id) => supplierQuestionnaire.fields.find((f) => f.id === id))
    .filter((f): f is NonNullable<typeof f> => f !== undefined);

  return (
    <div className="space-y-24">
      <JsonLd
        data={buildSoftwareApplicationJsonLd({
          slug: "sicherheitsfragebogen",
          locale: locale as Locale,
          name: t("meta.title"),
          description: t("meta.description"),
          category: "BusinessApplication",
        })}
      />

      {/* Hero */}
      <section className="text-center">
        <p className="mb-3 text-sm font-medium text-muted-foreground">
          {t("landing.hero.eyebrow")}
        </p>
        <h1 className="mx-auto max-w-3xl text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
          {t("landing.hero.headline")}{" "}
          <span className="text-primary">
            {t("landing.hero.headlineAccent")}
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
          {t("landing.hero.subhead")}
        </p>
        <div className="mt-6 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <ShieldCheck className="h-3 w-3" />
            {t("landing.hero.anchorBadge")}
          </span>
        </div>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-12 gap-2">
            <Link
              href={{
                pathname: "/auth/signin",
                query: { callbackUrl: "/portal/supplier-onboarding" },
              }}
            >
              {t("landing.hero.ctaPrimary")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12">
            <a href="#fragebogen">{t("landing.hero.ctaSecondary")}</a>
          </Button>
        </div>
      </section>

      {/* How it works */}
      <section>
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("landing.steps.heading")}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            {t("landing.steps.lead")}
          </p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {steps.map((step, i) => {
            const Icon = stepIcons[i];
            return (
              <Card key={i}>
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">
                    {i + 1}. {step.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{step.body}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Questionnaire sections */}
      <section id="fragebogen" className="scroll-mt-24">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("landing.sections.heading")}
          </h2>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            {t("landing.sections.lead")}
          </p>
        </div>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {sections.map((section, i) => (
            <li
              key={i}
              className="flex gap-3 rounded-lg border bg-card p-4 text-sm"
            >
              <Check className="mt-0.5 h-4 w-4 flex-none text-primary" />
              <span className="text-foreground">{section}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-muted-foreground">
          {t("landing.sections.footnote")}
        </p>
      </section>

      {/* Service-type conditional sections */}
      <section>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("landing.serviceTypes.heading")}
          </h2>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            {t("landing.serviceTypes.lead")}
          </p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {serviceTypes.map((block, i) => {
            const Icon = serviceTypeIcons[i];
            return (
              <div
                key={i}
                className="rounded-lg border bg-card p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">
                    {block.title}
                  </h3>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {block.fields}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Sample questions — pulled live from the schema */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("landing.preview.heading")}
          </h2>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            {t("landing.preview.lead")}
          </p>
        </div>
        <div className="space-y-4">
          {previewFields.map((field) => (
            <div
              key={field.id}
              className="rounded-lg border bg-card p-5"
            >
              <h3 className="text-base font-semibold text-foreground">
                {field.label[previewLocale]}
              </h3>
              <div className="mt-2 flex gap-2 text-sm text-muted-foreground">
                <HelpCircle className="mt-0.5 h-4 w-4 flex-none text-primary" />
                <p>{field.description[previewLocale]}</p>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {field.legalBasis}
              </p>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          {t("landing.preview.footnote")}
        </p>
      </section>

      {/* BSI quote */}
      <section className="mx-auto max-w-3xl rounded-lg border bg-muted/40 p-6 sm:p-8">
        <blockquote className="text-center text-base italic text-foreground/90 sm:text-lg">
          „{t("landing.bsi.quote")}"
        </blockquote>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t("landing.bsi.attribution")}
        </p>
        <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-muted-foreground">
          {t("landing.bsi.context")}
        </p>
      </section>

      {/* Privacy posture */}
      <section className="mx-auto max-w-3xl rounded-xl border bg-card p-8">
        <h2 className="text-xl font-semibold tracking-tight">
          {t("landing.privacy.heading")}
        </h2>
        <p className="mt-3 text-muted-foreground">
          {t("landing.privacy.body")}
        </p>
      </section>

      {/* Footer CTA */}
      <section className="rounded-xl border bg-primary/5 p-8 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">
          {t("landing.cta.heading")}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          {t("landing.cta.body")}
        </p>
        <div className="mt-6">
          <Button asChild size="lg" className="h-12 gap-2">
            <Link
              href={{
                pathname: "/auth/signin",
                query: { callbackUrl: "/portal/supplier-onboarding" },
              }}
            >
              {t("landing.cta.button")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Related on nisd2.eu */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("landing.related.heading")}
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            {t("landing.related.lead")}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {related.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="group rounded-lg border bg-card p-5 transition hover:border-primary/40 hover:bg-primary/5"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <ArrowRight className="h-4 w-4 flex-none text-muted-foreground transition group-hover:text-primary" />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
