import { Check, Minus } from "lucide-react";
import type { ReactNode } from "react";
import type { PartnerContractLocale } from "@/lib/partner-contract/date";
import { partnerContractTranslator } from "@/lib/partner-contract/document";

/**
 * What the product is, above the agreement: what a referred customer gets, who it is for, and what
 * it leaves to the partner. Information, not terms: the agreement's own scope is its section 2,
 * stored with the offer; this block follows the current wording.
 */
const A = "partnerContract.page.about";

const DELIVER = [
  `${A}.deliver1`,
  `${A}.deliver2`,
  `${A}.deliver3`,
  `${A}.deliver4`,
  `${A}.deliver5`,
] as const;
const FOR = [`${A}.for1`, `${A}.for2`, `${A}.for3`] as const;
const NOT = [`${A}.not1`, `${A}.not2`, `${A}.not3`, `${A}.not4`, `${A}.not5`] as const;

function Column({
  title,
  marker,
  items,
}: {
  readonly title: string;
  readonly marker: ReactNode;
  readonly items: readonly string[];
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-3 space-y-2.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5 text-[15px] leading-6">
            <span className="mt-0.5 shrink-0" aria-hidden>
              {marker}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProductBrief({ locale }: { readonly locale: PartnerContractLocale }) {
  const t = partnerContractTranslator(locale);
  return (
    <section
      lang={locale}
      aria-labelledby="product-brief"
      className="rounded-lg border bg-background px-5 py-7 shadow-sm sm:px-10 sm:py-9"
    >
      <h2 id="product-brief" className="text-2xl font-semibold tracking-tight">
        {t(`${A}.title`)}
      </h2>
      <p className="mt-2 max-w-[62ch] text-[15px] leading-6 text-muted-foreground">
        {t(`${A}.lead`)}
      </p>
      <div className="mt-7">
        <Column
          title={t(`${A}.deliverTitle`)}
          marker={<Check className="h-4 w-4 text-primary" />}
          items={DELIVER.map((key) => t(key))}
        />
      </div>
      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <Column
          title={t(`${A}.forTitle`)}
          marker={
            <span className="mt-2 block h-1.5 w-1.5 rounded-full bg-foreground/60" />
          }
          items={FOR.map((key) => t(key))}
        />
        <Column
          title={t(`${A}.notTitle`)}
          marker={<Minus className="h-4 w-4 text-muted-foreground" />}
          items={NOT.map((key) => t(key))}
        />
      </div>
      <p className="mt-8 border-t pt-5 text-[15px] font-medium leading-6">
        {t(`${A}.split`)}
      </p>
    </section>
  );
}
