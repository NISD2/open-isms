import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Boxes, CheckCircle2 } from "lucide-react";
import type { JourneyItem } from "./views";

type Locale = "en" | "de" | "nl";

const ASSET_TARGET = 5;

/**
 * Stage 0 novice hero: one prescribed next action, nothing to choose.
 * Until the company has its keystone asset inventory, the single action is
 * "add your first 5 assets" (the activation event). After that, it points at
 * the live requirement node from the path projection.
 */
export function PathHero({
  assetCount,
  liveNode,
  locale,
}: {
  assetCount: number;
  liveNode: JourneyItem | null;
  locale: Locale;
}) {
  const de = locale === "de";

  if (assetCount < ASSET_TARGET) {
    return (
      <ActionCard
        icon={<Boxes className="h-6 w-6 text-primary" />}
        eyebrow={de ? "Ihr erster Schritt" : "Your first step"}
        title={de ? "Erfassen Sie Ihre Assets" : "Build your asset inventory"}
        body={
          de
            ? "Ihre Anlagenliste ist das Fundament, auf dem der Rest von NIS 2 aufbaut. Erfassen Sie fünf, um die nächsten Schritte freizuschalten."
            : "Your asset inventory is the foundation the rest of NIS 2 builds on. Add five to unlock the next steps."
        }
        progress={`${assetCount} / ${ASSET_TARGET}`}
        cta={de ? "Assets hinzufügen" : "Add assets"}
        href="/assets"
      />
    );
  }

  if (liveNode) {
    return (
      <ActionCard
        icon={<ArrowRight className="h-6 w-6 text-primary" />}
        eyebrow={de ? "Weiter geht es mit" : "Next up"}
        title={liveNode.title}
        body={liveNode.description ?? ""}
        cta={de ? "Weiter" : "Continue"}
        href={{
          pathname: "/compliance/[categorySlug]" as const,
          params: { categorySlug: liveNode.categorySlug },
        }}
      />
    );
  }

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="flex items-center gap-3 p-6">
        <CheckCircle2 className="h-6 w-6 text-primary" />
        <div>
          <p className="font-semibold">
            {de ? "Alles erledigt" : "You are all set"}
          </p>
          <p className="text-sm text-muted-foreground">
            {de
              ? "Es steht aktuell nichts an. Wiederkehrende Aufgaben tauchen hier auf, sobald sie fällig sind."
              : "Nothing is due right now. Recurring tasks appear here when they come up."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function ActionCard({
  icon,
  eyebrow,
  title,
  body,
  progress,
  cta,
  href,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  body: string;
  progress?: string;
  cta: string;
  href: React.ComponentProps<typeof Link>["href"];
}) {
  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-4">
          <div className="mt-0.5 shrink-0">{icon}</div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-primary">
              {eyebrow}
            </p>
            <h2 className="text-lg font-semibold leading-tight">{title}</h2>
            {body ? (
              <p className="text-sm text-muted-foreground">{body}</p>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
          {progress ? (
            <span className="text-sm font-medium text-muted-foreground">
              {progress}
            </span>
          ) : null}
          <Button asChild>
            <Link href={href}>{cta}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
