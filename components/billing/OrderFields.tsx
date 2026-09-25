"use client";

/**
 * The billing fields of an order and the price they lead to, shared by both doors: the customer's
 * order page (./OrderForm) and the platform admin demo close (../platform-admin/DemoCloseForm).
 * One set of fields, so the invoice a customer orders and the one closed on a call ask for the
 * same things in the same words.
 */
import { AlertCircle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import type { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  useFormField,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { orderSchemaWithVatCheck } from "@/lib/billing/order";
import type { quoteFor } from "@/lib/billing/quote";

export type OrderValues = z.input<typeof orderSchemaWithVatCheck>;
export type Quote = Awaited<ReturnType<typeof quoteFor>>;

export const orderDefaults = (locale: string): OrderValues => ({
  companyName: "",
  street: "",
  zip: "",
  city: "",
  countryCode: locale === "nl" ? "NL" : "DE",
  vatNumber: "",
  invoiceEmail: "",
  copyToEmail: "",
  purchaseOrder: "",
});

/** The schema's messages are codes (lib/billing/order.ts); this says them in the page's language. */
export function FieldMessage() {
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

/** The recipient and delivery cards, with the register's answer under the VAT number. */
export function OrderFields({
  form,
  quote,
  quoting,
  onVatBlur,
}: {
  readonly form: UseFormReturn<OrderValues>;
  readonly quote: Quote | undefined;
  readonly quoting: boolean;
  readonly onVatBlur: (vatNumber: string) => void;
}) {
  const t = useTranslations("billing");
  const registry = quote?.attempt?.outcome ?? null;
  const gate = quote?.gate ?? null;
  const warning =
    gate && !gate.proceed
      ? t("warnings.checkNumber")
      : gate?.warning && registry === "invalid"
        ? t("warnings.notInRegister")
        : null;

  const text = (
    name: keyof OrderValues,
    label: string,
    opts: { placeholder?: string; hint?: string; type?: string; className?: string } = {},
  ) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={opts.className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input type={opts.type} placeholder={opts.placeholder} {...field} />
          </FormControl>
          {opts.hint ? <FormDescription>{opts.hint}</FormDescription> : null}
          <FieldMessage />
        </FormItem>
      )}
    />
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("form.recipientTitle")}</CardTitle>
          <CardDescription>{t("form.recipientDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {text("companyName", t("form.companyName"), {
            placeholder: t("form.companyNamePlaceholder"),
            hint: t("form.companyNameHint"),
          })}
          {text("street", t("form.street"), { placeholder: t("form.streetPlaceholder") })}
          <div className="grid gap-4 sm:grid-cols-3">
            {text("zip", t("form.zip"), { placeholder: t("form.zipPlaceholder") })}
            {text("city", t("form.city"), {
              placeholder: t("form.cityPlaceholder"),
              className: "sm:col-span-2",
            })}
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
                        onVatBlur(e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormDescription className="flex items-center gap-2">
                    {quoting ? (
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
          {text("invoiceEmail", t("form.invoiceEmail"), {
            type: "email",
            placeholder: t("form.invoiceEmailPlaceholder"),
          })}
          {text("copyToEmail", t("form.copyToEmail"), {
            type: "email",
            placeholder: t("form.copyToEmailPlaceholder"),
          })}
          {text("purchaseOrder", t("form.purchaseOrder"), {
            placeholder: t("form.purchaseOrderPlaceholder"),
            hint: t("form.purchaseOrderHint"),
          })}
        </CardContent>
      </Card>

      {quote ? <PriceCard price={quote.price} /> : null}
    </>
  );
}

function PriceCard({ price }: { readonly price: Quote["price"] }) {
  const t = useTranslations("billing");
  return (
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
  );
}
