import {
  type SupplierResponse,
  supplierQuestionnaire,
  visibleFields,
} from "@nisd2/nis2-supply-chain-questionnaire-schema";
import {
  ArrowRight,
  ChevronRight,
  Code2,
  Database,
  DoorOpen,
  Lock,
  MonitorCog,
} from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { JsonLd } from "@/components/JsonLd";
import { MotionProvider } from "@/components/landing/motion";
import { OpenSourceNote } from "@/components/landing/OpenSourceNote";
import { ScrollShowcase } from "@/components/landing/ScrollShowcase";
import { type ShotName, shotImage, zoomSizes } from "@/components/landing/shots";
import { AutoShot } from "@/components/landing/ZoomShot";
import { PartnerLogoStrip } from "@/components/PartnerLogoStrip";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import {
  buildSoftwareApplicationJsonLd,
  type Locale,
  pageAlternates,
  pageOg,
} from "@/lib/seo";
import { QUESTIONNAIRE_COUNTS } from "@/lib/supplier-questionnaire-text";

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
    // The card comes from the og-shot manifest, which falls back to the home card in a language
    // this page has none for.
    ...pageOg({
      slug: "sicherheitsfragebogen",
      locale,
      title,
      description,
      type: "website",
    }),
  };
}

/** The hero screenshot's width on a large screen: the 72rem column less the 25rem pitch and gap. */
const HERO_SHOT_PX = 704;

/** Sign-up that ends in the supplier portal's setup rather than the walkthrough. */
const SUPPLIER_SIGN_UP = {
  pathname: "/auth/signin",
  query: { callbackUrl: "/portal/supplier-onboarding" },
} as const;

/** The questionnaire in five steps, each with the screenshot that proves it. */
const STEPS = [
  { key: "reach", shot: "reach" },
  { key: "explained", shot: "explained" },
  { key: "privateLink", shot: "privateLink" },
  { key: "inRegister", shot: "inRegister" },
  { key: "lastSaved", shot: "lastSaved" },
] as const satisfies readonly { readonly key: string; readonly shot: ShotName }[];

/** One per entry of `serviceTypes.items`, in the same order. */
const REACH = [
  { key: "data", icon: Database },
  { key: "systems", icon: MonitorCog },
  { key: "premises", icon: DoorOpen },
  { key: "software", icon: Code2 },
] as const;

