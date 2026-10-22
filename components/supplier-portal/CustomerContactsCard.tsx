"use client";

/**
 * Who holds a link to your security profile at this customer, on the Access page: the people
 * listed, each removable, and the shared email form (components/shared/InviteField.tsx) to add as
 * many more as you like. Each person is sent a link of their own, so removing one ends that
 * person's link and no other.
 *
 * A customer with an account of its own is reached at the address it keeps there, so people are
 * neither listed nor added for it. Deleting the customer is a button in the page header
 * (DeleteCustomerButton).
 */
import { Mail, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { InviteField } from "@/components/shared/InviteField";
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
import { useRouter } from "@/i18n/navigation";
import { trpc } from "@/lib/trpc/client";

type RelationshipStatus = "active" | "revoked" | "bounced";

export type Contact = {
  /** Null for the address on the customer's own row. */
  readonly contactId: string | null;
  readonly email: string;
};

export function CustomerContactsCard({
  relationshipId,
  contacts,
  customerOrgName,
  customerHasAccount,
  status,
}: {
  readonly relationshipId: string;
  readonly contacts: readonly Contact[];
  readonly customerOrgName: string | null;
  readonly customerHasAccount: boolean;
  readonly status: RelationshipStatus | null;
}) {
  const t = useTranslations("supplierPortalContact");
  const tc = useTranslations("common");
  const router = useRouter();
  const [removing, setRemoving] = useState<Contact | null>(null);

  const addContact = trpc.supplierPortal.contact.add.useMutation();
  const removeContact = trpc.supplierPortal.contact.remove.useMutation({
    onSuccess: () => {
      toast.success(t("accessRemoved"));
      setRemoving(null);
      router.refresh();
    },
    onError: (e) => {
      toast.error(e.message);
      setRemoving(null);
    },
  });

  const ended = status === "revoked";
  const canAdd = !customerHasAccount && !ended;
  // The address on the row cannot go without a company name: the customer would have no name left.
  const canRemove = (c: Contact) =>
    canAdd && (c.contactId !== null || Boolean(customerOrgName?.trim()));

  return (
    <section className="space-y-4">
      <div className="rounded-md border bg-card">
        {contacts.length === 0 ? (
          <div className="flex items-center justify-between gap-4 p-4">
            <div className="text-sm text-muted-foreground">
              {customerHasAccount ? t("ownAccountNote") : t("contactsEmpty")}
            </div>
            {status && <StatusBadge status={status} />}
          </div>
        ) : (
          <ul className="divide-y">
            {contacts.map((c, i) => (
              <li
                key={c.contactId ?? "row"}
                className="flex items-center justify-between gap-4 p-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="font-medium text-sm truncate">{c.email}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {i === 0 && status && <StatusBadge status={status} />}
                  {canRemove(c) && (
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => setRemoving(c)}
                      aria-label={t("removeAccessFor", { email: c.email })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {canAdd && (
        <InviteField
          label={t("addPersonLabel")}
          sendLabel={t("sendLink")}
          placeholder={t("emailPlaceholder")}
          send={async (email) => {
            await addContact.mutateAsync({ id: relationshipId, customerEmail: email });
            router.refresh();
            // The access link is the person's own credential: it goes to them, not back to you.
            return { emailed: true };
          }}
          text={{
            send: t("sendLink"),
            sent: (email) => t("linkSent", { email }),
            notEmailed: (email) => t("linkNotSent", { email }),
            failed: tc("actionFailed"),
          }}
        />
      )}

      {customerHasAccount && contacts.length > 0 && (
        <p className="text-xs text-muted-foreground">{t("ownAccountNote")}</p>
      )}

      <AlertDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("removeAccessTitle", { email: removing?.email ?? "" })}
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
                if (!removing) return;
                removeContact.mutate({
                  id: relationshipId,
                  contactId: removing.contactId ?? undefined,
                });
              }}
            >
              {t("removeAccess")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
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
