import { redirect } from "next/navigation";
import { StalledPanel } from "@/components/help/StalledPanel";
import { getSession } from "@/lib/auth";
import { api } from "@/lib/trpc/server";
import { journeyDisclaimer } from "./disclaimer";
import { JourneyHeading, ProgressChip } from "./JourneyHeading";
import { JourneyModeDialog } from "./JourneyModeDialog";
import { JourneyModeToggle } from "./JourneyModeToggle";
import { PathFlow } from "./PathFlow";
import { PathHero } from "./PathHero";
import { buildRequirementNodes } from "./path-nodes";
import { SoloPath } from "./SoloPath";
import { liveNode } from "./views";

export const dynamic = "force-dynamic";

type Locale = "en" | "de" | "nl";

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

  const { locale: rawLocale } = await params;
  const locale: Locale = (
    ["en", "de", "nl"].includes(rawLocale) ? rawLocale : "en"
  ) as Locale;

  const { focus } = await searchParams;
  const focusRaw = Array.isArray(focus) ? focus[0] : focus;
  const focusCategory = focusRaw ? focusRaw.toUpperCase() : null;

  const { items, aggregate, lastActivityAt, mode } = await api.journey.getItems({
    locale: rawLocale,
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
        {mode ? <JourneyModeToggle mode={mode} locale={locale} /> : null}
        <ProgressChip done={aggregate.done} total={aggregate.total} locale={locale} />
      </div>
    </div>
  );

  // No answer means the question was never asked. Ask it over a path that is
  // already drawn, rather than guessing and being wrong for the single
  // implementer the swimlane was never built for. The guided layout renders
  // behind the question because that is the answer we expect from this ICP;
  // picking the team view swaps it on the spot.
  const unanswered = mode === null;

  return (
    <div className="space-y-4">
      {header}
      {unanswered ? <JourneyModeDialog /> : null}
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
          // The tour opens on this anchor, so withholding it until the mode is
          // known is what keeps the walkthrough from starting underneath the
          // question. See tour/steps.ts.
          tourAnchored={!unanswered}
        />
      ) : (
        <SoloPath reqNodes={reqNodes} locale={locale} tourAnchored={!unanswered} />
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
function PathDisclaimer({ locale }: { locale: Locale }) {
  return (
    <p className="rounded-md border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
      {journeyDisclaimer(locale)}
    </p>
  );
}
