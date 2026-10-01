"use client";

/**
 * The invoice the order will produce, drawn beside the form and filled in as they type.
 *
 * It mirrors the real document rather than summarising it: the sender line above the address, the
 * line item and service period from the same functions that write the Qonto invoice
 * (lib/billing/order.ts), the seller's register entry at the foot. A buyer checks the screen the way
 * they will later check the PDF. Until the VAT number has been quoted, only the net price is
 * certain, so the total says so instead of guessing a rate.
 */
import { CircleCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatInvoiceDay, invoiceDates, licenceTitle } from "@/lib/billing/order";
import { SELLER } from "@/lib/billing/seller";
import type { OrderValues, Quote } from "./OrderFields";

const TRUST_POINTS = ["invoice", "moneyBack", "access"] as const;

const filled = (value: string | undefined) => (value ?? "").trim();

export function InvoicePreview({
  values,
  price,
  netPrice,
}: {
  readonly values: Partial<OrderValues>;
  readonly price: Quote["price"] | undefined;
  /** The holder's yearly net price, formatted, for before the VAT number is quoted. */
  readonly netPrice: string;
}) {
  const t = useTranslations("billing");
  const locale = useLocale();
  const dates = invoiceDates(new Date());
  const company = filled(values.companyName);
  const cityLine = [filled(values.zip), filled(values.city)].filter(Boolean).join(" ");
  const street = filled(values.street);
  // The country is prefilled, so on its own it is not yet an address.
  const addressLines =
    street || cityLine
      ? [street, cityLine, filled(values.countryCode)].filter(Boolean)
      : [];
  const vatNumber = filled(values.vatNumber);
  const reference = filled(values.purchaseOrder);
  const invoiceEmail = filled(values.invoiceEmail);

  return (
    <div className="space-y-5">
      <p className="text-muted-foreground text-sm">{t("preview.caption")}</p>

      <article
        aria-label={t("preview.title")}
        className="overflow-hidden rounded-lg border bg-card shadow-sm"
      >
        <div className="h-1.5 bg-primary" aria-hidden />
        <div className="space-y-6 p-6 text-sm">
          <header className="flex items-baseline justify-between gap-4">
            <h2 className="font-semibold text-lg tracking-tight">{t("preview.title")}</h2>
            <span className="rounded-full border px-2 py-0.5 text-muted-foreground text-xs">
              {t("preview.draft")}
            </span>
          </header>

          <div className="space-y-2">
            <p className="border-b pb-1 text-[11px] text-muted-foreground">
              {SELLER.name} · {SELLER.street} · {SELLER.city}
            </p>
            <div className="min-h-[5.5rem] leading-relaxed">
              {company ? (
                <p className="font-medium">{company}</p>
              ) : (
                <p className="text-muted-foreground italic">
                  {t("preview.companyPlaceholder")}
                </p>
              )}
              {addressLines.length > 0 ? (
                addressLines.map((line) => <p key={line}>{line}</p>)
              ) : (
                <p className="text-muted-foreground italic">
                  {t("preview.addressPlaceholder")}
                </p>
              )}
              {vatNumber ? (
                <p className="text-muted-foreground">
                  {t("preview.vatId", { id: vatNumber })}
                </p>
              ) : null}
            </div>
          </div>

          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-muted-foreground text-xs">
            <dt>{t("preview.date")}</dt>
            <dd className="text-right tabular-nums">
              {formatInvoiceDay(dates.issueDate, locale)}
            </dd>
            {reference ? (
              <>
                <dt>{t("preview.reference")}</dt>
                <dd className="truncate text-right">{reference}</dd>
              </>
            ) : null}
          </dl>

          <div className="space-y-3 border-y py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">
                  {licenceTitle(locale === "de" ? "de" : "en")}
                </p>
                <p className="text-muted-foreground text-xs">
                  {t("preview.period", {
                    start: formatInvoiceDay(dates.performanceStartDate, locale),
                    end: formatInvoiceDay(dates.performanceEndDate, locale),
                  })}
                </p>
              </div>
              <span className="shrink-0 tabular-nums">{price?.net ?? netPrice}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t("price.net")}</span>
              <span className="tabular-nums">{price?.net ?? netPrice}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">
                {price
                  ? t("price.vat", { rate: price.vatRatePercent })
                  : t("preview.vatLabel")}
              </span>
              <span className="text-right tabular-nums">
                {price ? (
                  price.vat
                ) : (
                  <span className="text-muted-foreground text-xs">
                    {t("preview.vatPending")}
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-4 pt-2">
              <span className="font-semibold">{t("price.gross")}</span>
              <span className="font-semibold text-xl tabular-nums tracking-tight">
                {price ? price.gross : t("preview.totalPending", { net: netPrice })}
              </span>
            </div>
            {price && price.treatment !== "domestic" ? (
              <p className="pt-1 text-muted-foreground text-xs">
                {t(`treatment.${price.treatment}`)}
              </p>
            ) : null}
          </div>

          <div className="space-y-1 text-muted-foreground text-xs">
            <p>{t("preview.due", { date: formatInvoiceDay(dates.dueDate, locale) })}</p>
            {invoiceEmail ? <p>{t("preview.sentTo", { email: invoiceEmail })}</p> : null}
          </div>
        </div>
        <footer className="border-t bg-muted/40 px-6 py-3 text-[11px] text-muted-foreground leading-relaxed">
          {SELLER.name}, {SELLER.street}, {SELLER.city} · {SELLER.register} ·{" "}
          {t("preview.vatId", { id: SELLER.vatId })}
        </footer>
      </article>

      <ul className="space-y-2.5 text-sm">
        {TRUST_POINTS.map((key) => (
          <li key={key} className="flex items-start gap-2.5">
            <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span>{t(`trust.${key}`)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
