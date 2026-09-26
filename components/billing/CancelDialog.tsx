"use client";

/**
 * The one yes or no dialog for a cancel, opened from the user menu and from /billing. It says
 * which cancel applies (money back inside the thirty days, or no renewal after them), because the
 * two do very different things; the server decides again by date (lib/billing/cancel.ts).
 */
import { useLocale, useTranslations } from "next-intl";
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
import { useRouter } from "@/i18n/navigation";
import { type RouterOutputs, trpc } from "@/lib/trpc/client";

export type CancelOption = NonNullable<RouterOutputs["billing"]["status"]["cancel"]>;

/** A calendar day `YYYY-MM-DD` in the reader's language, without any time zone shifting it. */
export const useFormatDay = () => {
  const locale = useLocale();
  const format = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" });
  return (iso: string) => format.format(new Date(`${iso}T12:00:00Z`));
};

export function CancelDialog({
  option,
  open,
  onOpenChange,
}: {
  readonly option: CancelOption;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("billing.cancel");
  const day = useFormatDay();
  const router = useRouter();
  const utils = trpc.useUtils();

  const cancel = trpc.billing.cancel.useMutation({
    onSuccess: async (r) => {
      toast.success(
        r.kind === "money_back"
          ? t(r.refundOwed ? "doneMoneyBackRefund" : "doneMoneyBack", {
              number: r.creditNoteNumber,
            })
          : t("doneRenewal", { date: day(r.periodEnd) }),
      );
      onOpenChange(false);
      await utils.billing.status.invalidate();
      router.refresh();
    },
    onError: (e) => {
      const code = e.data?.code;
      toast.error(
        code === "TIMEOUT"
          ? t("unknown")
          : code === "PRECONDITION_FAILED"
            ? t("pending")
            : code === "TOO_MANY_REQUESTS"
              ? t("tooManyRequests")
              : t("failed"),
      );
      onOpenChange(false);
    },
  });

  const moneyBack = option.kind === "money_back";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t(moneyBack ? "moneyBackTitle" : "renewalTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {option.kind === "money_back"
              ? t("moneyBackBody", { lastDay: day(option.lastDay) })
              : t("renewalBody", { periodEnd: day(option.periodEnd) })}{" "}
            {t("kept")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={cancel.isPending}>{t("keep")}</AlertDialogCancel>
          <AlertDialogAction
            data-testid="cancel-confirm"
            disabled={cancel.isPending}
            onClick={(e) => {
              // Stay open until the server has answered, so a slow Qonto call is visible.
              e.preventDefault();
              cancel.mutate();
            }}
          >
            {t("confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
