"use client";

/**
 * The Subscriptions tab: every paying customer, the invoice paying for them now with its status read
 * live from Qonto, and every refund still owed (lib/billing/subscriptions.ts). Refunds are never
 * automatic, so this is where one is seen, made in Qonto, and marked done. Below the list, door two
 * for a new customer (./DemoCloseForm).
 */
import { CreditCard } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type RouterOutputs, trpc } from "@/lib/trpc/client";
import { DemoCloseForm } from "./DemoCloseForm";

type Row = RouterOutputs["platformAdmin"]["subscriptions"][number];

const STATUS_VARIANT = {
  paid: "default",
  unpaid: "secondary",
  overdue: "destructive",
  canceled: "outline",
  draft: "outline",
} as const;

function InvoiceCell({ inv }: { readonly inv: Row["invoice"] }) {
  if (!inv) return <span className="text-muted-foreground">none</span>;
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs">{inv.number}</span>
        {inv.status ? (
          <Badge variant={STATUS_VARIANT[inv.status]}>{inv.status}</Badge>
        ) : (
          <Badge variant="outline">Qonto unreadable</Badge>
        )}
      </div>
      <p className="text-muted-foreground text-xs">
        {inv.gross} ({inv.net} net) · issued {inv.issueDate} · due {inv.dueDate ?? "?"} ·
        paid year to {inv.periodEnd}
      </p>
      {inv.creditNoteNumber ? (
        <p className="text-muted-foreground text-xs">
          credited by {inv.creditNoteNumber}
        </p>
      ) : inv.insideWindow ? (
        <p className="text-xs">day {inv.windowDay} of 30, money back open</p>
      ) : (
        <p className="text-muted-foreground text-xs">
          day {inv.windowDay}, past the 30 days
        </p>
      )}
      {inv.qontoUrl ? (
        <a
          href={inv.qontoUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="text-primary text-xs underline"
        >
          Open in Qonto
        </a>
      ) : null}
    </div>
  );
}

