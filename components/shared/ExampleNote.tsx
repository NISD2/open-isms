import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { OFFER_PATH } from "@/lib/billing/access";

/**
 * Above rows that are examples, not the company's own: says so, what the page will hold, and, for
 * an account that has not ordered, the way to order.
 */
export function ExampleNote({ text, order }: { text: string; order: boolean }) {
  const t = useTranslations("portal.examples");
  return (
    <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-primary/20 bg-primary/[0.04] p-4 sm:p-5">
      <p className="min-w-0 flex-1 text-sm leading-6">
        <span className="mr-2 inline-flex rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
          {t("badge")}
        </span>
        {text}
      </p>
      {order && (
        <Button asChild className="rounded-xl">
          <Link href={OFFER_PATH}>
            {t("order")}
            <ArrowRight />
          </Link>
        </Button>
      )}
    </div>
  );
}
