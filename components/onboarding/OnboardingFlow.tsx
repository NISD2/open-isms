"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Building2, Sparkles, Users } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { SchemaForm } from "@/lib/forms/schema-form";
import type { FieldOverride } from "@/lib/forms/field-renderer";
import { trpc } from "@/lib/trpc/client";
import {
  TeamRolesForm,
  type TeamRoleEntry,
} from "@/components/organization/TeamRolesForm";
import { AiDataSharingOnboarding } from "@/components/settings/AiDataSharingOnboarding";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  companyFormSchema,
  SECTORS,
  ONBOARDING_OMIT,
  type CompanyFormData,
  parseCompanyFormData,
} from "@/lib/organization/constants";
import type { AiDataSharingLevel } from "@/lib/ai/build-context";

type Step = "company" | "team" | "ai";

const STEPS: Step[] = ["company", "team", "ai"];

interface OnboardingFlowProps {
  roleSlugMap: Record<string, string[]>;
}

export function OnboardingFlow({ roleSlugMap }: OnboardingFlowProps) {
  const t = useTranslations("onboarding");
  const tOrg = useTranslations("organization");
  const router = useRouter();

  const [step, setStep] = useState<Step>("company");
  const [companyData, setCompanyData] = useState<CompanyFormData | null>(null);
  const [teamRoles, setTeamRoles] = useState<TeamRoleEntry[] | undefined>();
  const [aiDataSharing, setAiDataSharing] = useState<AiDataSharingLevel>("none");

  const createMutation =
    trpc.assessment.createCompanyAndAssessment.useMutation();

  const stepIndex = STEPS.indexOf(step);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const fieldOverrides: Record<string, FieldOverride> = {
    name: {
      label: tOrg("name"),
      placeholder: tOrg("namePlaceholder"),
    },
    sector: {
      label: tOrg("sector"),
      component: "enum",
      placeholder: tOrg("sectorPlaceholder"),
      options: SECTORS.map((s) => ({
        value: s,
        label: tOrg(`sectors.${s}`),
      })),
    },
    entityType: {
      label: tOrg("entityType"),
      description: tOrg("entityTypeHelp"),
      options: [
        { value: "essential", label: tOrg("entityTypes.essential") },
        { value: "important", label: tOrg("entityTypes.important") },
        { value: "kritis", label: tOrg("entityTypes.kritis") },
      ],
    },
    legalForm: {
      label: tOrg("legalForm"),
      placeholder: tOrg("legalFormPlaceholder"),
    },
    employeeCount: {
      label: tOrg("employees"),
      placeholder: "50",
    },
    contactEmail: {
      label: tOrg("contactEmail"),
      placeholder: "compliance@example.com",
    },
  };

  function handleCompanySubmit(data: Record<string, unknown>) {
    setCompanyData(parseCompanyFormData(data));
    setStep("team");
  }

  function handleTeamSubmit(roles?: TeamRoleEntry[]) {
    setTeamRoles(roles && roles.length > 0 ? roles : undefined);
    setStep("ai");
  }

  async function handleFinalSubmit(level: AiDataSharingLevel) {
    if (!companyData) return;

    const toastId = toast.loading(t("creating"));
    try {
      await createMutation.mutateAsync({
        ...companyData,
        teamRoles,
        aiDataSharing: level,
      });
      toast.dismiss(toastId);
      router.push("/journey");
    } catch {
      toast.dismiss(toastId);
      toast.error(t("createError"));
    }
  }

  return (
    <div className="space-y-8 pb-24">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{t("step", { current: stepIndex + 1, total: STEPS.length })}</span>
          <span className="flex gap-1.5">
            {STEPS.map((s, i) => (
              <span
                key={s}
                className={cn(
                  "h-1.5 w-6 rounded-full transition-colors duration-300",
                  i <= stepIndex ? "bg-primary" : "bg-muted",
                )}
              />
            ))}
          </span>
        </div>
        <Progress value={progress} className="h-1" />
      </div>

      {/* Step content */}
      {step === "company" && (
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Building2 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{t("steps.company")}</h2>
          </div>
          <SchemaForm
            schema={companyFormSchema}
            onSubmit={handleCompanySubmit}
            omit={[...ONBOARDING_OMIT]}
            fieldOverrides={fieldOverrides}
            defaultValues={{
              name: companyData?.name ?? "",
              sector: companyData?.sector ?? "",
              entityType: companyData?.entityType ?? "important",
              legalForm: companyData?.legalForm ?? "",
              contactEmail: companyData?.contactEmail ?? "",
              ...(companyData?.employeeCount
                ? { employeeCount: companyData.employeeCount }
                : {}),
            }}
            columns={2}
            submitLabel={t("nav.next")}
          />
        </div>
      )}

      {step === "team" && (
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{t("steps.team")}</h2>
          </div>
          <TeamRolesForm
            roleSlugMap={roleSlugMap}
            onSubmit={(roles) => handleTeamSubmit(roles)}
            onSkip={() => handleTeamSubmit()}
            onBack={() => setStep("company")}
            isSubmitting={false}
          />
        </div>
      )}

      {step === "ai" && (
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{t("steps.ai")}</h2>
          </div>
          <AiDataSharingOnboarding
            value={aiDataSharing}
            onChange={setAiDataSharing}
            onSubmit={() => handleFinalSubmit(aiDataSharing)}
            onBack={() => setStep("team")}
            isSubmitting={createMutation.isPending}
          />
        </div>
      )}
    </div>
  );
}
