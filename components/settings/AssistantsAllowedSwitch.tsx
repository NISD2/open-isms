"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "@/i18n/navigation";
import { trpc } from "@/lib/trpc/client";

/**
 * The company's decision whether its people may connect their own AI assistants, which then read
 * and fill the walkthrough with the company's data. Only an admin changes it; turning it off ends
 * every connected assistant (assessment.setAssistantsAllowed).
 */
export function AssistantsAllowedSwitch({
  allowed,
  isAdmin,
}: {
  allowed: boolean;
  isAdmin: boolean;
}) {
  const t = useTranslations("settings.mcp.switch");
  const tSettings = useTranslations("settings");
  const router = useRouter();
  const [value, setValue] = useState(allowed);
  const [isPending, startTransition] = useTransition();
  const save = trpc.assessment.setAssistantsAllowed.useMutation();

  const change = (next: boolean) => {
    setValue(next);
    startTransition(async () => {
      try {
        await save.mutateAsync({ allowed: next });
        toast.success(next ? t("turnedOn") : t("turnedOff"));
        router.refresh();
      } catch {
        setValue(allowed);
        toast.error(tSettings("saveError"));
      }
    });
  };

  return (
    <div className="mb-6 flex items-start justify-between gap-4 rounded-lg border p-4">
      <div className="space-y-1">
        <Label htmlFor="assistants-allowed" className="text-sm font-medium">
          {t("label")}
        </Label>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
        {!isAdmin && (
          <p className="text-xs text-muted-foreground">{tSettings("adminOnly")}</p>
        )}
      </div>
      <Switch
        id="assistants-allowed"
        checked={value}
        onCheckedChange={change}
        disabled={!isAdmin || isPending}
      />
    </div>
  );
}
