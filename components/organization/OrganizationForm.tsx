"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc/client";
import { SchemaForm } from "@/lib/forms/schema-form";
import type { FieldOverride } from "@/lib/forms/field-renderer";
import { toast } from "sonner";
import {
  companyFormSchema,
  SECTORS,
  COMPANY_FORM_OMIT,
  type CompanyFormData,
  parseCompanyFormData,
} from "@/lib/organization/constants";

interface OrganizationFormProps {
  mode: "create" | "edit";
  initialData?: CompanyFormData | null;
  isAdmin?: boolean;
}

export function OrganizationForm({
  mode,
  initialData,
  isAdmin = true,
}: OrganizationFormProps) {
  const t = useTranslations("organization");
  const router = useRouter();

  const createMutation =
    trpc.assessment.createCompanyAndAssessment.useMutation();
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

  async function handleCreateSubmit(data: Record<string, unknown>) {
    const toastId = toast.loading(t("creating"));
    try {
      await createMutation.mutateAsync(parseCompanyFormData(data));
      toast.dismiss(toastId);
      router.push("/dashboard");
    } catch {
      toast.dismiss(toastId);
      toast.error(t("createError"));
    }
  }

  async function handleEditSubmit(data: Record<string, unknown>) {
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
    name: initialData?.name ?? "",
    sector: initialData?.sector ?? "",
    entityType: initialData?.entityType ?? "important",
    legalForm: initialData?.legalForm ?? "",
    contactEmail: initialData?.contactEmail ?? "",
    ...(initialData?.employeeCount
      ? { employeeCount: initialData.employeeCount }
      : {}),
    cisoName: initialData?.cisoName ?? "",
    cisoReportsTo: initialData?.cisoReportsTo ?? "",
    bsiContactName: initialData?.bsiContactName ?? "",
    bsiContactEmail: initialData?.bsiContactEmail ?? "",
    bsiContactPhone: initialData?.bsiContactPhone ?? "",
    bsiRegistrationId: initialData?.bsiRegistrationId ?? "",
    annualSecurityBudget: initialData?.annualSecurityBudget ?? "",
    primaryLocations: initialData?.primaryLocations ?? "",
  };

  if (mode === "edit") {
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

  return (
    <SchemaForm
      schema={companyFormSchema}
      onSubmit={handleCreateSubmit}
      omit={[...COMPANY_FORM_OMIT]}
      fieldOverrides={fieldOverrides}
      defaultValues={defaults}
      columns={2}
      submitLabel={t("submit")}
      isSubmitting={createMutation.isPending}
      llmPrefill
    />
  );
}
