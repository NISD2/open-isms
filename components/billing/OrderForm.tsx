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
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  useFormField,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation";
import { orderSchemaWithVatCheck } from "@/lib/billing/order";
import { trpc } from "@/lib/trpc/client";

type OrderValues = z.input<typeof orderSchemaWithVatCheck>;

/** The schema's messages are codes (lib/billing/order.ts); this says them in the page's language. */
function FieldMessage() {
  const t = useTranslations("billing.errors");
  const { error, formMessageId } = useFormField();
  if (!error) return null;
  const code = String(error.message ?? "");
  return (
    <p id={formMessageId} className="text-destructive text-sm">
      {t.has(code) ? t(code) : t("generic")}
    </p>
  );
}

/** An ISO calendar day, shown as that same day in the reader's locale. */
const formatDay = (isoDay: string, locale: string) =>
  new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(
    new Date(`${isoDay}T12:00:00Z`),
  );

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
    defaultValues: {
      companyName: "",
      street: "",
      zip: "",
      city: "",
      countryCode: locale === "nl" ? "NL" : "DE",
      vatNumber: "",
      invoiceEmail: "",
      copyToEmail: "",
      purchaseOrder: "",
    },
  });

  const checkVat = (vatNumber: string) => {
    if (vatNumber.trim().length < 4) return;
    // A register outage never surfaces: the quote still answers, only without a confirmation.
    // Only the quote call itself failing is shown (below), because ordering waits on it.
    quote.mutate({ vatNumber, countryCode: form.getValues("countryCode") });
  };

  const onSubmit = (values: OrderValues) => {
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
    place.mutate({ order, quotedGrossCents: quoted });
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

  const registry = quote.data?.attempt?.outcome ?? null;
  const price = quote.data?.price ?? null;
  const gate = quote.data?.gate ?? null;
  const warning =
    gate && !gate.proceed
      ? t("warnings.checkNumber")
      : gate?.warning && registry === "invalid"
        ? t("warnings.notInRegister")
        : null;
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
          <Card>
            <CardHeader>
              <CardTitle>{t("form.recipientTitle")}</CardTitle>
              <CardDescription>{t("form.recipientDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.companyName")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("form.companyNamePlaceholder")} {...field} />
                    </FormControl>
                    <FormDescription>{t("form.companyNameHint")}</FormDescription>
                    <FieldMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.street")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("form.streetPlaceholder")} {...field} />
                    </FormControl>
                    <FieldMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="zip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.zip")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("form.zipPlaceholder")} {...field} />
                      </FormControl>
                      <FieldMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>{t("form.city")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("form.cityPlaceholder")} {...field} />
                      </FormControl>
                      <FieldMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="countryCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.countryCode")}</FormLabel>
                      <FormControl>
                        <Input placeholder="DE" maxLength={2} {...field} />
                      </FormControl>
                      <FieldMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vatNumber"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>{t("form.vatNumber")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("form.vatNumberPlaceholder")}
                          {...field}
                          onBlur={(e) => {
                            field.onBlur();
                            checkVat(e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormDescription className="flex items-center gap-2">
                        {quote.isPending ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                            {t("form.vatChecking")}
                          </>
                        ) : registry ? (
                          <Badge variant={registry === "valid" ? "default" : "secondary"}>
                            {t(`registry.${registry}`)}
                          </Badge>
                        ) : (
                          t("form.vatHint")
                        )}
                      </FormDescription>
                      <FieldMessage />
                    </FormItem>
                  )}
                />
              </div>

              {warning ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{warning}</AlertDescription>
                </Alert>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("form.deliveryTitle")}</CardTitle>
              <CardDescription>{t("form.deliveryDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="invoiceEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.invoiceEmail")}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t("form.invoiceEmailPlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FieldMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="copyToEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.copyToEmail")}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t("form.copyToEmailPlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FieldMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="purchaseOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.purchaseOrder")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("form.purchaseOrderPlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>{t("form.purchaseOrderHint")}</FormDescription>
                    <FieldMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {price ? (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t("price.title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("price.net")}</span>
                  <span className="tabular-nums">{price.net}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("price.vat", { rate: price.vatRatePercent })}
                  </span>
                  <span className="tabular-nums">{price.vat}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold">
                  <span>{t("price.gross")}</span>
                  <span className="tabular-nums">{price.gross}</span>
                </div>
                {price.treatment !== "domestic" ? (
                  <p className="pt-2 text-muted-foreground text-xs">
                    {t(`treatment.${price.treatment}`)}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

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
