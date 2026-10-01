"use client";

/**
 * Deleting one's own account (Art. 17 GDPR), from the user menu. The server decides whether this
 * person may (lib/gdpr/self-erasure.ts); a refused case says why and where to write instead. Typing
 * the account's email is the confirmation, as in the platform admin's tool. Once done the session
 * belongs to nobody, so it signs out; the certificate arrives by email.
 */
import { Loader2 } from "lucide-react";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc/client";

export function DeleteAccountDialog({
  email,
  open,
  onOpenChange,
}: {
  readonly email: string;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("portal.deleteAccount");
  const check = trpc.user.deletionCheck.useQuery(undefined, { enabled: open });
  const [typed, setTyped] = useState("");
  const remove = trpc.user.deleteAccount.useMutation({
    onSuccess: () => signOut({ callbackUrl: "/" }),
  });
  const matches = typed.trim().toLowerCase() === email.trim().toLowerCase();
  const answer = check.data;

  return (
    <Dialog open={open} onOpenChange={(next) => !remove.isPending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        {!answer ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden />
          </div>
        ) : answer.allowed ? (
          <div className="space-y-4 text-sm">
            <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
              <li>{t("whatAccount")}</li>
              {answer.organization ? (
                <li>{t("whatOrganization", { name: answer.organization })}</li>
              ) : null}
              <li>{t("whatEmail", { email })}</li>
            </ul>
            <div className="space-y-1.5">
              <Label htmlFor="delete-account-email" className="font-normal">
                {t("confirmLabel")} <span className="font-medium font-mono">{email}</span>
              </Label>
              <Input
                id="delete-account-email"
                type="email"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                autoComplete="off"
                disabled={remove.isPending}
              />
            </div>
            {remove.error ? <p className="text-destructive">{t("failed")}</p> : null}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">{t(`refused.${answer.reason}`)}</p>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={remove.isPending}
          >
            {t("cancel")}
          </Button>
          {answer?.allowed ? (
            <Button
              variant="destructive"
              disabled={!matches || remove.isPending}
              onClick={() => remove.mutate({ confirmEmail: typed })}
            >
              {remove.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              ) : null}
              {t("confirm")}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
