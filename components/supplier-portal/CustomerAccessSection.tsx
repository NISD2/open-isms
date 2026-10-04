"use client";

/**
 * Per-customer access section.
 *
 * Two concerns on one page:
 *   1. Per-customer contract clauses — right-to-audit, exit plan, DPA, etc.
 *      (live on the supplier relationship row, not on the company)
 *   2. Access management — show the invited contact, allow revoke
 *
 * The clauses form is bound to relationshipClausesUpdateSchema (strict pick
 * from supplierInsertSchema) so the supplier portal can never mass-assign
 * portal-share state (status, token, customerCompanyId, etc.) from this
 * endpoint.
 *
 * The clause labels come from supplierPortal.fields.* through
 * `translationNamespace`. The `group` names only decide where a separator
 * goes; they are not shown.
 */
import { Mail, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import type { FieldOverride } from "@/lib/forms/field-renderer";
import { SchemaForm } from "@/lib/forms/schema-form";
import { trpc } from "@/lib/trpc/client";
import { relationshipClausesUpdateSchema } from "@/schema/validators";

type ClauseValues = z.infer<typeof relationshipClausesUpdateSchema>;
type RelationshipStatus = "active" | "revoked" | "bounced";

const fieldOverrides: Record<string, FieldOverride> = {
  acceptRightToAudit: { group: "Audit & subprocessors" },
  hasSubprocessors: { group: "Audit & subprocessors" },
  subprocessorList: { group: "Audit & subprocessors", colSpan: 2 },
  dataReturnOnTermination: { group: "Termination" },
  dpaAvailable: { group: "Termination" },
  hasExitPlan: { group: "Termination" },
  notifyOnLocationChange: { group: "Notification commitments" },
  notifyMaterialChanges: { group: "Notification commitments" },
  incidentAssistanceCommitment: { group: "Incident response" },
  incidentSlaHours: { group: "Incident response", unit: "h" },
};

export function CustomerAccessSection({
  relationshipId,
  customerEmail,
  customerOrgName,
  status,
  initialClauses,
}: {
  relationshipId: string;
  customerEmail: string | null;
  customerOrgName: string | null;
  status: RelationshipStatus | null;
  initialClauses: ClauseValues;
}) {
  const t = useTranslations("supplierPortal.access");
  const tNav = useTranslations("supplierPortal.nav");
  const tView = useTranslations("supplierPortal.customerView");
  const router = useRouter();

  const updateClauses = trpc.supplierPortal.relationship.updateClauses.useMutation({
    onSuccess: () => {
      router.refresh();
    },
  });

  const remove = trpc.supplierPortal.relationship.remove.useMutation({
    onSuccess: () => {
      router.push("/portal/supplier/customers");
      router.refresh();
    },
  });

  const defaults: ClauseValues = {
    acceptRightToAudit: initialClauses.acceptRightToAudit ?? false,
    hasSubprocessors: initialClauses.hasSubprocessors ?? false,
    subprocessorList: initialClauses.subprocessorList ?? null,
    dataReturnOnTermination: initialClauses.dataReturnOnTermination ?? false,
    dpaAvailable: initialClauses.dpaAvailable ?? false,
    notifyOnLocationChange: initialClauses.notifyOnLocationChange ?? false,
    incidentAssistanceCommitment: initialClauses.incidentAssistanceCommitment ?? false,
    notifyMaterialChanges: initialClauses.notifyMaterialChanges ?? false,
    hasExitPlan: initialClauses.hasExitPlan ?? false,
    incidentSlaHours: initialClauses.incidentSlaHours ?? null,
  };

  return (
    <div className="space-y-8">
      {/* Access — invited contact + revoke */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{tNav("access")}</h2>
        <div className="rounded-md border bg-card p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <div className="font-medium text-sm truncate">
                {customerEmail ?? t("contactMissing")}
              </div>
              {customerOrgName && (
                <div className="text-xs text-muted-foreground truncate">
                  {customerOrgName}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {status && <StatusBadge status={status} />}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (confirm(t("revokeConfirm"))) {
                  remove.mutate({ id: relationshipId });
                }
              }}
              disabled={remove.isPending || status === "revoked"}
              aria-label={tView("revoke")}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Per-customer contract clauses */}
      <section className="space-y-3">
        <header>
          <h2 className="text-lg font-semibold">{t("clausesTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("clausesIntro")}</p>
        </header>
        <SchemaForm
          schema={relationshipClausesUpdateSchema}
          defaultValues={defaults}
          fieldOverrides={fieldOverrides}
          translationNamespace="supplierPortal"
          columns={2}
          submitLabel={t("saveClauses")}
          isSubmitting={updateClauses.isPending}
          onSubmit={async (data) => {
            await updateClauses.mutateAsync({
              ...(data as ClauseValues),
              id: relationshipId,
            });
          }}
        />
        {updateClauses.isError && (
          <p className="text-xs text-destructive">{updateClauses.error.message}</p>
        )}
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: RelationshipStatus }) {
  const t = useTranslations("supplierPortal.access.status");
  const variants: Record<
    RelationshipStatus,
    "default" | "secondary" | "outline" | "destructive"
  > = {
    active: "default",
    revoked: "outline",
    bounced: "destructive",
  };
  return (
    <Badge variant={variants[status]} className="text-xs">
      {t(status)}
    </Badge>
  );
}
