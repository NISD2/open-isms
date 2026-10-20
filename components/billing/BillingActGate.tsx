"use client";

/**
 * The page's side of AGB B7 and B10: before an export or a sign-off it asks the billing state
 * (`billing.acts`, lib/billing/account-state.ts). Allowed, the act runs. Inside the money back it
 * first asks "are you sure", because the first export or sign-off ends the money back, records the
 * yes (`billing.waiveMoneyBack`) and then runs. Without an order it says so and leads to the
 * order. The server decides the same way again, so this is the warning, not the lock.
 */
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";
import { useFormatDay } from "@/components/billing/CancelDialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { OFFER_PATH } from "@/lib/billing/access";
import type { BillingAct } from "@/lib/billing/account-state";
import { trpc } from "@/lib/trpc/client";

export function useBillingAct(act: BillingAct): {
  /** Whether the act needs the dialog first: a confirm, or an order. */
  readonly blocks: boolean;
  /** Runs `proceed` now if allowed, else after the dialog's yes. */
  readonly guard: (proceed: () => void) => void;
  readonly dialog: ReactNode;
} {
  const t = useTranslations("billing.acts");
  const day = useFormatDay();
  const utils = trpc.useUtils();
  const acts = trpc.billing.acts.useQuery(undefined, { staleTime: 30_000 });
  const waive = trpc.billing.waiveMoneyBack.useMutation();
  const [pending, setPending] = useState<{ readonly proceed: () => void } | null>(null);
  const verdict = acts.data
    ? act === "export"
      ? acts.data.export
      : acts.data.signOff
    : null;

  // Before the state has loaded the act goes ahead; the server checks it again.
  const blocks = verdict !== null && verdict.kind !== "allow";
  const guard = (proceed: () => void) => {
    if (blocks) setPending({ proceed });
    else proceed();
  };

  const confirm = async () => {
    if (!pending) return;
    try {
      await waive.mutateAsync({ through: act });
    } catch {
      toast.error(t("failed"));
      return;
    }
    await utils.billing.acts.invalidate();
    const { proceed } = pending;
    setPending(null);
    proceed();
  };

  const kind = act === "export" ? "export" : "signOff";
  const dialog = verdict && verdict.kind !== "allow" && (
    <AlertDialog
      open={pending !== null}
      onOpenChange={(open) => !open && setPending(null)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {verdict.kind === "confirm" ? t(`${kind}.confirmTitle`) : t("orderTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {verdict.kind === "confirm"
              ? t(`${kind}.confirmBody`, { lastDay: day(verdict.lastDay) })
              : t("orderBody")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={waive.isPending}>{t("cancel")}</AlertDialogCancel>
          {verdict.kind === "confirm" ? (
            <Button onClick={confirm} disabled={waive.isPending}>
              {t(`${kind}.confirm`)}
            </Button>
          ) : (
            <Button asChild>
              <Link href={OFFER_PATH}>{t("orderAction")}</Link>
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { blocks, guard, dialog };
}
