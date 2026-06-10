"use client";

/**
 * Per-customer asset CRUD section.
 *
 * Lists every asset the supplier has declared for one customer, with an
 * inline create form bound to the assetServiceUpdateSchema (the strict pick
 * from assetInsertSchema covering serviceType + branch fields). Reuses the
 * shared SchemaForm component so the form auto-renders fields from the
 * Zod schema — same plumbing as every other compliance form.
 *
 * Per-asset technical fields like SaaS hosting region, on-prem SBOM, managed
 * PAM, etc. live on the asset row, scoped to one (supplier, customer) pair.
 */
import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Server, Trash2, Pencil, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc, type RouterOutputs } from "@/lib/trpc/client";
import { SchemaForm } from "@/lib/forms/schema-form";
import type { FieldOverride } from "@/lib/forms/field-renderer";
import { assetServiceUpdateSchema } from "@/schema/validators";
import type { z } from "zod";

type AssetServiceValues = z.infer<typeof assetServiceUpdateSchema>;
type AssetRow =
  RouterOutputs["supplierPortal"]["managedAsset"]["listByRelationship"][number];

const fieldOverrides: Record<string, FieldOverride> = {
  // Identity
  name: { group: "Service identity" },
  description: { group: "Service identity", colSpan: 2 },
  serviceType: {
    group: "Service identity",
    component: "enum",
    options: [
      { value: "saas", label: "SaaS / hosted service" },
      { value: "on_prem", label: "On-prem software" },
      { value: "pro_services", label: "Professional services" },
      { value: "managed", label: "Managed service" },
    ],
  },
  serviceDescription: { group: "Service identity", colSpan: 2 },
  dataProcessingLocations: { group: "Service identity", colSpan: 2 },

  // Reused entity-side fields
  hasMfa: { group: "Cryptography & access" },
  encryptionAtRest: { group: "Cryptography & access" },
  encryptionInTransit: { group: "Cryptography & access" },
  rto: { group: "Cryptography & access", unit: "h" },

  // SaaS branch
  saasHostingRegion: {
    group: "SaaS branch",
    component: "enum",
    options: [
      { value: "eu", label: "EU only" },
      { value: "de_only", label: "Germany only" },
      { value: "global", label: "Global" },
    ],
  },

  // On-prem branch
  onPremSbomProvided: { group: "On-prem branch" },
  onPremSignedReleases: { group: "On-prem branch" },
  onPremVulnerabilityDisclosurePolicy: { group: "On-prem branch" },
  onPremPatchSlaCriticalHours: { group: "On-prem branch", unit: "h" },

  // Pro services branch
  proServicesBackgroundCheckScope: {
    group: "Professional services branch",
    component: "enum",
    options: [
      { value: "criminal", label: "Criminal record" },
      { value: "employment", label: "Employment history" },
      { value: "both", label: "Both" },
    ],
  },
  proServicesNdaInPlace: { group: "Professional services branch" },
  proServicesCustomerPremisesPolicy: { group: "Professional services branch" },

  // Managed branch
  managedPrivilegedAccessMgmt: { group: "Managed service branch" },
  managedSessionRecording: { group: "Managed service branch" },
  managedOnCall24x7: { group: "Managed service branch" },
};

const emptyDefaults: AssetServiceValues = {
  name: "",
  description: null,
  serviceType: undefined,
  serviceDescription: null,
  dataProcessingLocations: null,
  hasMfa: false,
  encryptionAtRest: null,
  encryptionInTransit: null,
  rto: null,
  saasHostingRegion: null,
  onPremSbomProvided: false,
  onPremSignedReleases: false,
  onPremVulnerabilityDisclosurePolicy: false,
  onPremPatchSlaCriticalHours: null,
  proServicesBackgroundCheckScope: null,
  proServicesNdaInPlace: false,
  proServicesCustomerPremisesPolicy: false,
  managedPrivilegedAccessMgmt: false,
  managedSessionRecording: false,
  managedOnCall24x7: false,
};

