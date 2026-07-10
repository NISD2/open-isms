import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/portal/AppSidebar";
import { JourneyBoard } from "./JourneyBoard";
import { SAMPLE_FRAMEWORKS, SAMPLE_USER, buildSampleNodes, sampleAggregate } from "./sample-data";
import { titlesFor } from "./sample-titles";

// Public design route for the portal sidebar + journey redesign. No auth, no
// DB — renders the real components with sample data, localized per route locale,
// so the hero image can be screenshotted in every language.
export default async function JourneyPreviewPage() {
  // Design/generation route only: rendered locally to produce the landing hero
  // images. Never served on production, so it is not a public URL on nisd2.eu.
  if (process.env.NODE_ENV === "production") notFound();
  const locale = await getLocale();
  const t = await getTranslations("portal");
  const nodes = buildSampleNodes(titlesFor(locale));
  const aggregate = sampleAggregate(nodes);

  return (
    <SidebarProvider>
      <AppSidebar user={SAMPLE_USER} frameworks={SAMPLE_FRAMEWORKS} />
      <SidebarInset>
        <header className="flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-sm">
          <SidebarTrigger />
          <span className="text-sm font-medium">{t("journey")}</span>
        </header>
        <JourneyBoard reqNodes={nodes} aggregate={aggregate} />
      </SidebarInset>
    </SidebarProvider>
  );
}
