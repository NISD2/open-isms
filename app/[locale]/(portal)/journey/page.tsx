import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/trpc/server";
import { env } from "@/lib/env";
import { isJourneyAllowed } from "@/lib/journey-flag";
import { QueueList } from "./QueueList";
import { ViewSwitcher } from "./ViewSwitcher";
import { PROJECTIONS, defaultViewFor, liveNode, parseView, type View } from "./views";
import { PathHero } from "./PathHero";
import { PathFlow } from "./PathFlow";
import { buildCategoryNodes, buildRequirementNodes } from "./path-nodes";

export const dynamic = "force-dynamic";

type SearchParams = { view?: string };
type Locale = "en" | "de" | "nl";

export default async function JourneyPage({
  searchParams,
  params,
}: {
  searchParams: Promise<SearchParams>;
  params: Promise<{ locale: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/auth/signin");
  if (!session.companyId) redirect("/dashboard");

  // Internal-domain feature flag. The new journey UX stays gated until
  // it's broadly ready; the existing /portal/dashboard remains canonical
  // for everyone else. Override via JOURNEY_ALLOWED_DOMAINS env var.
  if (!isJourneyAllowed(session.user.email, env.JOURNEY_ALLOWED_DOMAINS)) {
    redirect("/dashboard");
  }

  const { locale: rawLocale } = await params;
  const locale: Locale = (["en", "de", "nl"].includes(rawLocale)
    ? rawLocale
    : "en") as Locale;

  const { view: rawView } = await searchParams;

  const { items, isManagement, aggregate } = await api.journey.getItems({
    locale: locale === "de" ? "de" : "en",
  });

  const view: View = parseView(rawView) ?? defaultViewFor({ isManagement });

  // Novice path view: render the single prescribed next action, not queues.
  if (view === "path") {
    let assetCount = 0;
    try {
      const assets = await api.asset.list();
      assetCount = Array.isArray(assets) ? assets.length : 0;
    } catch {
      assetCount = 0;
    }
    const live = liveNode(items);
    const categoryNodes = buildCategoryNodes(items);
    const reqNodes = buildRequirementNodes(items);
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {locale === "de" ? "Ihr Weg" : "Your path"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {locale === "de"
              ? "Ein Schritt nach dem anderen. Hier ist Ihr nächster."
              : "One step at a time. Here is your next one."}
          </p>
        </div>
        <ViewSwitcher current={view} locale={locale} />
        <AggregateStrip aggregate={aggregate} locale={locale} />
        <PathHero assetCount={assetCount} liveNode={live} locale={locale} />
        <PathFlow
          categoryNodes={categoryNodes}
          reqNodes={reqNodes}
          locale={locale}
        />
        <PathDisclaimer locale={locale} />
      </div>
    );
  }

  // Advanced view = the existing dashboard. Single source of truth.
  if (view === "advanced") {
    redirect("/dashboard");
  }

  const queues = PROJECTIONS[view]({
    userId: session.user.id,
    isManagement,
    items,
  });

  const totalInQueues = Object.values(queues).reduce(
    (sum, q) => sum + q.length,
    0,
  );

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Journey</h1>
        <p className="text-sm text-muted-foreground">
          {locale === "de"
            ? "Was als nächstes ansteht, sortiert nach Ihrer Rolle."
            : "What to do next, sorted by your role."}
        </p>
      </div>

      <ViewSwitcher current={view} locale={locale} />

      <AggregateStrip aggregate={aggregate} locale={locale} />

      {totalInQueues === 0 && aggregate.open > 0 ? (
        <EmptyHandoff view={view} aggregate={aggregate} locale={locale} />
      ) : null}

      <QueueList
        queues={queues}
        emptyLabel={locale === "de" ? "Keine Einträge." : "Nothing here."}
      />
    </div>
  );
}

/**
 * Liability framing for the opinionated journey ordering. The path bands
 * (defensible minimum → over the year → lower priority) sequence mandatory
 * controls by recommended order; they do NOT make lower-priority items optional
 * and the order is not legal advice. Required before the journey is shown
 * beyond internal staff (it is now the default surface for all users).
 */
function PathDisclaimer({ locale }: { locale: Locale }) {
  const text =
    locale === "de"
      ? "Hinweis: Die Reihenfolge ist eine Empfehlung zur Priorisierung, keine Rechtsberatung. Alle Anforderungen bleiben verpflichtend, unabhängig von ihrer Position."
      : locale === "nl"
        ? "Let op: deze volgorde is een aanbevolen prioritering, geen juridisch advies. Elke vereiste blijft verplicht, ongeacht de positie."
        : "Note: this order is a recommended prioritisation, not legal advice. Every requirement stays mandatory regardless of its position.";
  return (
    <p className="rounded-md border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
      {text}
    </p>
  );
}

/** Company-wide aggregate counts, always visible, reality check across views. */
function AggregateStrip({
  aggregate,
  locale,
}: {
  aggregate: {
    total: number;
    done: number;
    awaitingSignoff: number;
    overdue: number;
    open: number;
  };
  locale: Locale;
}) {
  const t = (en: string, de: string) => (locale === "de" ? de : en);
  const pct = aggregate.total > 0
    ? Math.round((aggregate.done / aggregate.total) * 100)
    : 0;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 rounded-md border bg-muted/30 px-3 py-2 text-xs">
      <Stat label={t("Complete", "Erledigt")} value={`${pct}%`} />
      <Stat label={t("Open", "Offen")} value={aggregate.open} />
      <Stat
        label={t("Overdue", "Überfällig")}
        value={aggregate.overdue}
        tone={aggregate.overdue > 0 ? "destructive" : "muted"}
      />
      <Stat
        label={t("Awaiting sign-off", "Warten auf Freigabe")}
        value={aggregate.awaitingSignoff}
      />
      <Stat label={t("Total", "Gesamt")} value={aggregate.total} />
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number | string;
  tone?: "default" | "muted" | "destructive";
}) {
  const valueColor =
    tone === "destructive"
      ? "text-destructive"
      : tone === "muted"
        ? "text-muted-foreground"
        : "text-foreground";
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className={`text-sm font-medium ${valueColor}`}>{value}</div>
    </div>
  );
}

