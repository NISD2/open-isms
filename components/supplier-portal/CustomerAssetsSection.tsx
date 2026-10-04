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
 *
 * Labels: the asset-level fields use assets.fields.*, the rest come from
 * supplierPortal.fields.* through `translationNamespace`. Those are the same
 * labels the customer reads on their access page (SharedServicesSection).
 * The `group` names only decide where a separator goes; they are not shown.
 */
import { Pencil, Server, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import type { FieldOverride } from "@/lib/forms/field-renderer";
import { SchemaForm } from "@/lib/forms/schema-form";
import { type RouterOutputs, trpc } from "@/lib/trpc/client";
import { assetServiceUpdateSchema } from "@/schema/validators";

type AssetServiceValues = z.infer<typeof assetServiceUpdateSchema>;
type AssetRow =
  RouterOutputs["supplierPortal"]["managedAsset"]["listByRelationship"][number];

const SERVICE_TYPES = ["saas", "on_prem", "pro_services", "managed"] as const;
const HOSTING_REGIONS = ["eu", "de_only", "global"] as const;
const BACKGROUND_CHECK_SCOPES = ["criminal", "employment", "both"] as const;

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
  const t = useTranslations("supplierPortal.assets");
  const tNav = useTranslations("supplierPortal.nav");
  const tOption = useTranslations("supplierPortal.options");
  const tAsset = useTranslations("assets.fields");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);

  const fieldOverrides: Record<string, FieldOverride> = {
    // Identity
    name: { group: "Service identity" },
    description: {
      group: "Service identity",
      colSpan: 2,
      label: tAsset("description"),
    },
    serviceType: {
      group: "Service identity",
      component: "enum",
      options: SERVICE_TYPES.map((value) => ({
        value,
        label: t(`serviceTypes.${value}`),
      })),
    },
    serviceDescription: { group: "Service identity", colSpan: 2 },
    dataProcessingLocations: { group: "Service identity", colSpan: 2 },

    // Reused entity-side fields
    hasMfa: { group: "Cryptography & access", label: tAsset("hasMfa") },
    encryptionAtRest: {
      group: "Cryptography & access",
      label: tAsset("encryptionAtRest"),
    },
    encryptionInTransit: {
      group: "Cryptography & access",
      label: tAsset("encryptionInTransit"),
    },
    rto: { group: "Cryptography & access", unit: "h", label: tAsset("rto") },

    // SaaS branch
    saasHostingRegion: {
      group: "SaaS branch",
      component: "enum",
      options: HOSTING_REGIONS.map((value) => ({
        value,
        label: tOption(`saasHostingRegion.${value}`),
      })),
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
      options: BACKGROUND_CHECK_SCOPES.map((value) => ({
        value,
        label: tOption(`backgroundCheckScope.${value}`),
      })),
    },
    proServicesNdaInPlace: { group: "Professional services branch" },
    proServicesCustomerPremisesPolicy: { group: "Professional services branch" },

    // Managed branch
    managedPrivilegedAccessMgmt: { group: "Managed service branch" },
    managedSessionRecording: { group: "Managed service branch" },
    managedOnCall24x7: { group: "Managed service branch" },
  };
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
        <h2 className="text-lg font-semibold">{tNav("assets")}</h2>
        {!showAdd && editingId === null && (
          <Button size="sm" onClick={() => setShowAdd(true)}>
            {t("add")}
          </Button>
        )}
      </header>

      {showAdd && (
        <div className="rounded-lg border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">{t("newTitle")}</h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowAdd(false)}
              aria-label={tCommon("cancel")}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <SchemaForm
            schema={assetServiceUpdateSchema}
            defaultValues={emptyDefaults}
            fieldOverrides={fieldOverrides}
            translationNamespace="supplierPortal"
            columns={2}
            submitLabel={t("save")}
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
            <h3 className="text-sm font-medium">{t("editTitle")}</h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditingId(null)}
              aria-label={tCommon("cancel")}
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
              dataProcessingLocations: editingAsset.data.dataProcessingLocations ?? null,
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
              onPremSignedReleases: editingAsset.data.onPremSignedReleases ?? false,
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
              proServicesNdaInPlace: editingAsset.data.proServicesNdaInPlace ?? false,
              proServicesCustomerPremisesPolicy:
                editingAsset.data.proServicesCustomerPremisesPolicy ?? false,
              managedPrivilegedAccessMgmt:
                editingAsset.data.managedPrivilegedAccessMgmt ?? false,
              managedSessionRecording: editingAsset.data.managedSessionRecording ?? false,
              managedOnCall24x7: editingAsset.data.managedOnCall24x7 ?? false,
            }}
            fieldOverrides={fieldOverrides}
            translationNamespace="supplierPortal"
            columns={2}
            submitLabel={t("saveChanges")}
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
                        {t(`serviceTypes.${a.serviceType}`)}
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
                  aria-label={t("editTitle")}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => remove.mutate({ id: a.id })}
                  disabled={remove.isPending}
                  aria-label={t("remove")}
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
            {t("empty")}
          </div>
        )
      )}
    </section>
  );
}