/** Further reading on nisd2.eu, one card each. */
const RELATED = [
  { key: "portal", href: "/supplier-portal" },
  { key: "questions", href: "/nis2-lieferanten-fragebogen" },
  { key: "openSource", href: "/open-source" },
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

const SECTION = "mx-auto w-full max-w-6xl";
const EYEBROW = "text-xs font-semibold uppercase tracking-wider text-muted-foreground";
const PRIMARY_BUTTON =
  "h-11 rounded-lg px-5 text-[0.9375rem] font-medium shadow-sm transition-shadow hover:shadow-md";

/**
 * The security questionnaire's landing, on nisd2.eu/sicherheitsfragebogen and its own domain. Built
 * like the home page: the headline, the questionnaire as a zooming screenshot, then the steps with
 * one frame that holds while the text scrolls. For the supplier who keeps getting questionnaires.
 */
export default async function SicherheitsfragebogenLanding({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("sicherheitsfragebogen.landing");
  const tMeta = await getTranslations("sicherheitsfragebogen.meta");
  const tLanding = await getTranslations("landing");

  return (
    <MotionProvider>
      <JsonLd
        data={buildSoftwareApplicationJsonLd({
          slug: "sicherheitsfragebogen",
          locale: locale as Locale,
          name: tMeta("title"),
          description: tMeta("description"),
          category: "BusinessApplication",
        })}
      />
      <main className="relative min-h-screen overflow-x-clip px-6 pb-24 pt-20 sm:pt-24">
        {/* Navy dot-grid, densest behind the product, dissolving to the edges */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgb(40 75 99 / 0.06) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            maskImage: "radial-gradient(92% 60% at 64% 24%, black 0%, transparent 78%)",
            WebkitMaskImage:
              "radial-gradient(92% 60% at 64% 24%, black 0%, transparent 78%)",
          }}
        />

        <div className={SECTION}>
          <p className={EYEBROW}>{t("hero.eyebrow")}</p>
          {/* text-3xl on a phone, where "Sicherheitsfragebogen" alone is wider than the column at
              4xl; the copy carries a soft hyphen for where it may break. */}
          <h1 className="mt-4 text-3xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">
            {t.rich("hero.title", {
              blue: (chunks) => <span className="text-primary">{chunks}</span>,
            })}
          </h1>

          <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,25rem)_1fr] lg:items-start">
            <div>
              <p className="max-w-sm text-base leading-relaxed text-muted-foreground">
                {t("hero.subtitle")}
              </p>
              <div className="mt-8 flex flex-col items-start gap-3">
                <Button asChild size="lg" className={PRIMARY_BUTTON}>
                  <Link href={SUPPLIER_SIGN_UP}>{t("hero.ctaPrimary")}</Link>
                </Button>
                <Button
                  asChild
                  variant="link"
                  size="lg"
                  className="group h-auto min-h-11 justify-start whitespace-normal px-0 py-2 text-left has-[>svg]:px-0 text-[0.9375rem] font-medium text-foreground/80 hover:text-foreground hover:no-underline"
                >
                  <Link href="/nis2-lieferanten-fragebogen">
                    {t("hero.allQuestions", { total: QUESTION_COUNTS.total })}
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                </Button>
              </div>
            </div>

            <div
              className="rounded-xl"
              style={{ boxShadow: "0 40px 80px -20px rgb(40 75 99 / 0.28)" }}
            >
              <AutoShot
                image={shotImage("questionnaire", locale, t("hero.shotAlt"))}
                sizes={zoomSizes("questionnaire", HERO_SHOT_PX)}
                rounds={5}
                preload
                className="rounded-xl border border-border/60"
              />
            </div>
          </div>
        </div>

        <section className={`${SECTION} mt-10 sm:mt-12`}>
          <p className={EYEBROW}>{tLanding("partnersLabel")}</p>
          <div className="mt-6">
            <PartnerLogoStrip variant="landing" />
          </div>
        </section>

        <ScrollShowcase
          id="questionnaire-steps-title"
          title={t("showcase.title")}
          lead={t("showcase.lead")}
          steps={STEPS.map((step) => ({
            ...step,
            title: t(`showcase.steps.${step.key}.title`),
            text: t(`showcase.steps.${step.key}.text`, QUESTION_COUNTS),
            alt: t(`showcase.steps.${step.key}.alt`),
          }))}
        />

        {/* What decides the questions: what the supplier reaches at its customers. */}
        <section
          aria-labelledby="reach-title"
          className={`${SECTION} mt-24 border-t border-border/60 pt-10 sm:mt-32`}
        >
          <h2
            id="reach-title"
            className="max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
          >
            {t("serviceTypes.heading")}
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
            {t("serviceTypes.lead", QUESTION_COUNTS)}
          </p>
          <ul className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {REACH.map(({ key, icon: Icon }, index) => (
              <li key={key} className="flex flex-col gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <h3 className="text-base font-medium">
                  {t(`serviceTypes.items.${index}.title`)}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t(`serviceTypes.items.${index}.fields`)}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm text-muted-foreground">
            {t("serviceTypes.example", QUESTION_COUNTS)}
          </p>
        </section>

        {/* Why one questionnaire, in the BSI's words, and who sees the answers. */}
        <section className={`${SECTION} mt-20 border-t border-border/60 pt-10`}>
          <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
            <div>
              <blockquote className="border-l-2 border-primary/30 pl-5">
                <p
                  lang="de"
                  className="text-lg italic leading-relaxed text-foreground/90"
                >
                  „{t("bsi.quote")}“
                </p>
                {locale !== "de" && (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t("bsi.translation")}
                  </p>
                )}
                <footer className="mt-3 text-xs leading-relaxed text-muted-foreground/80">
                  {t("bsi.attribution")}
                </footer>
              </blockquote>
              <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground">
                {t("bsi.context")}
              </p>
            </div>
            <div className="lg:border-l lg:border-border/60 lg:pl-16">
              <h2 className={`flex items-center gap-2 ${EYEBROW}`}>
                <Lock className="h-3.5 w-3.5" />
                {t("privacy.heading")}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {t("privacy.body")}
              </p>
            </div>
          </div>
        </section>

        <section
          className={`${SECTION} mt-24 rounded-3xl bg-primary/[0.06] px-6 py-12 sm:mt-32 sm:px-12 sm:py-16`}
        >
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {t("cta.heading")}
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            {t("cta.body")}
          </p>
          <Button asChild size="lg" className={`mt-8 ${PRIMARY_BUTTON}`}>
            <Link href={SUPPLIER_SIGN_UP}>{t("cta.button")}</Link>
          </Button>
        </section>

        {/* Further reading and open source, split by a hairline like the end of the home page. */}
        <section className={`${SECTION} mt-16 border-t border-border/60 pt-10`}>
          <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
            <div>
              <h2 className={EYEBROW}>{t("related.heading")}</h2>
              <ul className="mt-5 grid gap-4 sm:grid-cols-3">
                {RELATED.map((item) => (
                  // One link per card, so the whole card is the link (stretched over it).
                  <li
                    key={item.key}
                    className="relative flex flex-col gap-2 rounded-xl border border-border/60 bg-background p-4 transition-colors hover:border-primary/40 hover:bg-primary/[0.03] has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring"
                  >
                    <Link
                      href={item.href}
                      className="flex items-start justify-between gap-2 text-sm font-medium after:absolute after:inset-0 focus-visible:outline-none"
                    >
                      {t(`related.${item.key}.title`)}
                      <ChevronRight className="mt-0.5 h-4 w-4 flex-none text-muted-foreground" />
                    </Link>
                    <p className="text-sm leading-snug text-muted-foreground">
                      {t(`related.${item.key}.body`)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
            <OpenSourceNote className="lg:border-l lg:border-border/60 lg:pl-16" />
          </div>
        </section>
      </main>
    </MotionProvider>
  );
}
