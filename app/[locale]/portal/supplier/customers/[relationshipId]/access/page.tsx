import { api } from "@/lib/trpc/server";
import { CustomerAccessSection } from "@/components/supplier-portal/CustomerAccessSection";

/**
 * Per-customer access management — invite/revoke + per-customer contract
 * clauses (right-to-audit, exit plan, DPA, etc.).
 *
 * The clauses live on the supplier (relationship) row, not on the company,
 * because each customer negotiates their own contract terms.
 */
export default async function CustomerAccessPage({
  params,
}: {
  params: Promise<{ relationshipId: string }>;
}) {
  const { relationshipId } = await params;
  const rel = await api.supplierPortal.relationship.get({ id: relationshipId });

  return (
    <CustomerAccessSection
      relationshipId={relationshipId}
      customerEmail={rel.customerEmail}
      customerOrgName={rel.customerOrgName}
      status={rel.status}
      initialClauses={{
        acceptRightToAudit: rel.acceptRightToAudit,
        hasSubprocessors: rel.hasSubprocessors,
        subprocessorList: rel.subprocessorList,
        dataReturnOnTermination: rel.dataReturnOnTermination,
        dpaAvailable: rel.dpaAvailable,
        notifyOnLocationChange: rel.notifyOnLocationChange,
        incidentAssistanceCommitment: rel.incidentAssistanceCommitment,
        notifyMaterialChanges: rel.notifyMaterialChanges,
        hasExitPlan: rel.hasExitPlan,
        incidentSlaHours: rel.incidentSlaHours,
      }}
    />
  );
}
