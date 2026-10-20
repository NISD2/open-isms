/**
 * What Qonto says about one invoice now. Qonto is the source of truth for an invoice's status
 * (docs/billing.md), so the Subscriptions tab and the non-payment sweep read it here, the one place
 * its answer is checked field by field.
 */
import "@/lib/server-guard";
import { z } from "zod";
import type { OrderingMode } from "./ordering";
import { getInvoice } from "./qonto";
import { httpsHostOf } from "./sandbox-gate";

const QONTO_STATUSES = ["paid", "unpaid", "canceled", "draft"] as const;
export type QontoStatus = (typeof QONTO_STATUSES)[number];
const isQontoStatus = (s: string | undefined): s is QontoStatus =>
  QONTO_STATUSES.some((k) => k === s);

const isoDay = z.iso.date();

export interface LiveInvoice {
  /** Null when Qonto could not be read or answered something unexpected. */
  readonly status: QontoStatus | null;
  readonly dueDate: string | null;
  readonly url: string | null;
  readonly customerName: string | null;
}

/** Every field is checked, because it is an outside answer; nothing readable is all nulls. */
export const readLiveInvoice = async (
  mode: OrderingMode,
  qontoInvoiceId: string,
): Promise<LiveInvoice> => {
  const none = { status: null, dueDate: null, url: null, customerName: null } as const;
  if (mode.kind === "off") return none;
  const res = await getInvoice(mode.qonto, qontoInvoiceId);
  const record = res.ok ? res.data.client_invoice : undefined;
  if (!record) return none;
  return {
    status: isQontoStatus(record.status) ? record.status : null,
    dueDate: isoDay.safeParse(record.due_date).data ?? null,
    url:
      record.invoice_url && httpsHostOf(record.invoice_url) ? record.invoice_url : null,
    customerName: typeof record.client?.name === "string" ? record.client.name : null,
  };
};
