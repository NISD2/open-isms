"use client";

/**
 * The customer's security contact on the Access page: who gets the link to your security profile,
 * and the three things a supplier does with it.
 *
 *   - add or change the email: the link goes to the new address and the old one stops working
 *   - remove access: the address goes, the customer stays in your list
 *   - remove the customer: the row ends and leaves your list
 *
 * A customer with an account of its own is reached at the address it keeps there, so the first two
 * are not offered for it. Every confirmation is a modal; nothing uses the browser's own prompts.
 */
import { Mail, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
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
import { useRouter } from "@/i18n/navigation";
import { trpc } from "@/lib/trpc/client";

type RelationshipStatus = "active" | "revoked" | "bounced";
type Confirm = "contact" | "customer" | null;

export function CustomerContactCard({
  relationshipId,
  customerEmail,
  customerOrgName,
  customerHasAccount,
  status,
}: {
  readonly relationshipId: string;
  readonly customerEmail: string | null;
  readonly customerOrgName: string | null;
  readonly customerHasAccount: boolean;
  readonly status: RelationshipStatus | null;
}) {
  const t = useTranslations("supplierPortalContact");
  const tAccess = useTranslations("supplierPortal.access");
  const router = useRouter();
  const [emailOpen, setEmailOpen] = useState(false);
  const [confirm, setConfirm] = useState<Confirm>(null);

  const setContact = trpc.supplierPortal.relationship.setContact.useMutation({
    onSuccess: (_, input) => {
      toast.success(t("linkSent", { email: input.customerEmail }));
      setEmailOpen(false);
      router.refresh();
    },
  });
  const removeContact = trpc.supplierPortal.relationship.removeContact.useMutation({
    onSuccess: () => {
      toast.success(t("accessRemoved"));
      setConfirm(null);
      router.refresh();
    },
    onError: (e) => {
      toast.error(e.message);
      setConfirm(null);
    },
  });
  const removeCustomer = trpc.supplierPortal.relationship.remove.useMutation({
    onSuccess: () => {
      setConfirm(null);
      router.push("/portal/supplier/customers");
      router.refresh();
    },
    onError: (e) => {
      toast.error(e.message);
      setConfirm(null);
    },
  });

  const ended = status === "revoked";
  // Without a company name the customer would have no name left once its address is gone.
  const canRemoveAccess = Boolean(customerEmail && customerOrgName?.trim());

  return (
    <section className="space-y-3">
      <div className="rounded-md border bg-card p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <div className="font-medium text-sm truncate">
              {customerEmail ?? tAccess("contactMissing")}
            </div>
            {customerOrgName && (
              <div className="text-xs text-muted-foreground truncate">
                {customerOrgName}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {status && <StatusBadge status={status} />}
          {!customerHasAccount && !ended && (
            <Button size="sm" variant="outline" onClick={() => setEmailOpen(true)}>
              {customerEmail ? (
                <Pencil className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {customerEmail ? t("changeEmail") : t("addEmail")}
            </Button>
          )}
          {!customerHasAccount && !ended && canRemoveAccess && (
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => setConfirm("contact")}
              aria-label={t("removeAccess")}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {customerHasAccount && (
        <p className="text-xs text-muted-foreground">{t("ownAccountNote")}</p>
      )}

      {!ended && (
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          onClick={() => setConfirm("customer")}
        >
          {t("removeCustomer")}
        </Button>
      )}

      <EmailDialog
        open={emailOpen}
        onOpenChange={setEmailOpen}
        replacing={customerEmail}
        pending={setContact.isPending}
        error={setContact.isError ? setContact.error.message : null}
        onSubmit={(email) =>
          setContact.mutate({ id: relationshipId, customerEmail: email })
        }
      />

      <AlertDialog
        open={confirm === "contact"}
        onOpenChange={(open) => !open && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("removeAccessTitle", { email: customerEmail ?? "" })}
            </AlertDialogTitle>
            <AlertDialogDescription>{t("removeAccessBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeContact.isPending}>
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={removeContact.isPending}
              onClick={(e) => {
                // Stay open until the server has answered.
                e.preventDefault();
                removeContact.mutate({ id: relationshipId });
              }}
            >
              {t("removeAccess")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={confirm === "customer"}
        onOpenChange={(open) => !open && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("removeCustomerTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{tAccess("revokeConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeCustomer.isPending}>
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={removeCustomer.isPending}
              onClick={(e) => {
                e.preventDefault();
                removeCustomer.mutate({ id: relationshipId });
              }}
            >
              {t("removeCustomer")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function EmailDialog({
  open,
  onOpenChange,
  replacing,
  pending,
  error,
  onSubmit,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  /** The address being replaced, or null when there is none yet. */
  readonly replacing: string | null;
  readonly pending: boolean;
  readonly error: string | null;
  readonly onSubmit: (email: string) => void;
}) {
  const t = useTranslations("supplierPortalContact");
  const [email, setEmail] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(email.trim());
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {t(replacing ? "changeEmailTitle" : "addEmailTitle")}
            </DialogTitle>
            <DialogDescription>
              {t(replacing ? "changeEmailBody" : "addEmailBody", {
                email: replacing ?? "",
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="customer-contact-email">{t("emailField")}</Label>
            <Input
              id="customer-contact-email"
              type="email"
              required
              autoComplete="off"
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={pending || email.trim() === ""}>
              {t("sendLink")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function StatusBadge({ status }: { status: RelationshipStatus }) {
  const t = useTranslations("supplierPortal.access.status");
  const variants: Record<
    RelationshipStatus,
    "default" | "secondary" | "outline" | "destructive"
  > = {
    active: "default",
    revoked: "outline",
    bounced: "destructive",
  };
  return (
    <Badge variant={variants[status]} className="text-xs">
      {t(status)}
    </Badge>
  );
}
