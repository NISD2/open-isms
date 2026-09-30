/**
 * Read-only view of the incidents a supplier has broadcast to ONE customer,
 * rendered on the token-gated /supplier-access/[token] page.
 *
 * Same story as SharedServicesSection: public.getByToken already returns
 * these, scoped to the caller's relationship via incident_broadcast and
 * reduced to notification columns (the supplier's post-mortem — root cause,
 * countermeasures, financial damage — is deliberately not in the payload).
 * Nothing rendered them, so the supplier's own marketing page promised a
 * feed the customer could not see.
 *
 * This is the customer-side half of what CustomerIncidentsSection publishes.
 */

import { AlertCircle } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import type { RouterOutputs } from "@/lib/trpc/client";

type TokenView = NonNullable<RouterOutputs["supplierPortal"]["public"]["getByToken"]>;
export type SharedIncident = TokenView["recentEvents"][number];

/** Only "significant" earns the loud variant; the rest stay quiet. */
const severityVariant = (severity: string) =>
  severity === "significant" ? "destructive" : "secondary";

export async function SharedIncidentsSection({
  incidents,
}: {
  incidents: readonly SharedIncident[];
}) {
  const [t, format] = await Promise.all([
    getTranslations("supplierPortal.customerView"),
    getFormatter(),
  ]);

  const date = (value: Date | string | null) =>
    value ? format.dateTime(new Date(value), { dateStyle: "medium" }) : null;

  return (
    <section className="space-y-4" data-testid="shared-incidents">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">{t("incidentsTitle")}</h2>
        <p className="text-sm text-muted-foreground max-w-2xl">{t("incidentsIntro")}</p>
      </div>

      {incidents.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("incidentsEmpty")}</p>
      ) : (
        <ul className="space-y-3">
          {incidents.map((incident) => {
            const discovered = date(incident.discoveredAt);
            const resolved = date(incident.resolvedAt);
            return (
              // The notice email links here (broadcast.ts) and carries none of
              // the supplier's text, so this is where the customer reads it.
              <li
                key={incident.id}
                id={`incident-${incident.id}`}
                className="scroll-mt-24 rounded-lg border bg-background p-4 space-y-2 target:border-primary"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-medium">{incident.title}</span>
                  <Badge variant={severityVariant(incident.severity)}>
                    {t(`severity.${incident.severity}`)}
                  </Badge>
                </div>

                {incident.description && (
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {incident.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                  {discovered && (
                    <span>
                      {t("discovered")}: {discovered}
                    </span>
                  )}
                  <span>{resolved ? `${t("resolved")}: ${resolved}` : t("ongoing")}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
