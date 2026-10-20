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
  /** Whether the act may need the dialog first: a confirm, an order, or a state not loaded yet. */
  readonly blocks: boolean;
  /** Runs `proceed` once allowed: now, or after the dialog's yes. Loads the state first if needed. */
  readonly guard: (proceed: () => void) => void;
  readonly dialog: ReactNode;
} {
  const t = useTranslations("billing.acts");
  const day = useFormatDay();
  const utils = trpc.useUtils();
  const acts = trpc.billing.acts.useQuery(undefined, { staleTime: 30_000 });
  const waive = trpc.billing.waiveMoneyBack.useMutation();
  const [pending, setPending] = useState<{ readonly proceed: () => void } | null>(null);
  const verdictOf = (data: NonNullable<typeof acts.data>) =>
    act === "export" ? data.export : data.signOff;
  const verdict = acts.data ? verdictOf(acts.data) : null;

  const blocks = verdict === null || verdict.kind !== "allow";
  // Never on a guess: a click before the state has loaded waits for it, so a refused download
  // does not replace the page and a confirm is not skipped. If it cannot be read, the server
  // decides, as it does every time.
  const guard = (proceed: () => void) => {
    const decide = (data: typeof acts.data | null) => {
      const v = data ? verdictOf(data) : null;
      if (v && v.kind !== "allow") setPending({ proceed });
      else proceed();
    };
    if (acts.data) decide(acts.data);
    else utils.billing.acts.fetch().then(decide, () => decide(null));
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
