/**
 * Read-only view of the services a supplier has declared for ONE customer,
 * rendered on the token-gated /supplier-access/[token] page.
 *
 * public.getByToken already returns these, scoped to the caller's
 * relationship and reduced to the declaration columns (the supplier's own
 * hostnames, patch dates and privileged-account counts are deliberately not
 * in the payload). They were simply never rendered, so a customer saw the
 * company-wide questionnaire and nothing about their own service.
 *
 * The supplier edits the same data at
 * /portal/supplier/customers/[relationshipId]/assets via CustomerAssetsSection.
 * This is the customer's half: no mutations, no tRPC, props only.
 *
 * Labels are reused, not restated: the offering fields already carry
 * supplierPortal.fields.* + fieldDescriptions.* in all ten locales, and the
 * asset-level security fields carry assets.fields.*.
 */
import { getTranslations } from "next-intl/server";
import { Server } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { RouterOutputs } from "@/lib/trpc/client";

type TokenView = NonNullable<
  RouterOutputs["supplierPortal"]["public"]["getByToken"]
>;
export type SharedService = TokenView["managedAssets"][number];

/** Which declarations apply depends on what kind of service this is. */
const BRANCH_FIELDS = {
  saas: ["saasHostingRegion"],
  on_prem: [
    "onPremSbomProvided",
    "onPremSignedReleases",
    "onPremVulnerabilityDisclosurePolicy",
    "onPremPatchSlaCriticalHours",
  ],
  pro_services: [
    "proServicesBackgroundCheckScope",
    "proServicesNdaInPlace",
    "proServicesCustomerPremisesPolicy",
  ],
  managed: [
    "managedPrivilegedAccessMgmt",
    "managedSessionRecording",
    "managedOnCall24x7",
  ],
} as const satisfies Record<string, readonly (keyof SharedService)[]>;

/** Asset-level security facts, declared per service rather than per company. */
const ASSET_FIELDS = [
  "hasMfa",
  "encryptionAtRest",
  "encryptionInTransit",
  "hasBackup",
  "rto",
  "rpo",
  "processesPersonalData",
] as const satisfies readonly (keyof SharedService)[];

type Row = { readonly key: string; readonly label: string; readonly value: string };

export async function SharedServicesSection({
  services,
}: {
  services: readonly SharedService[];
}) {
  const [t, tField, tAsset, tCommon] = await Promise.all([
    getTranslations("supplierPortal.customerView"),
    getTranslations("supplierPortal.fields"),
    getTranslations("assets.fields"),
    getTranslations("common"),
  ]);

  const format = (value: unknown): string | null => {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value === "boolean") return value ? tCommon("yes") : tCommon("no");
    return String(value);
  };

  const rowsFor = (service: SharedService): readonly Row[] => {
    const branch =
      service.serviceType && service.serviceType in BRANCH_FIELDS
        ? BRANCH_FIELDS[service.serviceType as keyof typeof BRANCH_FIELDS]
        : [];
    const offering = ["dataProcessingLocations" as const, ...branch].map((key) => ({
      key: String(key),
      label: tField(key),
      raw: service[key],
    }));
    const shared = ASSET_FIELDS.map((key) => ({
      key: String(key),
      label: tAsset(key),
      raw: service[key],
    }));
    // An unanswered declaration renders as nothing rather than a row of
    // "not specified" repeated fifteen times.
    return [...offering, ...shared].flatMap<Row>(({ key, label, raw }) => {
      const value = format(raw);
      return value === null ? [] : [{ key, label, value }];
    });
  };

  return (
    <section className="space-y-4" data-testid="shared-services">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">{t("servicesTitle")}</h2>
        <p className="text-sm text-muted-foreground max-w-2xl">{t("servicesIntro")}</p>
      </div>

      {services.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("servicesEmpty")}</p>
      ) : (
        <ul className="space-y-4">
          {services.map((service) => {
            const rows = rowsFor(service);
            return (
              <li key={service.id} className="rounded-lg border bg-background p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Server className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-medium">{service.name}</span>
                  {service.serviceType && (
                    <Badge variant="secondary">
                      {t(`serviceTypes.${service.serviceType}`)}
                    </Badge>
                  )}
                </div>

                {service.serviceDescription && (
                  <p className="text-sm text-muted-foreground">
                    {service.serviceDescription}
                  </p>
                )}

                {rows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("nothingDeclared")}</p>
                ) : (
                  <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2 text-sm">
                    {rows.map((row) => (
                      <div key={row.key} className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">{row.label}</dt>
                        <dd className="text-right font-medium">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