/**
 * Empty-state handoff: when the current view has zero items but the
 * company still has open work, point the user at the view that does
 * show it. Avoids the §38-defence trap of CEO seeing "You're up to date"
 * while overdue items exist company-wide.
 */
function EmptyHandoff({
  view,
  aggregate,
  locale,
}: {
  view: View;
  aggregate: { open: number; overdue: number };
  locale: Locale;
}) {
  const t = (en: string, de: string) => (locale === "de" ? de : en);
  // From CEO view: hand off to CISO. From others: hand off to advanced.
  const targetView: View = view === "ceo" ? "ciso" : "advanced";
  const targetLabel =
    targetView === "ciso"
      ? t("CISO view", "CISO-Ansicht")
      : t("Everything", "Alles");
  return (
    <div className="rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
      <p>
        {t(
          `Nothing requires your action right now. The company still has ${aggregate.open} open item${aggregate.open === 1 ? "" : "s"}${aggregate.overdue > 0 ? ` (${aggregate.overdue} overdue)` : ""}. See them under`,
          `Aktuell nichts für Sie zu tun. Im Unternehmen sind noch ${aggregate.open} Aufgabe${aggregate.open === 1 ? "" : "n"} offen${aggregate.overdue > 0 ? ` (davon ${aggregate.overdue} überfällig)` : ""}. Siehe`,
        )}{" "}
        <Link
          href={{ pathname: "/journey" as const, query: { view: targetView } }}
          className="font-medium text-primary underline underline-offset-2"
        >
          {targetLabel}
        </Link>
        .
      </p>
    </div>
  );
}
