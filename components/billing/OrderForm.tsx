"use client";

/**
 * The billing step: what an order actually collects, and what it costs.
 *
 * Three things here are deliberate rather than incidental.
 *
 *   - The VAT number is checked offline as they type, and against the EU register when they leave
 *     the field. Only the offline check can stop them. A register outage is silent.
 *   - The price is not a constant on the page: it is computed from the country and the register's
 *     answer, so a reverse-charged customer sees the zero rate and the reason before they commit.
 *   - The invoice email is its own field, defaulted to nothing rather than to the person ordering,
 *     because in a German company of this size it goes to Buchhaltung and quietly assuming
 *     otherwise is the most common way an invoice sits unpaid for six weeks.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
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
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { orderSchemaWithVatCheck } from "@/lib/billing/order";

type OrderValues = z.infer<typeof orderSchemaWithVatCheck>;

interface PriceView {
  readonly net: string;
  readonly vat: string;
  readonly gross: string;
  readonly vatRatePercent: number;
  readonly treatment: string;
  readonly treatmentNote: string | null;
}

interface ValidateResponse {
  readonly gate?: { readonly proceed: boolean; readonly warning: string | null };
  readonly attempt?: {
    readonly outcome: string;
    readonly detail: string | null;
    readonly consultationNumber: string | null;
  };
  readonly price?: PriceView;
}

interface InvoiceResult {
  readonly ok?: boolean;
  readonly sandbox?: boolean;
  readonly error?: string;
  readonly detail?: string;
  readonly invoice?: {
    readonly id: string | null;
    readonly number: string | null;
    readonly status: string | null;
  };
  readonly money?: {
    readonly net: string;
    readonly vat: string;
    readonly gross: string;
    readonly treatment: string;
  };
  readonly dates?: {
    readonly issueDate: string;
    readonly dueDate: string;
    readonly performanceEndDate: string;
  };
  readonly vatCheck?: {
    readonly outcome: string;
    readonly consultationNumber: string | null;
    readonly detail: string | null;
  };
}

const registryLabel: Record<string, string> = {
  valid: "Confirmed by the EU register",
  invalid: "Not known to the register yet",
  unavailable: "Register unreachable, which does not hold anything up",
  malformed: "Not checked",
};

export function OrderForm() {
  const [price, setPrice] = useState<PriceView | null>(null);
  const [registry, setRegistry] = useState<ValidateResponse["attempt"] | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<InvoiceResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<OrderValues>({
    resolver: zodResolver(orderSchemaWithVatCheck),
    defaultValues: {
      companyName: "",
      street: "",
      zip: "",
      city: "",
      countryCode: "DE",
      vatNumber: "",
      invoiceEmail: "",
      copyToEmail: "",
      purchaseOrder: "",
    },
  });

  const validateVat = async (vatNumber: string) => {
    if (vatNumber.trim().length < 4) return;
    setChecking(true);
    try {
      const res = await fetch("/api/billing/validate-vat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ vatNumber, countryCode: form.getValues("countryCode") }),
      });
      const data = (await res.json()) as ValidateResponse;
      setPrice(data.price ?? null);
      setRegistry(data.attempt ?? null);
      setWarning(data.gate?.warning ?? null);
    } catch {
      // A failed check is not the customer's problem and must not surface as an error.
      setRegistry(null);
    } finally {
      setChecking(false);
    }
  };

  const onSubmit = async (values: OrderValues) => {
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/billing/create-invoice", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      setResult((await res.json()) as InvoiceResult);
    } catch (e) {
      setResult({ error: e instanceof Error ? e.message : "request failed" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Sandbox only</AlertTitle>
        <AlertDescription>
          This page creates a real invoice in the Qonto <strong>sandbox</strong>. The
          route refuses to run against production, so nobody can be billed from here. Use
          an obviously fake company: the sandbox is a shared test environment.
        </AlertDescription>
      </Alert>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rechnungsempfänger</CardTitle>
              <CardDescription>
                The invoice is made out to the company. Where it is sent is the field
                below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Firmenname</FormLabel>
                    <FormControl>
                      <Input placeholder="Muster Verwaltungs GmbH" {...field} />
                    </FormControl>
                    <FormDescription>
                      Exactly as the register has it. We cannot verify this for you: the
                      EU register does not disclose German company names.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Straße und Hausnummer</FormLabel>
                    <FormControl>
                      <Input placeholder="Musterweg 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="zip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PLZ</FormLabel>
                      <FormControl>
                        <Input placeholder="50676" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Ort</FormLabel>
                      <FormControl>
                        <Input placeholder="Köln" {...field} />
                      </FormControl>
                      <FormMessage />
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
                      <FormLabel>Land</FormLabel>
                      <FormControl>
                        <Input placeholder="DE" maxLength={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vatNumber"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>USt-IdNr.</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="DE123456789"
                          {...field}
                          onBlur={(e) => {
                            field.onBlur();
                            void validateVat(e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormDescription className="flex items-center gap-2">
                        {checking ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                            Checking the EU register
                          </>
                        ) : registry ? (
                          <Badge
                            variant={
                              registry.outcome === "valid" ? "default" : "secondary"
                            }
                          >
                            {registryLabel[registry.outcome] ?? registry.outcome}
                          </Badge>
                        ) : (
                          "Decides the tax on the invoice."
                        )}
                      </FormDescription>
                      <FormMessage />
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
              <CardTitle>Rechnungsversand</CardTitle>
              <CardDescription>
                Usually not the person ordering. In most companies this is Buchhaltung.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="invoiceEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-Mail für die Rechnung</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="rechnung@example.invalid"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="copyToEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kopie an (optional)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="sie@example.invalid" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="purchaseOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bestellnummer / Kostenstelle (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="PO-2026-0042" {...field} />
                    </FormControl>
                    <FormDescription>
                      Many companies will not pay an invoice that does not carry their own
                      reference.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {price ? (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Was berechnet wird</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Netto</span>
                  <span className="tabular-nums">{price.net}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    USt. {price.vatRatePercent}%
                  </span>
                  <span className="tabular-nums">{price.vat}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold">
                  <span>Gesamt</span>
                  <span className="tabular-nums">{price.gross}</span>
                </div>
                {price.treatmentNote ? (
                  <p className="pt-2 text-muted-foreground text-xs">
                    {price.treatmentNote}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Rechnung wird erstellt
              </>
            ) : (
              "Rechnung im Sandbox erstellen"
            )}
          </Button>
        </form>
      </Form>

      {result ? (
        <Alert variant={result.ok ? "default" : "destructive"}>
          {result.ok ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle>
            {result.ok ? "Invoice created in the sandbox" : "Not created"}
          </AlertTitle>
          <AlertDescription>
            <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-all text-xs">
              {JSON.stringify(result, null, 2)}
            </pre>
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
