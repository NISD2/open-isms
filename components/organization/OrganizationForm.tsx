"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import type { FieldOverride } from "@/lib/forms/field-renderer";
import { SchemaForm } from "@/lib/forms/schema-form";
import {
  COMPANY_FORM_OMIT,
  type CompanyFormData,
  companyFormSchema,
  SECTORS,
} from "@/lib/organization/constants";
import { trpc } from "@/lib/trpc/client";

/**
 * Every field of a company that is set up, while the journey is the portal's front: the sign-off
 * snapshot and the export read them (CISO, BSI contact, locations), and this is the one place they
 * are edited. Setting a company up is `CompanySetup`, and once the walkthrough is the front the
 * organization page shows only `CompanyEssentials`.
 */
export function OrganizationForm({
  initialData,
  isAdmin,
}: {
  initialData: CompanyFormData;
  isAdmin: boolean;
}) {
  const t = useTranslations("organization");
  const router = useRouter();

  const updateMutation = trpc.assessment.updateCompany.useMutation();

  const fieldOverrides: Record<string, FieldOverride> = {
    name: {
      label: t("name"),
      placeholder: t("namePlaceholder"),
    },
    sector: {
      label: t("sector"),
      component: "enum",
      placeholder: t("sectorPlaceholder"),
      options: SECTORS.map((s) => ({
        value: s,
        label: t(`sectors.${s}`),
      })),
    },
    entityType: {
      label: t("entityType"),
      description: t("entityTypeHelp"),
      options: [
        { value: "essential", label: t("entityTypes.essential") },
        { value: "important", label: t("entityTypes.important") },
        { value: "kritis", label: t("entityTypes.kritis") },
      ],
    },
    legalForm: {
      label: t("legalForm"),
      placeholder: t("legalFormPlaceholder"),
    },
    employeeCount: {
      label: t("employees"),
      placeholder: "50",
    },
    contactEmail: {
      label: t("contactEmail"),
      placeholder: "compliance@example.com",
      description: t("contactEmailHelp"),
    },
    cisoName: {
      label: t("cisoName"),
      placeholder: t("cisoNamePlaceholder"),
    },
    cisoReportsTo: {
      label: t("cisoReportsTo"),
      placeholder: t("cisoReportsToPlaceholder"),
    },
    bsiContactName: {
      label: t("bsiContactName"),
      placeholder: t("bsiContactNamePlaceholder"),
    },
    bsiContactEmail: {
      label: t("bsiContactEmail"),
      placeholder: "bsi-meldung@company.com",
    },
    bsiContactPhone: {
      label: t("bsiContactPhone"),
      placeholder: "+49 30 123456",
    },
    bsiRegistrationId: {
      label: t("bsiRegistrationId"),
      placeholder: "BSI-NIS2-2026-XXXXX",
    },
    annualSecurityBudget: {
      label: t("annualSecurityBudget"),
      placeholder: "50000",
    },
    primaryLocations: {
      label: t("primaryLocations"),
      placeholder: t("primaryLocationsPlaceholder"),
    },
  };

  async function handleEditSubmit(submitted: Record<string, unknown>) {
    // A field the form does not show keeps what is stored: without this, a hidden field would go
    // to the server empty and wipe its value.
    const data: Record<string, unknown> = { ...initialData, ...submitted };
    const toastId = toast.loading(t("saving"));
    try {
      await updateMutation.mutateAsync({
        name: data.name as string,
        sector: data.sector as string,
        entityType: data.entityType as "essential" | "important" | "kritis",
        legalForm: (data.legalForm as string) || null,
        employeeCount: (data.employeeCount as number) ?? null,
        contactEmail: (data.contactEmail as string) || null,
        cisoName: (data.cisoName as string) || null,
        cisoReportsTo: (data.cisoReportsTo as string) || null,
        bsiContactName: (data.bsiContactName as string) || null,
        bsiContactEmail: (data.bsiContactEmail as string) || null,
        bsiContactPhone: (data.bsiContactPhone as string) || null,
        bsiRegistrationId: (data.bsiRegistrationId as string) || null,
        annualSecurityBudget: (data.annualSecurityBudget as string) || null,
        primaryLocations: (data.primaryLocations as string) || null,
      });
      toast.dismiss(toastId);
      toast.success(t("saved"));
      router.refresh();
    } catch {
      toast.dismiss(toastId);
      toast.error(t("saveError"));
    }
  }

  const defaults = {
    name: initialData.name,
    sector: initialData.sector,
    entityType: initialData.entityType,
    legalForm: initialData.legalForm ?? "",
    contactEmail: initialData.contactEmail ?? "",
    ...(initialData.employeeCount ? { employeeCount: initialData.employeeCount } : {}),
    cisoName: initialData.cisoName ?? "",
    cisoReportsTo: initialData.cisoReportsTo ?? "",
    bsiContactName: initialData.bsiContactName ?? "",
    bsiContactEmail: initialData.bsiContactEmail ?? "",
    bsiContactPhone: initialData.bsiContactPhone ?? "",
    bsiRegistrationId: initialData.bsiRegistrationId ?? "",
    annualSecurityBudget: initialData.annualSecurityBudget ?? "",
    primaryLocations: initialData.primaryLocations ?? "",
  };

  return (
    <SchemaForm
      schema={companyFormSchema}
      onSubmit={handleEditSubmit}
      omit={[...COMPANY_FORM_OMIT]}
      fieldOverrides={fieldOverrides}
      defaultValues={defaults}
      columns={2}
      submitLabel={t("save")}
      isSubmitting={updateMutation.isPending}
      disabled={!isAdmin}
    />
  );
}
