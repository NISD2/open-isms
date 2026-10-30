import { redirect } from "next/navigation";
import { StalledPanel } from "@/components/help/StalledPanel";
import { getSession } from "@/lib/auth";
import { api } from "@/lib/trpc/server";
import { journeyDisclaimer } from "./disclaimer";
import { JourneyHeading, ProgressChip } from "./JourneyHeading";
import { JourneyModeToggle } from "./JourneyModeToggle";
import { PathFlow } from "./PathFlow";
import { PathHero } from "./PathHero";
import { buildRequirementNodes } from "./path-nodes";
import { SoloPath } from "./SoloPath";
import { liveNode } from "./views";

export const dynamic = "force-dynamic";

export default async function JourneyPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ focus?: string | string[] }>;
}) {
  const session = await getSession();
  if (!session) redirect("/auth/signin");
  if (!session.companyId) redirect("/dashboard");

  // Each journey component picks its own language from the page's: the labels come in German,
  // English and Czech, the disclaimer in Dutch as well.
  const { locale } = await params;

  const { focus } = await searchParams;
  const focusRaw = Array.isArray(focus) ? focus[0] : focus;
  const focusCategory = focusRaw ? focusRaw.toUpperCase() : null;

  const { items, aggregate, lastActivityAt, mode } = await api.journey.getItems({
    locale,
  });

  // A draft company (auto-provisioned at verification) renders the full seeded
  // journey, but its first step is to activate: confirm the real name / sector /
  // entity type. session.companyActivated is the single activation signal.
  const needsActivation = !session.companyActivated;

  let assetCount = 0;
  try {
    const assets = await api.asset.list();
    assetCount = Array.isArray(assets) ? assets.length : 0;
  } catch {
    assetCount = 0;
  }

  const live = liveNode(items);
  const reqNodes = buildRequirementNodes(items);

  const header = (
    <div className="flex items-center justify-between gap-4">
      <JourneyHeading locale={locale} />
      <div className="flex shrink-0 items-center gap-3">
        <JourneyModeToggle mode={mode} locale={locale} />
        <ProgressChip done={aggregate.done} total={aggregate.total} locale={locale} />
      </div>
    </div>
  );

  // The team view is the default: a company that never chose gets it without being asked, and
  // the switch in the header reaches the guided layout in one click (journey.getItems says which).
  return (
    <div className="space-y-4">
      {header}
      <PathHero
        assetCount={assetCount}
        liveNode={live}
        locale={locale}
        needsActivation={needsActivation}
        showLiveStep={mode === "team"}
      />
      {mode === "team" ? (
        <PathFlow
          reqNodes={reqNodes}
          aggregate={aggregate}
          locale={locale}
          focusCategory={focusCategory}
        />
      ) : (
        <SoloPath reqNodes={reqNodes} locale={locale} />
      )}
      {/* Renders itself only after two weeks without a single mutation. */}
      <StalledPanel
        lastActivityAt={lastActivityAt}
        done={aggregate.done}
        total={aggregate.total}
      />
      <PathDisclaimer locale={locale} />
    </div>
  );
}

/** Page-level reuse of the one canonical journey disclaimer. */
function PathDisclaimer({ locale }: { locale: string }) {
  return (
    <p className="rounded-md border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
      {journeyDisclaimer(locale)}
    </p>
  );
}
