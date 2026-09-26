"use client";

/**
 * The billing step: what an order actually collects, and what it costs.
 *
 * Three things here are deliberate rather than incidental.
 *
 *   - The VAT number is checked offline as they type, and against the EU register when they leave
 *     the field. Only the offline check can stop them. A register outage is silent.
 *   - The price is not a constant on the page: the server computes it from the account's access
 *     level, the country and the register's answer, so a reverse-charged customer sees the zero
 *     rate and the reason before they commit.
 *   - The invoice email is its own field, defaulted to nothing rather than to the person ordering,
 *     because in a German company of this size it goes to Buchhaltung and quietly assuming
 *     otherwise is the most common way an invoice sits unpaid for six weeks.
 *
 * The fields themselves are ./OrderFields, shared with the platform admin demo close.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import { orderSchemaWithVatCheck } from "@/lib/billing/order";
import { TERMS_VERSION, termsVersionLabel } from "@/lib/billing/terms";
import { trpc } from "@/lib/trpc/client";
import { OrderFields, type OrderValues, orderDefaults } from "./OrderFields";

/** An ISO calendar day, shown as that same day in the reader's locale. */
const formatDay = (isoDay: string, locale: string) =>
  new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(
    new Date(`${isoDay}T12:00:00Z`),
  );

/** A legal page, opened in a new tab so the filled form is not lost. */
const legalLink = (href: "/terms" | "/avv", chunks: ReactNode) => (
  <Link
    href={href}
    target="_blank"
    rel="noopener"
    className="font-medium underline underline-offset-4"
  >
    {chunks}
  </Link>
);

const LEGAL_NOTES = ["b2b", "term", "moneyBack", "payment", "contract"] as const;

/**
 * What the customer should know before the button: who sells, for how long, the money back, when
 * to pay, and how the contract is made (§ 312i Abs. 1 Nr. 2 BGB). The full text is in /terms.
 */
function OrderLegalNotes() {
  const t = useTranslations("billing.legal");
  return (
    <div className="space-y-2 rounded-md border bg-muted/30 p-4 text-muted-foreground text-sm">
      <p className="font-medium text-foreground">{t("title")}</p>
      <ul className="list-disc space-y-1 pl-5">
        {LEGAL_NOTES.map((key) => (
          <li key={key}>{t(key)}</li>
        ))}
      </ul>
    </div>
  );
}

export function OrderForm() {
  const t = useTranslations("billing");
  const locale = useLocale();
  const quote = trpc.billing.quote.useMutation();
  const place = trpc.billing.place.useMutation({
    // The register answered differently at order time: show the new price before they try again.
    onError: (err, vars) => {
      if (err.data?.code === "PRECONDITION_FAILED") {
        quote.mutate({
          vatNumber: vars.order.vatNumber,
          countryCode: vars.order.countryCode,
        });
      }
    },
  });

  const form = useForm<OrderValues>({
    resolver: zodResolver(orderSchemaWithVatCheck),
    defaultValues: orderDefaults(locale),
  });
  // Outside the order schema, which the platform admin close shares: only a customer ticks it.
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsMissing, setTermsMissing] = useState(false);

  const checkVat = (vatNumber: string) => {
    if (vatNumber.trim().length < 4) return;
    // A register outage never surfaces: the quote still answers, only without a confirmation.
    // Only the quote call itself failing is shown (below), because ordering waits on it.
    quote.mutate({ vatNumber, countryCode: form.getValues("countryCode") });
  };

  const onSubmit = (values: OrderValues) => {
    if (!termsAccepted) {
      setTermsMissing(true);
      return;
    }
    const order = orderSchemaWithVatCheck.parse(values);
    // Only a price quoted for this very number counts as the one they saw.
    const quoted =
      quote.variables?.vatNumber === values.vatNumber
        ? quote.data?.price.grossCents
        : undefined;
    // No price shown yet (Enter pressed inside the VAT field): show it first, order on the next click.
    if (quoted === undefined) {
      quote.mutate({ vatNumber: values.vatNumber, countryCode: values.countryCode });
      return;
    }
    place.mutate({
      order,
      quotedGrossCents: quoted,
      terms: { accepted: true, version: TERMS_VERSION },
    });
  };

  if (place.data) {
    return (
      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertTitle>{t("result.title")}</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>
            {t("result.body", {
              number: place.data.number,
              gross: place.data.gross,
              email: form.getValues("invoiceEmail"),
              dueDate: formatDay(place.data.dueDate, locale),
            })}
          </p>
          <Link href="/billing" className="font-medium underline underline-offset-4">
            {t("order.toInvoices")}
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  const placeError = place.error?.data?.code;
  // After an unclear answer from Qonto an invoice may exist, so the button stays off.
  const outcomeUnknown = placeError === "TIMEOUT";
  const failure =
    placeError === "CONFLICT"
      ? t("result.alreadyOrdered")
      : placeError === "TOO_MANY_REQUESTS"
        ? t("result.tooManyRequests")
        : placeError === "PRECONDITION_FAILED"
          ? t("result.priceChanged")
          : outcomeUnknown
            ? t("result.unknown")
            : place.error || quote.error
              ? quote.error?.data?.code === "TOO_MANY_REQUESTS"
                ? t("result.tooManyRequests")
                : t("result.failed")
              : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <OrderFields
            form={form}
            quote={quote.data}
            quoting={quote.isPending}
            onVatBlur={checkVat}
          />

          <OrderLegalNotes />

          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <Checkbox
                id="order-terms"
                checked={termsAccepted}
                aria-invalid={termsMissing && !termsAccepted}
                aria-describedby={
                  termsMissing && !termsAccepted ? "order-terms-missing" : undefined
                }
                onCheckedChange={(v) => {
                  setTermsAccepted(v === true);
                  setTermsMissing(false);
                }}
              />
              <Label htmlFor="order-terms" className="font-normal text-sm leading-snug">
                {t.rich("accept.label", {
                  date: termsVersionLabel(locale),
                  terms: (chunks) => legalLink("/terms", chunks),
                  avv: (chunks) => legalLink("/avv", chunks),
                })}
              </Label>
            </div>
            {termsMissing && !termsAccepted ? (
              <p id="order-terms-missing" className="text-destructive text-sm">
                {t("accept.required")}
              </p>
            ) : null}
          </div>

          {failure ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{failure}</AlertDescription>
            </Alert>
          ) : null}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={place.isPending || quote.isPending || outcomeUnknown}
          >
            {place.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                {t("form.submitting")}
              </>
            ) : (
              t("form.submit")
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
