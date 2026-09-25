import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderForm } from "@/components/billing/OrderForm";
import { mayUseBillingHarness } from "@/lib/billing/harness-access";

/**
 * The order step, as a page you can open and drive by hand.
 *
 * It is the real billing step rather than a mock: the same schema, the same VAT check, the same
 * price arithmetic and the same Qonto call the product will use. What makes it safe to leave in
 * the tree is that this page and both billing routes are gated on the same rule: a platform admin,
 * against the Qonto sandbox. On nisd2.eu the page is a 404.
 *
 * Not indexed, and no locale alternates, because it is not a page anyone should arrive at from a
 * search result while it is still a harness.
 */
export const metadata: Metadata = {
  title: "Bestellung (Sandbox)",
  description: "Rechnung im Qonto-Sandbox erstellen.",
  robots: { index: false, follow: false },
};

export default async function BestellenPage() {
  if (!(await mayUseBillingHarness())) notFound();

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-bold text-3xl tracking-tight">Bestellung</h1>
        <p className="text-muted-foreground">
          NIS 2 Durchgang für ein Jahr. 4.800 € netto im Jahr, 30 Tage Geld zurück,
          Rechnung mit 30 Tagen Zahlungsziel.
        </p>
      </header>
      <OrderForm />
    </div>
  );
}
