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
  className = "",
}: {
  readonly title: string;
  readonly marker: ReactNode;
  readonly items: readonly string[];
  readonly className?: string;
}) {
  return (
    <div className={className}>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-[15px] leading-6">
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

export function ProductBrief({
  locale,
  access,
}: {
  readonly locale: PartnerContractLocale;
  /** The partner's own way in, shown first when the offer came with access. */
  readonly access?: ReactNode;
}) {
  const t = partnerContractTranslator(locale);
  return (
    <section
      lang={locale}
      aria-labelledby="product-brief"
      className="overflow-hidden rounded-xl border bg-background shadow-sm"
    >
      <div className="bg-primary px-5 py-8 text-primary-foreground sm:px-10 sm:py-10">
        <p className="text-sm font-medium opacity-80">{t(`${A}.eyebrow`)}</p>
        <h2
          id="product-brief"
          className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          {t(`${A}.title`)}
        </h2>
        <p className="mt-3 max-w-[62ch] text-base leading-7 opacity-90">
          {t(`${A}.lead`)}
        </p>
      </div>
      <div className="space-y-8 px-5 py-7 sm:px-10 sm:py-9">
        {access}
        <Column
          title={t(`${A}.deliverTitle`)}
          marker={
            <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10">
              <Check className="h-3.5 w-3.5 text-primary" />
            </span>
          }
          items={DELIVER.map((key) => t(key))}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Column
            className="rounded-lg border bg-muted/30 p-5"
            title={t(`${A}.forTitle`)}
            marker={<span className="mt-2 block h-1.5 w-1.5 rounded-full bg-primary" />}
            items={FOR.map((key) => t(key))}
          />
          <Column
            className="rounded-lg border border-dashed p-5"
            title={t(`${A}.notTitle`)}
            marker={<Minus className="h-4 w-4 text-muted-foreground" />}
            items={NOT.map((key) => t(key))}
          />
        </div>
        <p className="border-l-4 border-primary bg-primary/5 px-5 py-4 text-[15px] font-medium leading-6">
          {t(`${A}.split`)}
        </p>
      </div>
    </section>
  );
}
