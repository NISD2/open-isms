import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { QuestionnaireAnswers } from "@/components/supplier-portal/questionnaire/QuestionnaireAnswers";
import { QuestionnairePage } from "@/components/supplier-portal/questionnaire/QuestionnairePage";
import { SupplierAppSidebar } from "@/components/supplier-portal/SupplierAppSidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import type { QuestionnairePage as Page } from "@/lib/forms/supplier-portal-sections";
import { loadQuestionnaireGroups } from "@/lib/supplier-portal/questionnaire-view";
import { SAMPLE_CUSTOMERS, SAMPLE_PROFILE, SAMPLE_USER } from "./sample-data";

const PAGES = {
  profile: { nav: "profile", intro: "profileIntro" },
  practices: { nav: "practices", intro: "practicesIntro" },
  serviceType: { nav: "serviceType", intro: "serviceTypeIntro" },
} as const satisfies Record<Page, { nav: string; intro: string }>;

const isPage = (value: string | undefined): value is Page =>
  value !== undefined && value in PAGES;

/**
 * Public design route for the supplier portal, twin of /journey-preview: the real sidebar and the
 * real questionnaire against a made-up supplier, no auth, no DB, so screenshots can be captured in
 * every locale. `?page=profile|practices|serviceType` picks the supplier's page (practices by
 * default), `?page=customer` shows what a customer reads. `notFound()` in production keeps it off
 * nisd2.eu.
 */
export default async function SupplierPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const { page } = await searchParams;
  const [nav, pages] = await Promise.all([
    getTranslations("supplierPortal.nav"),
    getTranslations("supplierPortal.pages"),
  ]);
  const shown: Page = isPage(page) ? page : "practices";

  return (
    <SidebarProvider defaultOpen>
      <SupplierAppSidebar user={SAMPLE_USER} customers={SAMPLE_CUSTOMERS} />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <span className="text-sm font-medium">{nav(PAGES[shown].nav)}</span>
        </header>
        <div className="flex-1 px-4 py-8 sm:px-6">
          {page === "customer" ? (
            <div className="mx-auto max-w-4xl space-y-8">
              <h1 className="text-3xl font-semibold tracking-tight">
                {String(SAMPLE_PROFILE.legalName)}
              </h1>
              <QuestionnaireAnswers
                groups={
                  await loadQuestionnaireGroups(
                    ["profile", "practices", "serviceType"],
                    "customer",
                  )
                }
                answers={SAMPLE_PROFILE}
              />
            </div>
          ) : (
            <QuestionnairePage
              page={shown}
              title={nav(PAGES[shown].nav)}
              intro={pages(PAGES[shown].intro)}
              row={SAMPLE_PROFILE}
              lastSavedAt={null}
            />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
