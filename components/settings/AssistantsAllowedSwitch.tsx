"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "@/i18n/navigation";
import { trpc } from "@/lib/trpc/client";

/** One of the company's decisions: an admin's switch, saved on change. */
export function SettingSwitch({
  id,
  namespace,
  checked,
  isAdmin,
  disabledNote,
  save,
}: {
  id: string;
  namespace:
    | "settings.mcp.switch"
    | "settings.mcp.recordsSwitch"
    | "settings.twoFactorRequired";
  checked: boolean;
  isAdmin: boolean;
  /** Why the switch cannot change now, or null when it can. */
  disabledNote: string | null;
  save: (input: { allowed: boolean }) => Promise<unknown>;
}) {
  const t = useTranslations(namespace);
  const tSettings = useTranslations("settings");
  const router = useRouter();
  const [value, setValue] = useState(checked);
  const [isPending, startTransition] = useTransition();

  const change = (next: boolean) => {
    setValue(next);
    startTransition(async () => {
      try {
        await save({ allowed: next });
        toast.success(next ? t("turnedOn") : t("turnedOff"));
        router.refresh();
      } catch {
        setValue(checked);
        toast.error(tSettings("saveError"));
      }
    });
  };

  return (
    <div className="mb-6 flex items-start justify-between gap-4 rounded-lg border p-4">
      <div className="space-y-1">
        <Label htmlFor={id} className="text-sm font-medium">
          {t("label")}
        </Label>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
        {!isAdmin && (
          <p className="text-xs text-muted-foreground">{tSettings("adminOnly")}</p>
        )}
        {isAdmin && disabledNote && (
          <p className="text-xs text-muted-foreground">{disabledNote}</p>
        )}
      </div>
      <Switch
        id={id}
        checked={value}
        onCheckedChange={change}
        disabled={!isAdmin || isPending || disabledNote !== null}
      />
    </div>
  );
}

/**
 * The company's decision whether its people may connect their own AI assistants, which then read
 * and fill the walkthrough with the company's data. Only an admin changes it; turning it off ends
 * every connected assistant (assistants.setAllowed).
 */
export function AssistantsAllowedSwitch({
  allowed,
  isAdmin,
}: {
  allowed: boolean;
  isAdmin: boolean;
}) {
  const save = trpc.assistants.setAllowed.useMutation();
  return (
    <SettingSwitch
      id="assistants-allowed"
      namespace="settings.mcp.switch"
      checked={allowed}
      isAdmin={isAdmin}
      disabledNote={null}
      save={save.mutateAsync}
    />
  );
}

/**
 * The company's decision whether those assistants may also read its records, as the export holds
 * them, for people who may export (assistants.setReadRecords). Only while assistants are
 * allowed; turning them off turns this off too.
 */
export function AssistantsReadRecordsSwitch({
  readRecords,
  assistantsAllowed,
  isAdmin,
}: {
  readRecords: boolean;
  assistantsAllowed: boolean;
  isAdmin: boolean;
}) {
  const t = useTranslations("settings.mcp.recordsSwitch");
  const save = trpc.assistants.setReadRecords.useMutation();
  return (
    <SettingSwitch
      // Remount when assistants are turned off, which turns this off on the server too.
      key={String(assistantsAllowed)}
      id="assistants-read-records"
      namespace="settings.mcp.recordsSwitch"
      checked={readRecords}
      isAdmin={isAdmin}
      disabledNote={assistantsAllowed ? null : t("needsAssistants")}
      save={save.mutateAsync}
    />
  );
}
