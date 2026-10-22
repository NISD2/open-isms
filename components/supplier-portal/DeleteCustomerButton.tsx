"use client";

/**
 * Delete a customer, from the page header so it is on every tab of the customer. It asks first, in
 * a modal. What happens depends on the customer: one the supplier added itself is deleted with the
 * systems and notices recorded for it; one with an account of its own keeps its record of the
 * supplier and only loses its access (relationship.remove).
 */
import { Trash2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { trpc } from "@/lib/trpc/client";

export function DeleteCustomerButton({
  relationshipId,
  customerName,
  customerHasAccount,
}: {
  readonly relationshipId: string;
  readonly customerName: string;
  readonly customerHasAccount: boolean;
}) {
  const t = useTranslations("supplierPortalContact");
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const remove = trpc.supplierPortal.relationship.remove.useMutation({
    onSuccess: () => {
      setOpen(false);
      router.push("/portal/supplier/customers");
      router.refresh();
    },
    onError: (e) => {
      toast.error(e.message);
      setOpen(false);
    },
  });

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="text-destructive hover:text-destructive"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
        {t("deleteCustomer")}
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("deleteCustomerTitle", { name: customerName })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                customerHasAccount
                  ? "deleteCustomerBodyOwnAccount"
                  : "deleteCustomerBody",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={remove.isPending}
              onClick={(e) => {
                // Stay open until the server has answered.
                e.preventDefault();
                remove.mutate({ id: relationshipId });
              }}
            >
              {t("deleteCustomer")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
