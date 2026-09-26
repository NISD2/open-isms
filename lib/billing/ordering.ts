/**
 * Whether ordering is open, and to whom. One rule for the order page, the billing page, the pricing
 * button and the order procedures, so none of them can disagree about it.
 *
 * Derived from the configuration rather than from a flag someone might set by accident:
 *
 *   - **off** when Qonto is not configured or the invoice prefix is unusable. Nobody can order.
 *   - **sandbox** when the configured Qonto host is the sandbox. Only platform admins can order,
 *     because a sandbox invoice is not a real one, and anyone else ordering there would get paid
 *     access for an invoice nobody can pay.
 *   - **live** when it is Qonto's production host. Anyone with an account can order.
 */
import { isValidInvoicePrefix } from "./invoice-number";
import { type QontoConfig, type QontoEnv, qontoConfigFromEnv } from "./qonto";
import { isSandboxBase } from "./sandbox-gate";

export type OrderingMode =
  | { readonly kind: "off" }
  | { readonly kind: "sandbox"; readonly qonto: QontoConfig }
  | { readonly kind: "live"; readonly qonto: QontoConfig };

export const orderingMode = (
  env: QontoEnv & { readonly INVOICE_PREFIX: string },
): OrderingMode => {
  const qonto = qontoConfigFromEnv(env);
  if (!qonto || !isValidInvoicePrefix(env.INVOICE_PREFIX)) return { kind: "off" };
  return isSandboxBase(qonto.baseUrl)
    ? { kind: "sandbox", qonto }
    : { kind: "live", qonto };
};

/** Whether this caller may place an order in this mode. */
export const mayOrderIn = (mode: OrderingMode, callerIsPlatformAdmin: boolean): boolean =>
  mode.kind === "live" || (mode.kind === "sandbox" && callerIsPlatformAdmin);
