import {
  type SupplierResponse,
  supplierQuestionnaire,
  visibleFields,
} from "@nisd2/nis2-supply-chain-questionnaire-schema";
import {
  ArrowRight,
  Check,
  ClipboardList,
  Code2,
  Database,
  DoorOpen,
  HelpCircle,
  Mail,
  MonitorCog,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { JsonLd } from "@/components/JsonLd";
import { MarketingHero, Underline } from "@/components/marketing/MarketingHero";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { QUESTIONNAIRE_PAGES } from "@/lib/forms/supplier-portal-sections";
import { pickLocalized } from "@/lib/locale";
import {
  buildSoftwareApplicationJsonLd,
  type Locale,
  pageAlternates,
  pageOg,
} from "@/lib/seo";
import { isoText, QUESTIONNAIRE_COUNTS } from "@/lib/supplier-questionnaire-text";

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
      image: `/og/sicherheitsfragebogen-${locale}.png`,
    }),
  };
}

const stepIcons = [UserPlus, ClipboardList, Mail] as const;
const reachIcons = [Database, MonitorCog, DoorOpen, Code2] as const;

/**
 * Questions the landing shows in full: identity, what the supplier reaches, a choice question,
 * encryption, access to customer systems, certificates. Ids from the questionnaire package; a
 * removed id simply drops out of the preview.
 */
const PREVIEW_IDS = [
  "legalName",
  "accessesCustomerPremises",
  "dataProcessingAgreement",
  "encryptionAtRest",
  // A question id, not a credential: gitleaks' generic rule reads "Access…", the comma and the
  // next id as a key being assigned. `gitleaks:allow` marks it as a known false positive.
  "customerAccessPersonalMfa", // gitleaks:allow
  "hasIso27001OrEquivalent",
] as const;

/** Two suppliers at either end, as their profile answers, to show how far the question count moves. */
const EXAMPLE_ANSWERS = {
  cleaning: { accessesCustomerPremises: true },
  saas: { isSaas: true, processesCustomerData: true },
} as const satisfies Record<string, SupplierResponse>;

const QUESTION_COUNTS = {
  total: QUESTIONNAIRE_COUNTS.total,
  always: QUESTIONNAIRE_COUNTS.always,
  cleaning: visibleFields(supplierQuestionnaire, EXAMPLE_ANSWERS.cleaning).length,
  saas: visibleFields(supplierQuestionnaire, EXAMPLE_ANSWERS.saas).length,
};

const GROUP_KEYS = Object.values(QUESTIONNAIRE_PAGES).flatMap((groups) =>
  groups.map((group) => group.key),
);

type Step = { title: string; body: string };
/**
 * Canonical (DE-key) paths for the related cards. Narrowed to the four routes
 * actually used so the localized <Link> can resolve them: a bare `string`
 * cannot be checked against the pathname map, and rendering these as plain
 * <a href> sent every non-German reader to the German URL, because the
 * canonical key is only the real path in the default locale.
 */
type RelatedHref =
  | "/supplier-portal"
  | "/nis2-lieferanten-fragebogen"
  | "/hilfe"
  | "/open-source";
type RelatedItem = { title: string; body: string; href: RelatedHref };
type ReachBlock = { title: string; fields: string };

export default async function SicherheitsfragebogenLanding({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("sicherheitsfragebogen");
  const tGroups = await getTranslations("supplierPortal.questionnaire.groups");
  const steps = (t.raw("landing.steps.items") as Step[]).map((_, i) => ({
    title: t(`landing.steps.items.${i}.title`),
    body: t(`landing.steps.items.${i}.body`, QUESTION_COUNTS),
  }));
  const reachBlocks = t.raw("landing.serviceTypes.items") as ReachBlock[];
  const related = t.raw("landing.related.items") as RelatedItem[];

  // Help text comes straight from the questionnaire package, in the reader's language where the
  // package carries it and in English otherwise.
  const previewFields = PREVIEW_IDS.map((id) =>
    supplierQuestionnaire.fields.find((f) => f.id === id),
  ).filter((f): f is NonNullable<typeof f> => f !== undefined);

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
      <MarketingHero
        centered
        eyebrow={t("landing.hero.eyebrow")}
        headline={t.rich("landing.hero.headline", {
          u: (chunks) => <Underline>{chunks}</Underline>,
        })}
        accent={t.rich("landing.hero.headlineAccent", {
          u: (chunks) => <Underline>{chunks}</Underline>,
        })}
        subhead={t("landing.hero.subhead")}
      >
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
      </MarketingHero>

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
              <Card key={step.title}>
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
          {GROUP_KEYS.map((key) => (
            <li key={key} className="flex gap-3 rounded-lg border bg-card p-4 text-sm">
              <Check className="mt-0.5 h-4 w-4 flex-none text-primary" />
              <span>
                <span className="block font-medium text-foreground">
                  {tGroups(`${key}.title`)}
                </span>
                <span className="mt-1 block text-muted-foreground">
                  {tGroups(`${key}.why`)}
                </span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-muted-foreground">
          {t("landing.sections.footnote")}
        </p>
      </section>

      {/* Which questions depend on what the supplier reaches at its customers */}
      <section>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("landing.serviceTypes.heading")}
          </h2>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            {t("landing.serviceTypes.lead", QUESTION_COUNTS)}
          </p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {reachBlocks.map((block, i) => {
            const Icon = reachIcons[i];
            return (
              <div key={block.title} className="rounded-lg border bg-card p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{block.title}</h3>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{block.fields}</p>
              </div>
            );
          })}
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          {t("landing.serviceTypes.example", QUESTION_COUNTS)}
        </p>
      </section>

      {/* Sample questions, pulled live from the questionnaire package */}
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
            <div key={field.id} className="rounded-lg border bg-card p-5">
              <h3 className="text-base font-semibold text-foreground">
                {pickLocalized(field.label, locale)}
              </h3>
              <div className="mt-2 flex gap-2 text-sm text-muted-foreground">
                <HelpCircle className="mt-0.5 h-4 w-4 flex-none text-primary" />
                <p>{pickLocalized(field.description, locale)}</p>
              </div>
              {field.options && (
                <ul className="mt-3 space-y-1.5 pl-6 text-sm text-foreground">
                  {field.options.map((option) => (
                    <li key={option.value} className="flex items-start gap-2">
                      <span
                        aria-hidden
                        className="mt-1 h-3 w-3 flex-none rounded-full border border-muted-foreground/50"
                      />
                      {pickLocalized(option.label, locale)}
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                {[field.legalBasis, isoText(field)].filter(Boolean).join(" · ")}
              </p>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          {t("landing.preview.footnote", {
            shown: previewFields.length,
            total: QUESTION_COUNTS.total,
          })}
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
        <p className="mt-3 text-muted-foreground">{t("landing.privacy.body")}</p>
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
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-lg border bg-card p-5 transition hover:border-primary/40 hover:bg-primary/5"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <ArrowRight className="h-4 w-4 flex-none text-muted-foreground transition group-hover:text-primary" />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
