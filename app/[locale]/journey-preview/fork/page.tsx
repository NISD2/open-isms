import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { AppSidebar } from "@/components/portal/AppSidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { isDoneStatus } from "@/lib/compliance/journey-position";
import { buildRequirementNodes } from "../../(portal)/journey/path-nodes";
import { liveNode } from "../../(portal)/journey/views";
import { buildFullJourneyItems } from "../full-sample";
import { JourneyPreviewSwitcher } from "../JourneyPreviewSwitcher";
import { SAMPLE_FRAMEWORKS, SAMPLE_USER } from "../sample-data";

type Locale = "en" | "de" | "nl";

/**
 * Design route for the solo/team journey fork. No auth, no DB: the real
 * components render against the real framework definition, so the 49 steps,
 * their titles and their legal references are the ones a seeded company gets.
 * Sibling of /journey-preview, which stays pinned to the landing hero board.
 */
export default async function JourneyForkPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const rawLocale = await getLocale();
  const locale: Locale = (
    ["en", "de", "nl"].includes(rawLocale) ? rawLocale : "en"
  ) as Locale;
  const t = await getTranslations("portal");

  const items = await buildFullJourneyItems(rawLocale);
  const reqNodes = buildRequirementNodes(items);
  const done = items.filter((i) => isDoneStatus(i.status)).length;
  const aggregate = {
    total: items.length,
    done,
    awaitingSignoff: items.filter((i) => i.status === "needs_review").length,
    overdue: items.filter((i) => i.dueInDays !== null && i.dueInDays < 0).length,
    dueSoon: items.filter(
      (i) => i.dueInDays !== null && i.dueInDays >= 0 && i.dueInDays <= 30,
    ).length,
    open: items.length - done,
  };

  return (
    <SidebarProvider>
      <AppSidebar user={SAMPLE_USER} frameworks={SAMPLE_FRAMEWORKS} />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-12 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-sm">
          <SidebarTrigger />
          <span className="text-sm font-medium">{t("journey")}</span>
        </header>
        <JourneyPreviewSwitcher
          reqNodes={reqNodes}
          aggregate={aggregate}
          live={liveNode(items)}
          locale={locale}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
