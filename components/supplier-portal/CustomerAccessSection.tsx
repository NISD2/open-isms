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
import { useTranslations } from "next-intl";
import type { z } from "zod";
import {
  type Contact,
  CustomerContactsCard,
} from "@/components/supplier-portal/CustomerContactsCard";
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
  contacts,
  customerOrgName,
  customerHasAccount,
  status,
  initialClauses,
}: {
  relationshipId: string;
  contacts: readonly Contact[];
  customerOrgName: string | null;
  customerHasAccount: boolean;
  status: RelationshipStatus | null;
  initialClauses: ClauseValues;
}) {
  const t = useTranslations("supplierPortal.access");
  const tNav = useTranslations("supplierPortal.nav");
  const router = useRouter();

  const updateClauses = trpc.supplierPortal.relationship.updateClauses.useMutation({
    onSuccess: () => {
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
      {/* Access: the customer's contact, to add, change or remove */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{tNav("access")}</h2>
        <CustomerContactsCard
          relationshipId={relationshipId}
          contacts={contacts}
          customerOrgName={customerOrgName}
          customerHasAccount={customerHasAccount}
          status={status}
        />
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