export function SubscriptionsPanel() {
  const subs = trpc.platformAdmin.subscriptions.useQuery();
  const [filter, setFilter] = useState<"all" | "refund" | "watch">("all");

  const revoke = trpc.platformAdmin.revokeAccess.useMutation({
    onSuccess: async (r) => {
      await subs.refetch();
      toast.success(`Access revoked. The account is now ${r.level}.`);
    },
    onError: (e) => toast.error(e.message),
  });
  const refundDone = trpc.platformAdmin.markRefundDone.useMutation({
    onSuccess: async (r) => {
      await subs.refetch();
      toast.success(`Refund for ${r.number} recorded as transferred.`);
    },
    onError: (e) => toast.error(e.message),
  });

  const paymentArrived = trpc.platformAdmin.markPaymentArrived.useMutation({
    onSuccess: async (r) => {
      await subs.refetch();
      toast.success(
        `Refund for ${r.number} is now owed. Transfer it, then mark it done.`,
      );
    },
    onError: (e) => toast.error(e.message),
  });

  const all = subs.data ?? [];
  const owedRows = all.filter((r) => r.refundOwed);
  const watchRows = all.filter((r) => r.latePaymentWatch.length > 0);
  const rows = filter === "refund" ? owedRows : filter === "watch" ? watchRows : all;
  const toggle = (next: "refund" | "watch") =>
    setFilter((current) => (current === next ? "all" : next));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4" /> Subscriptions ({all.length})
          </CardTitle>
          <CardDescription>
            Every account that is full or has been invoiced. Status is read live from
            Qonto; overdue means unpaid past its due date. A credit note moves no money: a
            refund owed is one transfer in the Qonto app, then marked done here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={filter === "refund" ? "default" : "outline"}
              onClick={() => toggle("refund")}
              data-testid="refunds-filter"
            >
              Refund owed ({owedRows.length})
            </Button>
            <Button
              size="sm"
              variant={filter === "watch" ? "default" : "outline"}
              onClick={() => toggle("watch")}
              data-testid="late-payment-filter"
            >
              Watch for a late payment ({watchRows.length})
            </Button>
            {subs.isFetching ? (
              <span className="text-muted-foreground">loading…</span>
            ) : null}
          </div>
          {rows.length === 0 ? (
            <p className="text-muted-foreground">
              {filter === "refund"
                ? "No refund owed."
                : filter === "watch"
                  ? "No credited unpaid invoice in the last 30 days."
                  : "No subscriptions yet."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Access</TableHead>
                  <TableHead>Current invoice</TableHead>
                  <TableHead>Refunds</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.billingAccountId}>
                    <TableCell className="align-top">
                      <p className="font-medium">{r.customerName ?? "(name not read)"}</p>
                      <p className="text-muted-foreground text-xs">
                        {r.ownerEmail ?? "no account holder"}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {r.companies} companies · {r.users} users
                      </p>
                    </TableCell>
                    <TableCell className="align-top">
                      <Badge variant={r.accessLevel === "full" ? "default" : "secondary"}>
                        {r.accessLevel}
                      </Badge>
                      {r.renewalCanceledAt ? (
                        <p className="mt-1 text-muted-foreground text-xs">
                          renewal canceled{" "}
                          {new Date(r.renewalCanceledAt).toLocaleDateString("de-DE")}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="align-top">
                      <InvoiceCell inv={r.invoice} />
                    </TableCell>
                    <TableCell className="align-top space-y-2">
                      {r.latePaymentWatch.map((w) => (
                        <div key={w.creditNoteId} className="space-y-1">
                          <Badge variant="secondary">Watch for a late payment</Badge>
                          <p className="text-xs">
                            {w.invoiceNumber} was unpaid when {w.creditNoteNumber}{" "}
                            credited it on{" "}
                            {new Date(w.creditedAt).toLocaleDateString("de-DE")}. A
                            transfer of {w.gross} referencing it may still arrive.
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={paymentArrived.isPending}
                            onClick={() => {
                              if (
                                window.confirm(
                                  `A transfer for ${w.invoiceNumber} arrived in Qonto? This marks a refund of ${w.gross} as owed.`,
                                )
                              ) {
                                paymentArrived.mutate({ creditNoteId: w.creditNoteId });
                              }
                            }}
                          >
                            Payment arrived, refund owed
                          </Button>
                        </div>
                      ))}
                      {r.refunds.length === 0 ? (
                        <span className="text-muted-foreground">none</span>
                      ) : (
                        <div className="space-y-2">
                          {r.refunds.map((f) => (
                            <div key={f.creditNoteId} className="space-y-1">
                              {f.doneAt ? (
                                <p className="text-muted-foreground text-xs">
                                  {f.gross} for {f.invoiceNumber} ({f.creditNoteNumber})
                                  transferred{" "}
                                  {new Date(f.doneAt).toLocaleDateString("de-DE")} by{" "}
                                  {f.doneByEmail ?? "a deleted user"}
                                </p>
                              ) : (
                                <>
                                  <Badge variant="destructive">
                                    Refund owed: {f.gross}
                                  </Badge>
                                  <p className="text-xs">
                                    {f.invoiceNumber}, credited by {f.creditNoteNumber}
                                  </p>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={refundDone.isPending}
                                    onClick={() => {
                                      if (
                                        window.confirm(
                                          `Transferred ${f.gross} back for ${f.invoiceNumber} in the Qonto app? This records it as done, with your name.`,
                                        )
                                      ) {
                                        refundDone.mutate({
                                          creditNoteId: f.creditNoteId,
                                        });
                                      }
                                    }}
                                  >
                                    Mark refund done
                                  </Button>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="align-top text-right">
                      {r.accessLevel === "full" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={revoke.isPending}
                          onClick={() => {
                            if (
                              window.confirm(
                                `Revoke paid access for ${r.ownerEmail ?? r.billingAccountId}? The account falls back to free, or to grandfathered for a grandfathered holder. The invoice is not touched.`,
                              )
                            ) {
                              revoke.mutate({ billingAccountId: r.billingAccountId });
                            }
                          }}
                        >
                          Revoke
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <DemoCloseForm />
    </div>
  );
}