export function CustomerAssetsSection({
  relationshipId,
  initialAssets,
}: {
  relationshipId: string;
  initialAssets: AssetRow[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const utils = trpc.useUtils();
  const assets = trpc.supplierPortal.managedAsset.listByRelationship.useQuery(
    { relationshipId },
    { initialData: initialAssets },
  );

  const editingAsset = trpc.supplierPortal.managedAsset.get.useQuery(
    { id: editingId ?? "" },
    { enabled: editingId !== null },
  );

  const create = trpc.supplierPortal.managedAsset.create.useMutation({
    onSuccess: () => {
      utils.supplierPortal.managedAsset.listByRelationship.invalidate({
        relationshipId,
      });
      setShowAdd(false);
      router.refresh();
    },
  });

  const update = trpc.supplierPortal.managedAsset.update.useMutation({
    onSuccess: () => {
      utils.supplierPortal.managedAsset.listByRelationship.invalidate({
        relationshipId,
      });
      setEditingId(null);
      router.refresh();
    },
  });

  const remove = trpc.supplierPortal.managedAsset.delete.useMutation({
    onSuccess: () => {
      utils.supplierPortal.managedAsset.listByRelationship.invalidate({
        relationshipId,
      });
      router.refresh();
    },
  });

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Assets</h2>
        {!showAdd && editingId === null && (
          <Button size="sm" onClick={() => setShowAdd(true)}>
            Add asset
          </Button>
        )}
      </header>

      {showAdd && (
        <div className="rounded-lg border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">New asset</h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowAdd(false)}
              aria-label="Cancel"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <SchemaForm
            schema={assetServiceUpdateSchema}
            defaultValues={emptyDefaults}
            fieldOverrides={fieldOverrides}
            columns={2}
            submitLabel="Save asset"
            isSubmitting={create.isPending}
            onSubmit={async (data) => {
              // SchemaForm has run zodResolver — name is min(1) on the schema
              // refinement, so the cast is safe at runtime.
              const values = data as AssetServiceValues & { name: string };
              await create.mutateAsync({
                ...values,
                relationshipId,
              });
            }}
          />
          {create.isError && (
            <p className="text-xs text-destructive">{create.error.message}</p>
          )}
        </div>
      )}

      {editingId !== null && editingAsset.data && (
        <div className="rounded-lg border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Edit asset</h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditingId(null)}
              aria-label="Cancel"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <SchemaForm
            schema={assetServiceUpdateSchema}
            defaultValues={{
              ...emptyDefaults,
              name: editingAsset.data.name,
              description: editingAsset.data.description ?? null,
              serviceType: editingAsset.data.serviceType,
              serviceDescription: editingAsset.data.serviceDescription ?? null,
              dataProcessingLocations:
                editingAsset.data.dataProcessingLocations ?? null,
              hasMfa: editingAsset.data.hasMfa ?? false,
              encryptionAtRest: editingAsset.data.encryptionAtRest ?? null,
              encryptionInTransit: editingAsset.data.encryptionInTransit ?? null,
              rto: editingAsset.data.rto ?? null,
              saasHostingRegion:
                (editingAsset.data.saasHostingRegion as
                  | "eu"
                  | "de_only"
                  | "global"
                  | null
                  | undefined) ?? null,
              onPremSbomProvided: editingAsset.data.onPremSbomProvided ?? false,
              onPremSignedReleases:
                editingAsset.data.onPremSignedReleases ?? false,
              onPremVulnerabilityDisclosurePolicy:
                editingAsset.data.onPremVulnerabilityDisclosurePolicy ?? false,
              onPremPatchSlaCriticalHours:
                editingAsset.data.onPremPatchSlaCriticalHours ?? null,
              proServicesBackgroundCheckScope:
                (editingAsset.data.proServicesBackgroundCheckScope as
                  | "criminal"
                  | "employment"
                  | "both"
                  | null
                  | undefined) ?? null,
              proServicesNdaInPlace:
                editingAsset.data.proServicesNdaInPlace ?? false,
              proServicesCustomerPremisesPolicy:
                editingAsset.data.proServicesCustomerPremisesPolicy ?? false,
              managedPrivilegedAccessMgmt:
                editingAsset.data.managedPrivilegedAccessMgmt ?? false,
              managedSessionRecording:
                editingAsset.data.managedSessionRecording ?? false,
              managedOnCall24x7: editingAsset.data.managedOnCall24x7 ?? false,
            }}
            fieldOverrides={fieldOverrides}
            columns={2}
            submitLabel="Save changes"
            isSubmitting={update.isPending}
            onSubmit={async (data) => {
              await update.mutateAsync({
                ...(data as AssetServiceValues),
                id: editingId,
              });
            }}
          />
          {update.isError && (
            <p className="text-xs text-destructive">{update.error.message}</p>
          )}
        </div>
      )}

      {assets.data && assets.data.length > 0 ? (
        <ul className="space-y-2">
          {assets.data.map((a) => (
            <li
              key={a.id}
              className="rounded-md border bg-card p-4 flex items-start justify-between gap-3"
            >
              <div className="flex items-start gap-3 min-w-0">
                <Server className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium text-sm flex items-center gap-2">
                    {a.name}
                    {a.serviceType && (
                      <Badge variant="secondary" className="text-[10px]">
                        {a.serviceType.replace("_", " ")}
                      </Badge>
                    )}
                  </div>
                  {a.serviceDescription && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {a.serviceDescription}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowAdd(false);
                    setEditingId(a.id);
                  }}
                  disabled={remove.isPending}
                  aria-label="Edit asset"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => remove.mutate({ id: a.id })}
                  disabled={remove.isPending}
                  aria-label="Remove asset"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        !showAdd && (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No assets declared yet for this customer. Click &quot;Add
            asset&quot; to start.
          </div>
        )
      )}
    </section>
  );
}
