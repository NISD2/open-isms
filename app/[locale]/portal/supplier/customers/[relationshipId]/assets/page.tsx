import { api } from "@/lib/trpc/server";
import { CustomerAssetsSection } from "@/components/supplier-portal/CustomerAssetsSection";

/**
 * Per-customer assets — the supplier declares which services / products they
 * provide to THIS customer. Each asset is a full row in the `asset` table
 * with `customerRelationshipId` set, so the customer sees them via the
 * token-gated /supplier-access view, and the supplier reuses the entity-side
 * compliance asset components for cryptography / auth / etc.
 */
export default async function CustomerAssetsPage({
  params,
}: {
  params: Promise<{ relationshipId: string }>;
}) {
  const { relationshipId } = await params;
  const assets = await api.supplierPortal.managedAsset.listByRelationship({
    relationshipId,
  });

  return (
    <CustomerAssetsSection
      relationshipId={relationshipId}
      initialAssets={assets}
    />
  );
}
