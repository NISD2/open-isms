import { ArrowRight, Boxes, Building2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { type JourneyLocale, journeyLocaleOf, startLabel } from "./path-nodes";
import type { JourneyItem } from "./views";

const ASSET_TARGET = 5;

const COPY: Record<
  JourneyLocale,
  {
    firstStep: string;
    setUpTitle: string;
    setUpBody: string;
    setUp: string;
    assetsTitle: string;
    assetsBody: string;
    addAssets: string;
    nextUp: string;
    allSet: string;
    recurring: string;
  }
> = {
  en: {
    firstStep: "Your first step",
    setUpTitle: "Set up your organization",
    setUpBody:
      "Confirm your name, sector and entity type. That activates the NIS 2 path below.",
    setUp: "Set up",
    assetsTitle: "Build your asset inventory",
    assetsBody:
      "The foundation the rest of NIS 2 builds on. Add five to unlock the next steps.",
    addAssets: "Add assets",
    nextUp: "Next up",
    allSet: "You are all set",
    recurring: "Recurring tasks appear here when they come up.",
  },
  de: {
    firstStep: "Ihr erster Schritt",
    setUpTitle: "Organisation einrichten",
    setUpBody:
      "Bestätigen Sie Name, Sektor und Einrichtungsart. Damit wird Ihr NIS-2-Weg unten aktiv.",
    setUp: "Einrichten",
    assetsTitle: "Erfassen Sie Ihre Assets",
    assetsBody:
      "Das Fundament, auf dem der Rest von NIS 2 aufbaut. Erfassen Sie fünf, um die nächsten Schritte freizuschalten.",
    addAssets: "Assets hinzufügen",
    nextUp: "Als Nächstes",
    allSet: "Alles erledigt",
    recurring: "Wiederkehrende Aufgaben tauchen hier auf, sobald sie fällig sind.",
  },
  cs: {
    firstStep: "Váš první krok",
    setUpTitle: "Nastavte svou organizaci",
    setUpBody:
      "Potvrďte název, odvětví a typ subjektu. Tím se aktivuje vaše cesta NIS 2 níže.",
    setUp: "Nastavit",
    assetsTitle: "Sepište svá aktiva",
    assetsBody:
      "Základ, na kterém stojí zbytek NIS 2. Přidejte pět aktiv a odemknete další kroky.",
    addAssets: "Přidat aktiva",
    nextUp: "Na řadě",
    allSet: "Vše hotovo",
    recurring: "Opakující se úkoly se zde objeví, až přijdou na řadu.",
  },
};

/**
 * One prescribed next action. The asset inventory (the activation keystone) is
 * still a prominent card because it is genuine onboarding; once that is done
 * the next step is a slim one-line banner so it does not dominate the page.
 *
 * needsActivation: the company is still a draft shell (auto-provisioned at email
 * verification). The first step is to confirm the real identity in the
 * onboarding wizard; it takes precedence over every requirement, which render
 * behind it as the seeded path.
 */
export function PathHero({
  assetCount,
  liveNode,
  locale,
  needsActivation = false,
  showLiveStep = true,
}: {
  assetCount: number;
  liveNode: JourneyItem | null;
  locale: string;
  needsActivation?: boolean;
  /**
   * Draw the next-step line. False for the guided path, which pins the live
   * step in its own bar; the onboarding cards above still render, because
   * those are blockers rather than navigation.
   */
  showLiveStep?: boolean;
}) {
  const lang = journeyLocaleOf(locale);
  const copy = COPY[lang];

  if (needsActivation) {
    return (
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="space-y-0.5">
              <p className="text-xs font-medium uppercase tracking-wide text-primary">
                {copy.firstStep}
              </p>
              <h2 className="text-base font-semibold leading-tight">{copy.setUpTitle}</h2>
              <p className="text-sm text-muted-foreground">{copy.setUpBody}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center sm:justify-end">
            <Button asChild>
              <Link href="/onboarding">
                {copy.setUp}
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (assetCount < ASSET_TARGET) {
    return (
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <Boxes className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="space-y-0.5">
              <p className="text-xs font-medium uppercase tracking-wide text-primary">
                {copy.firstStep}
              </p>
              <h2 className="text-base font-semibold leading-tight">
                {copy.assetsTitle}
              </h2>
              <p className="text-sm text-muted-foreground">{copy.assetsBody}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
            <span className="text-sm font-medium text-muted-foreground">
              {assetCount} / {ASSET_TARGET}
            </span>
            <Button asChild>
              <Link href="/assets">{copy.addAssets}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!showLiveStep) return null;

  if (liveNode) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 sm:px-4">
        <span className="hidden shrink-0 text-xs font-medium uppercase tracking-wide text-primary sm:inline">
          {copy.nextUp}
        </span>
        <span className="shrink-0 font-mono text-xs text-muted-foreground">
          {liveNode.code}
        </span>
        <span className="truncate text-sm font-medium">{liveNode.title}</span>
        <Button asChild size="sm" className="ml-auto shrink-0">
          <Link
            href={{
              pathname: "/compliance/[categorySlug]" as const,
              params: { categorySlug: liveNode.categorySlug },
            }}
          >
            {startLabel(liveNode.state, lang)}
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm sm:px-4">
      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
      <span className="font-medium">{copy.allSet}</span>
      <span className="truncate text-muted-foreground">{copy.recurring}</span>
    </div>
  );
}
