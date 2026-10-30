"use client";

import { TRPCClientError } from "@trpc/client";
import { Loader2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import {
  AppQrCode,
  RecoveryCodes,
  type SetupMaterial,
} from "@/components/auth/TwoFactorMaterial";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";
import { trpc } from "@/lib/trpc/client";
import { SettingSwitch } from "./AssistantsAllowedSwitch";

export type TwoFactorStatus = {
  readonly available: boolean;
  readonly enabledAt: Date | null;
  readonly recoveryCodesLeft: number;
  readonly requiredBy: "platform" | "company" | null;
  readonly companyRequired: boolean;
};

/** What the card is doing: at rest, or one task open under the status. */
type Task =
  | { readonly kind: "idle" }
  | { readonly kind: "setup"; readonly material: SetupMaterial }
  | { readonly kind: "turnOff" }
  | { readonly kind: "newCodes" }
  | { readonly kind: "codesShown"; readonly codes: readonly string[] };

/**
 * The person's own second factor: set it up, see it is on and how many recovery codes are left,
 * make new codes, turn it off. Every change takes a code (lib/auth/two-factor), so a session left
 * open on someone's desk cannot quietly switch it off.
 */
export function TwoFactorSettings({ status }: { status: TwoFactorStatus }) {
  const t = useTranslations("settings.twoFactor");
  const format = useFormatter();
  const router = useRouter();
  const [task, setTask] = useState<Task>({ kind: "idle" });
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const start = trpc.twoFactor.startSetup.useMutation();
  const confirm = trpc.twoFactor.confirmSetup.useMutation();
  const disable = trpc.twoFactor.disable.useMutation();
  const replace = trpc.twoFactor.replaceRecoveryCodes.useMutation();
  const busy =
    start.isPending || confirm.isPending || disable.isPending || replace.isPending;

  const open = (next: Task) => {
    setTask(next);
    setCode("");
    setError("");
  };
  const failed = (err: unknown) =>
    setError(
      err instanceof TRPCClientError && err.data?.code === "TOO_MANY_REQUESTS"
        ? t("tooMany")
        : t("wrongCode"),
    );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (task.kind === "setup") {
        await confirm.mutateAsync({ totpCode: code });
        toast.success(t("turnedOn"));
        open({ kind: "idle" });
        router.refresh();
      } else if (task.kind === "turnOff") {
        await disable.mutateAsync({ totpCode: code });
        toast.success(t("turnedOff"));
        open({ kind: "idle" });
        router.refresh();
      } else if (task.kind === "newCodes") {
        const { recoveryCodes } = await replace.mutateAsync({ totpCode: code });
        open({ kind: "codesShown", codes: recoveryCodes });
      }
    } catch (err) {
      failed(err);
    }
  }

  const statusLine = !status.available
    ? t("unavailable")
    : status.enabledAt
      ? t("on", {
          date: format.dateTime(new Date(status.enabledAt), { dateStyle: "medium" }),
          count: status.recoveryCodesLeft,
        })
      : t("off");

  return (
    <section
      className="mb-6 space-y-4 rounded-lg border p-4"
      aria-labelledby="two-factor-title"
    >
      <div className="space-y-1">
        <h2 id="two-factor-title" className="text-sm font-medium">
          {t("title")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
        <p className="text-xs text-muted-foreground">{t("googleNote")}</p>
      </div>

      <p className="text-sm">
        <span className="font-medium">{statusLine}</span>
        {status.requiredBy && (
          <span className="text-muted-foreground">
            {" "}
            {status.requiredBy === "platform"
              ? t("requiredByPlatform")
              : t("requiredByCompany")}
          </span>
        )}
      </p>

      {status.available && task.kind === "idle" && (
        <div className="flex flex-wrap gap-2">
          {status.enabledAt ? (
            <>
              <Button variant="outline" onClick={() => open({ kind: "newCodes" })}>
                {t("newCodes")}
              </Button>
              {!status.requiredBy && (
                <Button variant="ghost" onClick={() => open({ kind: "turnOff" })}>
                  {t("turnOff")}
                </Button>
              )}
            </>
          ) : (
            <Button
              disabled={busy}
              onClick={async () => {
                try {
                  open({ kind: "setup", material: await start.mutateAsync() });
                } catch {
                  toast.error(t("unavailable"));
                }
              }}
            >
              {start.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("setUp")}
            </Button>
          )}
        </div>
      )}

      {task.kind === "setup" && (
        <div className="space-y-4 text-sm">
          <p>{t("setupScan")}</p>
          <div className="max-w-xs">
            <AppQrCode material={task.material} />
          </div>
          <p>{t("setupSave")}</p>
          <div className="max-w-sm">
            <RecoveryCodes codes={task.material.recoveryCodes} />
          </div>
          <p>{t("setupConfirm")}</p>
        </div>
      )}

      {task.kind === "codesShown" && (
        <div className="space-y-3 text-sm">
          <p>{t("newCodesShown")}</p>
          <div className="max-w-sm">
            <RecoveryCodes codes={task.codes} />
          </div>
          <Button
            onClick={() => {
              open({ kind: "idle" });
              router.refresh();
            }}
          >
            {t("done")}
          </Button>
        </div>
      )}

      {(task.kind === "setup" || task.kind === "turnOff" || task.kind === "newCodes") && (
        <form onSubmit={submit} className="max-w-sm space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="two-factor-code">{t("confirmLabel")}</Label>
            <Input
              id="two-factor-code"
              autoComplete="one-time-code"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={20}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className="font-mono tracking-wider"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {task.kind === "setup"
                ? t("confirm")
                : task.kind === "turnOff"
                  ? t("turnOffConfirm")
                  : t("newCodesConfirm")}
            </Button>
            <Button type="button" variant="ghost" onClick={() => open({ kind: "idle" })}>
              {t("cancel")}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}

/**
 * The company's switch: everyone signs in with a code (twoFactor.setCompanyRequired). Only an
 * admin changes it, and only where this installation has the key the feature needs.
 */
export function TwoFactorRequiredSwitch({
  required,
  isAdmin,
  available,
}: {
  required: boolean;
  isAdmin: boolean;
  available: boolean;
}) {
  const t = useTranslations("settings.twoFactorRequired");
  const save = trpc.twoFactor.setCompanyRequired.useMutation();
  return (
    <SettingSwitch
      id="two-factor-required"
      namespace="settings.twoFactorRequired"
      checked={required}
      isAdmin={isAdmin}
      disabledNote={available || required ? null : t("unavailable")}
      save={({ allowed }) => save.mutateAsync({ required: allowed })}
    />
  );
}
