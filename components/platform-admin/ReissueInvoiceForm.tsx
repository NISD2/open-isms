"use client";

/**
 * Reissue an unpaid invoice on terms agreed with the customer after they ordered: a service
 * period, an amount, their Bestellnummer, who receives it (lib/billing/reissue.ts). The old
 * invoice is credited and the new one is mailed; access does not change.
 */
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc/client";
import { centsFrom } from "./DemoCloseForm";

export function ReissueInvoiceForm({
  billingAccountId,
  invoiceNumber,
  periodStart,
  periodEnd,
  ownerEmail,
  onDone,
}: {
  readonly billingAccountId: string;
  readonly invoiceNumber: string;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly ownerEmail: string | null;
  readonly onDone: () => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(periodStart);
  const [end, setEnd] = useState(periodEnd);
  const [amount, setAmount] = useState("");
  const [purchaseOrder, setPurchaseOrder] = useState("");
  const [sendTo, setSendTo] = useState(ownerEmail ?? "");
  const netCents = centsFrom(amount);
  const amountInvalid = Number.isNaN(netCents);
  const recipients = sendTo
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const reissue = trpc.platformAdmin.reissueInvoice.useMutation({
    onSuccess: async (r) => {
      await onDone();
      setOpen(false);
      toast.success(
        `${r.replacedNumber} credited by ${r.creditNoteNumber}. ${r.number} issued for ${r.periodStart} to ${r.periodEnd} and sent.`,
      );
    },
    onError: (e) =>
      toast.error(
        e.data?.code === "TIMEOUT"
          ? `${e.message} Check Qonto before trying again.`
          : e.message,
      ),
  });

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Reissue
      </Button>
    );
  }

  const submit = () => {
    if (amountInvalid || recipients.length === 0 || !start || !end) return;
    if (
      !window.confirm(
        `Credit ${invoiceNumber} and issue a new invoice for ${start} to ${end}${netCents ? ` at ${amount} EUR net` : ""}, sent to ${recipients.join(", ")}?`,
      )
    )
      return;
    reissue.mutate({
      billingAccountId,
      periodStart: start,
      periodEnd: end,
      netCents,
      purchaseOrder: purchaseOrder.trim() || null,
      recipients,
    });
  };

  return (
    <div className="space-y-2 rounded-md border p-3 text-left">
      <p className="text-xs">
        Credits {invoiceNumber} and issues a replacement. Money back still counts from the
        original order.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor={`reissue-start-${billingAccountId}`}>Period from</Label>
          <Input
            id={`reissue-start-${billingAccountId}`}
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`reissue-end-${billingAccountId}`}>Period to</Label>
          <Input
            id={`reissue-end-${billingAccountId}`}
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor={`reissue-amount-${billingAccountId}`}>
          Net amount in EUR (blank: unchanged)
        </Label>
        <Input
          id={`reissue-amount-${billingAccountId}`}
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        {amountInvalid ? (
          <p className="text-destructive text-xs">A positive amount, such as 2.400.</p>
        ) : null}
      </div>
      <div className="space-y-1">
        <Label htmlFor={`reissue-po-${billingAccountId}`}>Bestellnummer (optional)</Label>
        <Input
          id={`reissue-po-${billingAccountId}`}
          value={purchaseOrder}
          onChange={(e) => setPurchaseOrder(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`reissue-to-${billingAccountId}`}>
          Send to (up to three, comma separated)
        </Label>
        <Input
          id={`reissue-to-${billingAccountId}`}
          value={sendTo}
          onChange={(e) => setSendTo(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={submit}
          disabled={
            reissue.isPending ||
            amountInvalid ||
            recipients.length === 0 ||
            recipients.length > 3 ||
            !start ||
            !end
          }
        >
          Credit and reissue
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Close
        </Button>
      </div>
    </div>
  );
}
