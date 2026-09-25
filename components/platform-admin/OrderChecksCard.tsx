"use client";

/**
 * Accounts blocked after an unclear order (lib/billing/order-check.ts). Each one may have an
 * invoice in Qonto that we did not record. Check Qonto first; record or credit the invoice by hand
 * if it exists; then clear the block here so the customer can order again.
 */
import { ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";

export function OrderChecksCard() {
  const checks = trpc.platformAdmin.orderChecks.useQuery();
  const clear = trpc.platformAdmin.clearOrderCheck.useMutation({
    onSuccess: async () => {
      await checks.refetch();
      toast.success("Order check cleared. The customer can order again.");
    },
    onError: (e) => toast.error(e.message),
  });
  const rows = checks.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldAlert className="h-4 w-4" /> Orders to check in Qonto ({rows.length})
        </CardTitle>
        <CardDescription>
          Qonto did not answer these orders clearly, so an invoice may exist that we did
          not record. Ordering is blocked for each account until you check Qonto and clear
          it here.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {rows.length === 0 ? (
          <p className="text-muted-foreground">Nothing to check.</p>
        ) : (
          rows.map((r) => (
            <div
              key={r.billingAccountId}
              className="flex items-center justify-between gap-4"
            >
              <div>
                <p className="font-medium">
                  {r.ownerEmail ?? "no account holder"}: look up {r.invoiceNumber} in
                  Qonto
                </p>
                <p className="text-muted-foreground text-xs">
                  since {new Date(r.since).toLocaleString("de-DE")} · account{" "}
                  {r.billingAccountId}
                  {r.qontoClientId ? ` · Qonto client ${r.qontoClientId}` : ""}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={clear.isPending}
                onClick={() => {
                  if (
                    window.confirm(
                      "Checked Qonto, and any invoice there is recorded or credited? Clearing lets this customer order again.",
                    )
                  ) {
                    clear.mutate({
                      billingAccountId: r.billingAccountId,
                      since: r.since,
                    });
                  }
                }}
              >
                Checked, clear
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
