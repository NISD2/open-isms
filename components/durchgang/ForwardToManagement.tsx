"use client";

import { Check, Send } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
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
import { isLocaleCode, type LocaleCode } from "@/lib/locale";
import { trpc } from "@/lib/trpc/client";
import { trpcErrorCode } from "@/lib/trpc/error-message";

/** The refusals the dialog explains in its own words; anything else gets the general one. */
const KNOWN_REFUSALS: Readonly<Record<string, "member" | "limit">> = {
  CONFLICT: "member",
  TOO_MANY_REQUESTS: "limit",
};

/**
 * At the walk's lock, beside the order: hand the decision to management. Management gets an
 * invite into this company's account, lands on the decision page, and orders for this company
 * (team.forwardToManagement). The step belongs to someone else, so it is an invite sent from the
 * screen, never a page to print (ui-design principle 15).
 *
 * The send shows as done at once; a refused send brings the form back with what was typed and one
 * sentence saying why (principle 12).
 */
export function ForwardToManagement() {
  const t = useTranslations("durchgang.ui.home.forward");
  const current = useLocale();
  const locale: LocaleCode = isLocaleCode(current) ? current : "de";
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const forward = trpc.team.forwardToManagement.useMutation();
  const sent = forward.isPending || forward.isSuccess;
  const refusal = forward.isError
    ? (KNOWN_REFUSALS[trpcErrorCode(forward.error) ?? ""] ?? "failed")
    : null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    forward.mutate({ name: name.trim(), email: email.trim(), locale });
  };

  const close = (next: boolean) => {
    setOpen(next);
    if (!next && forward.isSuccess) {
      setName("");
      setEmail("");
      forward.reset();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        <Send className="size-4" />
        {t("action")}
      </button>
      <Dialog open={open} onOpenChange={close}>
        <DialogContent className="sm:max-w-md">
          {sent ? (
            <>
              <DialogHeader>
                <span className="mb-2 flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-5" />
                </span>
                <DialogTitle>{t("sentTitle", { name: name.trim() })}</DialogTitle>
                <DialogDescription>
                  {t("sentText", { email: email.trim() })}
                </DialogDescription>
              </DialogHeader>
              {forward.data?.emailed === false && (
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  {t("notEmailed")}
                </p>
              )}
              <DialogFooter>
                <Button onClick={() => close(false)}>{t("close")}</Button>
              </DialogFooter>
            </>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <DialogHeader>
                <DialogTitle>{t("title")}</DialogTitle>
                <DialogDescription>{t("lead")}</DialogDescription>
              </DialogHeader>
              <div className="space-y-1.5">
                <Label htmlFor="dg-forward-name">{t("name")}</Label>
                <Input
                  id="dg-forward-name"
                  required
                  maxLength={120}
                  autoComplete="off"
                  className="h-11 text-base sm:text-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dg-forward-email">{t("email")}</Label>
                <Input
                  id="dg-forward-email"
                  type="email"
                  required
                  maxLength={255}
                  autoComplete="off"
                  placeholder={t("placeholder")}
                  className="h-11 text-base sm:text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {refusal && (
                <p role="alert" className="text-sm">
                  {t(`refused.${refusal}`)}
                </p>
              )}
              <DialogFooter>
                <Button type="submit" className="h-11">
                  <Send />
                  {t("send")}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
