"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc/client";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import type { PolicyType, PolicyConfigMap } from "@/lib/compliance/policy-config-defaults";
import type { companyPolicyConfig } from "@/schema";

type PolicyConfigRow = typeof companyPolicyConfig.$inferSelect;

/**
 * Shared hook for all policy config editors.
 * Handles query, mutation, edit state, and display derivation.
 * Eliminates duplicated boilerplate across CryptoPolicyEditor, AccessControlEditor, etc.
 */
export function usePolicyEditor<T extends PolicyType>(
  policyType: T,
  serverData?: Record<string, unknown> | null,
) {
  type Config = PolicyConfigMap[T];

  const t = useTranslations("policyConfig");
  const router = useRouter();

  const { data: row, isLoading } = trpc.policyConfig.get.useQuery(
    { policyType },
    serverData != null
      ? { initialData: serverData as PolicyConfigRow }
      : {},
  );
  const updateMut = trpc.policyConfig.update.useMutation({
    onSuccess: () => {
      toast.success(t("saved"));
      router.refresh();
    },
    onError: () => toast.error(t("saveFailed")),
  });

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<Config | null>(null);

  const startEditing = () => {
    if (!row) return;
    setDraft(row.config as Config);
    setIsEditing(true);
  };

  const save = () => {
    if (!draft) return;
    updateMut.mutate({ policyType, config: draft });
    setIsEditing(false);
  };

  const cancel = () => setIsEditing(false);

  // Derive display config: draft when editing, DB value otherwise.
  // Both are guaranteed non-null after the isLoading/!row guards in the component.
  const stored = row ? (row.config as Config) : null;
  const display = isEditing ? draft ?? stored : stored;

  return {
    isLoading,
    hasData: row != null,
    isEditing,
    isPending: updateMut.isPending,
    display,
    draft,
    setDraft,
    startEditing,
    save,
    cancel,
  };
}
