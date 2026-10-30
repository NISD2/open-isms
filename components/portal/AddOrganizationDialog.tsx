"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getPathname } from "@/i18n/navigation";
import type { LocaleCode } from "@/lib/locale";
import { trpc } from "@/lib/trpc/client";

const NEW_ACCOUNT = "new";

/**
 * Adding an organization starts with the billing account that pays for it (Simon, 23.10.2026:
 * "When you set up the new company you are forced to put it under a billing account"). The
 * accounts offered are the ones the person pays for, named by their organizations, with the one
 * the open organization is on picked first; a new account is always there too.
 */
export function AddOrganizationDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("portal");
  const locale = useLocale();
  const choices = trpc.company.billingChoices.useQuery(undefined, { enabled: open });
  const [picked, setPicked] = useState<string | null>(null);
  const add = trpc.company.createAnother.useMutation({
    // A full load, because the portal layouts render the sidebar for the open organization on
    // the server and a client navigation keeps them (as in OrganizationSubmenu).
    onSuccess: () =>
      window.location.assign(
        getPathname({ href: "/journey", locale: locale as LocaleCode }),
      ),
    onError: (e) => toast.error(e.message),
  });

  const data = choices.data;
  const value = picked ?? data?.preselect ?? NEW_ACCOUNT;
  const names = (companies: readonly string[]) =>
    companies.map((name) => name || t("untitledOrganization")).join(", ");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("addOrganization")}</DialogTitle>
          <DialogDescription>{t("addDialog.description")}</DialogDescription>
        </DialogHeader>
        {data && (
          <RadioGroup value={value} onValueChange={setPicked} className="gap-2">
            {[
              ...data.accounts.map((a) => ({
                id: a.id,
                title: names(a.companies),
                note: a.paid ? t("addDialog.paid") : t("addDialog.unpaid"),
              })),
              {
                id: NEW_ACCOUNT,
                title: t("addDialog.newAccount"),
                note: t("addDialog.newAccountNote"),
              },
            ].map((option) => (
              <label
                key={option.id}
                htmlFor={`account-${option.id}`}
                className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 hover:bg-muted/40 has-[[data-state=checked]]:border-primary"
              >
                <RadioGroupItem
                  id={`account-${option.id}`}
                  value={option.id}
                  className="mt-0.5"
                />
                <span className="min-w-0 space-y-0.5">
                  <span className="block font-medium text-sm leading-snug">
                    {option.title}
                  </span>
                  <span className="block text-muted-foreground text-sm">
                    {option.note}
                  </span>
                </span>
              </label>
            ))}
          </RadioGroup>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("addDialog.cancel")}
          </Button>
          <Button
            disabled={!data || add.isPending}
            onClick={() =>
              add.mutate({ billingAccountId: value === NEW_ACCOUNT ? null : value })
            }
          >
            {t("addDialog.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
