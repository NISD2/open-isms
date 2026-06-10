"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { AiDataSharingCards } from "./AiDataSharingCards";
import type { AiDataSharingLevel } from "@/lib/ai/build-context";

interface AiDataSharingSettingsProps {
  currentLevel: AiDataSharingLevel;
  isAdmin: boolean;
}

export function AiDataSharingSettings({
  currentLevel,
  isAdmin,
}: AiDataSharingSettingsProps) {
  const t = useTranslations("settings.aiDataSharing");
  const tSettings = useTranslations("settings");
  const router = useRouter();
  const [value, setValue] = useState<AiDataSharingLevel>(currentLevel);
  const [isPending, startTransition] = useTransition();
  const updateMutation = trpc.assessment.updateCompany.useMutation();

  function handleChange(level: AiDataSharingLevel) {
    setValue(level);

    startTransition(async () => {
      try {
        await updateMutation.mutateAsync({ aiDataSharing: level });
        toast.success(tSettings("saved"));
        router.refresh();
      } catch {
        setValue(currentLevel);
        toast.error(tSettings("saveError"));
      }
    });
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-1">{t("title")}</h2>
      <p className="text-sm text-muted-foreground mb-4">{t("description")}</p>

      {!isAdmin && (
        <p className="text-sm text-muted-foreground mb-4 italic">
          {tSettings("adminOnly")}
        </p>
      )}

      <AiDataSharingCards
        value={value}
        onChange={handleChange}
        disabled={!isAdmin || isPending}
        idPrefix="ai-sharing"
      />
    </div>
  );
}
