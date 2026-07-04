import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Boxes, Building2, CheckCircle2 } from "lucide-react";
import type { JourneyItem } from "./views";

type Locale = "en" | "de" | "nl";

const ASSET_TARGET = 5;

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
}: {
  assetCount: number;
  liveNode: JourneyItem | null;
  locale: Locale;
  needsActivation?: boolean;
}) {
  const de = locale === "de";

  if (needsActivation) {
    return (
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="space-y-0.5">
              <p className="text-xs font-medium uppercase tracking-wide text-primary">
                {de ? "Ihr erster Schritt" : "Your first step"}
              </p>
              <h2 className="text-base font-semibold leading-tight">
                {de ? "Organisation einrichten" : "Set up your organization"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {de
                  ? "Bestätigen Sie Name, Sektor und Einrichtungsart. Damit wird Ihr NIS-2-Weg unten aktiv."
                  : "Confirm your name, sector and entity type. That activates the NIS 2 path below."}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center sm:justify-end">
            <Button asChild>
              <Link href="/onboarding">
                {de ? "Einrichten" : "Set up"}
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
                {de ? "Ihr erster Schritt" : "Your first step"}
              </p>
              <h2 className="text-base font-semibold leading-tight">
                {de ? "Erfassen Sie Ihre Assets" : "Build your asset inventory"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {de
                  ? "Das Fundament, auf dem der Rest von NIS 2 aufbaut. Erfassen Sie fünf, um die nächsten Schritte freizuschalten."
                  : "The foundation the rest of NIS 2 builds on. Add five to unlock the next steps."}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
            <span className="text-sm font-medium text-muted-foreground">
              {assetCount} / {ASSET_TARGET}
            </span>
            <Button asChild>
              <Link href="/assets">{de ? "Assets hinzufügen" : "Add assets"}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (liveNode) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 sm:px-4">
        <span className="hidden shrink-0 text-xs font-medium uppercase tracking-wide text-primary sm:inline">
          {de ? "Als Nächstes" : "Next up"}
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
            {de ? "Weiter" : "Continue"}
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm sm:px-4">
      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
      <span className="font-medium">{de ? "Alles erledigt" : "You are all set"}</span>
      <span className="truncate text-muted-foreground">
        {de
          ? "Wiederkehrende Aufgaben tauchen hier auf, sobald sie fällig sind."
          : "Recurring tasks appear here when they come up."}
      </span>
    </div>
  );
}
