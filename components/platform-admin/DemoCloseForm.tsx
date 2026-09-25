"use client";

/**
 * Door two, the demo close: order for a customer while still on the call. The billing fields are
 * the customer's own order form (../billing/OrderFields), typed from their Impressum; above them
 * sit the three things only a platform admin enters: who the customer is, and the amount if it was
 * agreed differently. The server creates the customer if new and mails them a setup link
 * (lib/billing/close-deal.ts).
 */
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Handshake } from "lucide-react";
import { useLocale } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  OrderFields,
  type OrderValues,
  orderDefaults,
} from "@/components/billing/OrderFields";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { orderSchemaWithVatCheck } from "@/lib/billing/order";
import { trpc } from "@/lib/trpc/client";

/** "4800", "4.800" or "4.800,50" euros as cents; null when blank, NaN when not a positive amount. */
export const centsFrom = (euros: string): number | null => {
  const t = euros.trim();
  if (!t) return null;
  // A comma is the decimal mark ("4.800,50"). Without one, dots in groups of three are thousands
  // ("4.800"), and any other dot is a decimal point ("99.50"). This is typed text, not code.
  const normalised = t.includes(",")
    ? t.replace(/\./g, "").replace(",", ".")
    : /^\d{1,3}(\.\d{3})+$/.test(t)
      ? t.replace(/\./g, "")
      : t;
  const n = Number(normalised);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : Number.NaN;
};

export function DemoCloseForm() {
  const locale = useLocale();
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [amount, setAmount] = useState("");
  const netCents = centsFrom(amount);
  const amountInvalid = Number.isNaN(netCents);

  const quote = trpc.platformAdmin.closeQuote.useMutation();
  const close = trpc.platformAdmin.closeDeal.useMutation({
    // The price moved between the quote and the order: show the new one before trying again.
    onError: (err, vars) => {
      if (err.data?.code === "PRECONDITION_FAILED") {
        quote.mutate({
          customerEmail: vars.customerEmail,
          vatNumber: vars.order.vatNumber,
          countryCode: vars.order.countryCode,
          netCents: vars.netCents,
        });
      }
    },
  });
  const form = useForm<OrderValues>({
    resolver: zodResolver(orderSchemaWithVatCheck),
    defaultValues: orderDefaults(locale),
  });

  const quoteInput = (vatNumber: string) => ({
    customerEmail: customerEmail.trim(),
    vatNumber,
    countryCode: form.getValues("countryCode"),
    netCents,
  });

  const requote = (vatNumber: string) => {
    if (vatNumber.trim().length < 4 || amountInvalid) return;
    quote.mutate(quoteInput(vatNumber));
  };

  const onSubmit = (values: OrderValues) => {
    if (!customerEmail.trim() || !customerName.trim() || amountInvalid) return;
    // Only a price quoted for exactly what is on screen counts. Otherwise quote first: the admin
    // sees the new price and confirms it on the next click.
    const current = quoteInput(values.vatNumber);
    const v = quote.variables;
    const fresh =
      v &&
      v.customerEmail === current.customerEmail &&
      v.vatNumber === current.vatNumber &&
      v.netCents === current.netCents;
    const price = fresh ? quote.data?.price : undefined;
    if (!price) {
      quote.mutate(current);
      return;
    }
    if (
      !window.confirm(
        `Issue a real invoice for ${price.gross} to ${values.companyName} now?`,
      )
    )
      return;
    close.mutate({
      customerEmail: current.customerEmail,
      customerName: customerName.trim(),
      order: orderSchemaWithVatCheck.parse(values),
      netCents,
      quotedGrossCents: price.grossCents,
    });
  };

  if (close.data) {
    return (
      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertTitle>Closed: invoice {close.data.number}</AlertTitle>
        <AlertDescription>
          {close.data.gross}, due {close.data.dueDate}.{" "}
          {close.data.createdUser
            ? "New customer account created. "
            : "Existing account. "}
          {close.data.setupSent
            ? "Setup link sent."
            : "No setup link: they have signed in before, or it could not be sent (see alerts)."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Handshake className="h-4 w-4" /> New customer (close on the call)
        </CardTitle>
        <CardDescription>
          Creates the customer if the email is new, issues the invoice on their account,
          and mails them a link to set up access. Type the billing details from their
          Impressum.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="close-email">Customer email (their login)</Label>
                <Input
                  id="close-email"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  // An existing customer's price depends on their account.
                  onBlur={() => requote(form.getValues("vatNumber"))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="close-name">Customer name</Label>
                <Input
                  id="close-name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="close-amount">
                  Net amount in EUR (blank: the listed price)
                </Label>
                <Input
                  id="close-amount"
                  inputMode="decimal"
                  placeholder="4.800"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onBlur={() => requote(form.getValues("vatNumber"))}
                />
                {amountInvalid ? (
                  <p className="text-destructive text-sm">
                    A positive amount, such as 4.800.
                  </p>
                ) : null}
              </div>
            </div>

            <OrderFields
              form={form}
              quote={quote.data}
              quoting={quote.isPending}
              onVatBlur={requote}
            />

            {close.error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {close.error.data?.code === "TIMEOUT"
                    ? "Qonto did not answer clearly; an invoice may exist. Check Qonto before trying again."
                    : close.error.message}
                </AlertDescription>
              </Alert>
            ) : null}

            <Button
              type="submit"
              disabled={
                close.isPending ||
                !customerEmail.trim() ||
                !customerName.trim() ||
                amountInvalid ||
                close.error?.data?.code === "TIMEOUT"
              }
            >
              Issue invoice and send access
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
