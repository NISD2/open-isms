"use client";

/**
 * Direction-B trigger — entity-side button to invite a supplier to fill their
 * NIS2 security profile via the supplier portal.
 *
 * Sits above the supplier inventory table on /portal/suppliers. Opens a small
 * modal that collects the supplier's email + an optional personal message,
 * calls supplierInvite.create, and shows the resulting invite URL so the
 * entity user can also copy-paste the link manually if email delivery is slow.
 */
import { Check, Copy, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { FieldOverride } from "@/lib/forms/field-renderer";
import { SchemaForm } from "@/lib/forms/schema-form";
import { trpc } from "@/lib/trpc/client";
import { userFacingError } from "@/lib/trpc/error-message";
import { supplierInviteRequestSchema } from "@/schema/validators";

type InviteRequestValues = z.infer<typeof supplierInviteRequestSchema>;

export function RequestSupplierProfileButton({
  label,
  supplierId,
}: {
  /** The button's text where a page words it its own way; the register's wording otherwise. */
  label?: string;
  /** The row of the supplier list it is sent for, which the reply then links. */
  supplierId?: string;
} = {}) {
  const t = useTranslations("suppliers.requestProfile");
  const [open, setOpen] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [lastEmail, setLastEmail] = useState<string>("");

  const create = trpc.supplierInvite.create.useMutation({
    onSuccess: (data, variables) => {
      setInviteUrl(data.inviteUrl);
      setLastEmail(variables.toEmail);
      toast.success(t("sent", { email: variables.toEmail }));
    },
    // The fallback matters: without it an unhandled server exception was
    // rendered verbatim into the toast.
    onError: (err) => toast.error(userFacingError(err, t("sendFailed"))),
  });

  function handleCopy() {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleReset() {
    setInviteUrl(null);
    setCopied(false);
    setLastEmail("");
  }

  // The form marks optional fields itself, so no label says "optional".
  const fieldOverrides: Record<string, FieldOverride> = {
    toEmail: {
      label: t("emailLabel"),
      placeholder: t("emailPlaceholder"),
      description: t("emailHint"),
    },
    message: {
      label: t("messageLabel"),
      placeholder: t("messagePlaceholder"),
      component: "textarea",
    },
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) handleReset();
      }}
    >
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Mail className="h-4 w-4 mr-2" />
          {label ?? t("button")}
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-lg flex flex-col gap-6 p-6 overflow-y-auto">
        <SheetHeader className="p-0">
          <SheetTitle>{t("title")}</SheetTitle>
          <SheetDescription>{t("description")}</SheetDescription>
        </SheetHeader>

        {!inviteUrl ? (
          <SchemaForm
            schema={supplierInviteRequestSchema}
            defaultValues={{ toEmail: "", message: "" }}
            fieldOverrides={fieldOverrides}
            onSubmit={async (data) => {
              await create.mutateAsync({ ...(data as InviteRequestValues), supplierId });
            }}
            submitLabel={t("submit")}
            isSubmitting={create.isPending}
          />
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 p-4 text-sm">
              <p className="font-medium text-green-900 dark:text-green-100">
                {t("sent", { email: lastEmail })}
              </p>
              <p className="text-green-800 dark:text-green-200 mt-1 text-xs">
                {t("expiry")}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">{t("linkLabel")}</Label>
              <div className="mt-1.5 flex gap-2">
                <Input readOnly value={inviteUrl} className="font-mono text-xs" />
                <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button onClick={() => setOpen(false)}>{t("done")}</Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
