import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "@/i18n/navigation";
import { ANNUAL_NET_CENTS, formatWholeEuro } from "@/lib/billing/order";

/**
 * Only questions a buyer actually asked before deciding (calls and mails, 18.05 to 22.09.2026),
 * plus the second year, which the gap analysis comparison raises. Each answer is checked against
 * the AGB, the AVV, the code or the statute it names.
 */
const QUESTIONS = [
  "cost",
  "effort",
  "software",
  "data",
  "language",
  "nextYear",
  "approval",
  "money",
] as const;

const BSIG_30 = "https://www.gesetze-im-internet.de/bsig_2025/__30.html";

const link =
  "underline decoration-primary/30 underline-offset-4 hover:decoration-primary";

export function PricingFaq() {
  const t = useTranslations("pricing.faq");
  const price = formatWholeEuro(ANNUAL_NET_CENTS, useLocale());
  const tags = {
    terms: (chunks: ReactNode) => (
      <Link href="/terms" className={link}>
        {chunks}
      </Link>
    ),
    avv: (chunks: ReactNode) => (
      <Link href="/avv" className={link}>
        {chunks}
      </Link>
    ),
    approval: (chunks: ReactNode) => (
      <Link href="/pricing/approval" className={link}>
        {chunks}
      </Link>
    ),
    bsig30: (chunks: ReactNode) => (
      <a href={BSIG_30} target="_blank" rel="noopener noreferrer" className={link}>
        {chunks}
      </a>
    ),
  };
  return (
    <section aria-labelledby="pricing-faq" className="mx-auto max-w-3xl space-y-4">
      <h2 id="pricing-faq" className="font-bold text-2xl tracking-tight">
        {t("heading")}
      </h2>
      <Accordion type="multiple" className="rounded-xl border bg-card px-6">
        {QUESTIONS.map((key) => (
          <AccordionItem key={key} value={key}>
            <AccordionTrigger className="text-base">
              {t(`items.${key}.q`)}
            </AccordionTrigger>
            <AccordionContent className="max-w-prose text-base leading-relaxed text-muted-foreground">
              {t.rich(`items.${key}.a`, { ...tags, price })}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
