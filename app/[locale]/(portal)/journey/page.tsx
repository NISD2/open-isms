import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { api } from "@/lib/trpc/server";
import { env } from "@/lib/env";
import { isJourneyAllowed } from "@/lib/journey-flag";
import { liveNode } from "./views";
import { PathHero } from "./PathHero";
import { PathFlow } from "./PathFlow";
import { buildRequirementNodes } from "./path-nodes";
import { journeyDisclaimer } from "./disclaimer";

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

  // Journey gate (defaults open; narrow via JOURNEY_ALLOWED_DOMAINS).
  if (!isJourneyAllowed(session.user.email, env.JOURNEY_ALLOWED_DOMAINS)) {
    redirect("/dashboard");
  }

  const { locale: rawLocale } = await params;
  const locale: Locale = (["en", "de", "nl"].includes(rawLocale)
    ? rawLocale
    : "en") as Locale;

  const { focus } = await searchParams;
  const focusRaw = Array.isArray(focus) ? focus[0] : focus;
  const focusCategory = focusRaw ? focusRaw.toUpperCase() : null;

  const { items, aggregate } = await api.journey.getItems({
    locale: locale === "de" ? "de" : "en",
  });

  let assetCount = 0;
  try {
    const assets = await api.asset.list();
    assetCount = Array.isArray(assets) ? assets.length : 0;
  } catch {
    assetCount = 0;
  }

  const live = liveNode(items);
  const reqNodes = buildRequirementNodes(items);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-semibold tracking-tight">
            {locale === "de" ? "Ihr Weg" : "Your path"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {locale === "de"
              ? "Ein Schritt nach dem anderen. Hier ist Ihr nächster."
              : "One step at a time. Here is your next one."}
          </p>
        </div>
        <ProgressChip done={aggregate.done} total={aggregate.total} locale={locale} />
      </div>
      <PathHero assetCount={assetCount} liveNode={live} locale={locale} />
      <PathFlow
        reqNodes={reqNodes}
        aggregate={aggregate}
        locale={locale}
        focusCategory={focusCategory}
      />
      <PathDisclaimer locale={locale} />
    </div>
  );
}

/** Compact overall-progress indicator for the header (no full-width bar). */
function ProgressChip({
  done,
  total,
  locale,
}: {
  done: number;
  total: number;
  locale: Locale;
}) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="shrink-0 text-right">
      <div className="text-xl font-semibold leading-none tabular-nums">{pct}%</div>
      <div className="mt-1 text-[11px] text-muted-foreground">
        {done}/{total} {locale === "de" ? "erledigt" : "done"}
      </div>
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
