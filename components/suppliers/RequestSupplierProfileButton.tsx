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
import { useState } from "react";
import type { z } from "zod";
import { Mail, Copy, Check } from "lucide-react";
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
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { SchemaForm } from "@/lib/forms/schema-form";
import type { FieldOverride } from "@/lib/forms/field-renderer";
import { supplierInviteRequestSchema } from "@/schema/validators";

type InviteRequestValues = z.infer<typeof supplierInviteRequestSchema>;

export function RequestSupplierProfileButton() {
  const [open, setOpen] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [lastEmail, setLastEmail] = useState<string>("");

  const create = trpc.supplierInvite.create.useMutation({
    onSuccess: (data, variables) => {
      setInviteUrl(data.inviteUrl);
      setLastEmail(variables.toEmail);
      toast.success(`Invite sent to ${variables.toEmail}`);
    },
    onError: (err) => toast.error(err.message),
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

  const fieldOverrides: Record<string, FieldOverride> = {
    toEmail: {
      label: "Supplier email",
      placeholder: "security@supplier.de",
      description:
        "The link is bound to this email — the supplier can only accept it after signing in with the same address.",
    },
    message: {
      label: "Personal message (optional)",
      placeholder:
        "Hi, we need this for our NIS2 §30 supplier monitoring obligation. Thanks!",
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
          Request security profile from a supplier
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-lg flex flex-col gap-6 p-6 overflow-y-auto">
        <SheetHeader className="p-0">
          <SheetTitle>Request a supplier security profile</SheetTitle>
          <SheetDescription>
            Send a magic-link invite to a supplier. They sign up via the
            supplier portal and fill the unified ENISA-anchored questionnaire
            once. Their answers auto-link back to your supplier inventory.
          </SheetDescription>
        </SheetHeader>

        {!inviteUrl ? (
          <SchemaForm
            schema={supplierInviteRequestSchema}
            defaultValues={{ toEmail: "", message: "" }}
            fieldOverrides={fieldOverrides}
            onSubmit={async (data) => {
              await create.mutateAsync(data as InviteRequestValues);
            }}
            submitLabel="Send invite"
            isSubmitting={create.isPending}
          />
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 p-4 text-sm">
              <p className="font-medium text-green-900 dark:text-green-100">
                Invite sent to {lastEmail}.
              </p>
              <p className="text-green-800 dark:text-green-200 mt-1 text-xs">
                Expires in 30 days. You can also copy the link below and share
                it directly.
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Invite link</Label>
              <div className="mt-1.5 flex gap-2">
                <Input
                  readOnly
                  value={inviteUrl}
                  className="font-mono text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button onClick={() => setOpen(false)}>Done</Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
