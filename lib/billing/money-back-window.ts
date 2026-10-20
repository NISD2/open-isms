/**
 * The thirty days money back as arithmetic (AGB B7), apart from the database so it can be tested
 * without one. Which invoice it is asked about is ./money-back's job.
 */
import { invoiceToday, shiftDay } from "./order";

/** Money back for thirty days from the order, the same thirty days the invoice gives to pay. */
export const MONEY_BACK_DAYS = 30;

export type CancelWindow =
  | {
      /** Inside the thirty days of the account's first invoice: a full credit note cancels it. */
      readonly kind: "money_back";
      /** Days since the issue date: 0 on the order day, 30 on the last day. */
      readonly day: number;
      readonly lastDay: string;
    }
  | {
      /** Otherwise: nothing is credited, the paid year runs out and does not renew. */
      readonly kind: "renewal";
      readonly day: number;
      /**
       * Why there is no money back: the thirty days have passed, the invoice is not the account's
       * first (a renewal, or a new order after a cancel), which never has them, or the customer
       * gave them up with a confirmed first export or sign-off (AGB B7).
       */
      readonly reason: "window_passed" | "not_first_invoice" | "money_back_waived";
    };

const daysBetween = (from: string, to: string): number =>
  Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000,
  );

/**
 * Which cancel applies to an invoice today. Money back belongs to the account's first invoice
 * only. The order day does not count and the thirtieth day after it does (§ 187 Abs. 1, § 188
 * Abs. 1 BGB), so an order on the 1st can be canceled for its money until the end of the 31st, in
 * Berlin, where invoices are dated. A waiver (`waived`) ends them on the day it was given.
 */
export const cancelWindow = (
  inv: {
    readonly issueDate: string;
    readonly firstInvoice: boolean;
    readonly waived: boolean;
  },
  now: Date,
): CancelWindow => {
  const lastDay = shiftDay(inv.issueDate, { days: MONEY_BACK_DAYS });
  const day = daysBetween(inv.issueDate, invoiceToday(now));
  if (!inv.firstInvoice) return { kind: "renewal", day, reason: "not_first_invoice" };
  if (invoiceToday(now) > lastDay)
    return { kind: "renewal", day, reason: "window_passed" };
  return inv.waived
    ? { kind: "renewal", day, reason: "money_back_waived" }
    : { kind: "money_back", day, lastDay };
};
