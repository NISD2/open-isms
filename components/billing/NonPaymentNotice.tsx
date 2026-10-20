import { CalendarClock } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/trpc/server";
import { cn } from "@/lib/utils";

/**
 * The open invoice B9 acts on, said where an account looks for it: the billing page, and the offer
 * page every portal page sends a suspended account to. Amber, because it asks the reader to look,
 * not because they did something wrong. Nothing when there is nothing to say.
 */
export async function NonPaymentNotice({ className }: { className?: string }) {
  const notice = await api.billing.nonPayment();
  if (!notice) return null;
  const t = await getTranslations("billing.nonPayment");
  const locale = await getLocale();
  const date = new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${notice.dueDate}T12:00:00Z`));
  return (
    <div
      role="status"
      className={cn(
        "flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-700 dark:bg-amber-950/40",
        className,
      )}
    >
      <CalendarClock className="mt-0.5 size-5 shrink-0 text-amber-700 dark:text-amber-400" />
      <div className="space-y-1">
        <p className="font-medium">{t(`${notice.kind}.title`)}</p>
        <p className="text-muted-foreground">
          {t.rich(`${notice.kind}.body`, {
            number: notice.invoiceNumber,
            date,
            terms: (chunks) => (
              <Link href="/terms" className="font-medium text-foreground underline">
                {chunks}
              </Link>
            ),
          })}
        </p>
      </div>
    </div>
  );
}
