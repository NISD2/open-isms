import { api } from "@/lib/trpc/server";
import { CustomerIncidentsSection } from "@/components/supplier-portal/CustomerIncidentsSection";

/**
 * Per-customer incident publish + history.
 *
 * Reuses SupplierIncidentsManager via the customer-specific wrapper, which
 * locks the relationship picker to THIS customer and only loads incidents
 * scoped to it.
 */
export default async function CustomerIncidentsPage({
  params,
}: {
  params: Promise<{ relationshipId: string }>;
}) {
  const { relationshipId } = await params;
  const [allIncidents, rel] = await Promise.all([
    api.supplierPortal.incident.list(),
    api.supplierPortal.relationship.get({ id: relationshipId }),
  ]);

  // Server-side scope to THIS relationship — supplierPortal.incident.list
  // returns rows for the whole supplier, so we narrow client-side. The
  // server query already enforces tenant isolation.
  const incidents = allIncidents.filter(
    (i) => i.customerRelationshipId === relationshipId,
  );

  return (
    <CustomerIncidentsSection
      relationshipId={relationshipId}
      customerEmail={rel.customerEmail}
      customerOrgName={rel.customerOrgName}
      initialIncidents={incidents}
    />
  );
}
