/**
 * The price for a VAT number before ordering, shared by both doors: the customer's order page and
 * the platform admin demo close. Only the offline check digit can stop the form; what the EU
 * register says only adds a warning (./order-gate).
 */
import { formatEuro, type Money, priceFor } from "./order";
import { gateFromInput } from "./order-gate";
import { checkStructure } from "./vat-checksum";
import { checkVatNumber, splitVatNumber, toAttempt, type ViesConfig } from "./vies";

/** How a price is shown in a form. `grossCents` travels back with the order it was shown for. */
export const priceView = (money: Money) => ({
  net: formatEuro(money.netCents),
  vat: formatEuro(money.vatCents),
  gross: formatEuro(money.grossCents),
  grossCents: money.grossCents,
  vatRatePercent: Math.round(money.vatRate * 100),
  treatment: money.treatment.kind,
});

export const quoteFor = async (input: {
  readonly vatNumber: string;
  readonly countryCode?: string | undefined;
  readonly netCents: number;
  readonly vies: ViesConfig;
}) => {
  const parts = splitVatNumber(input.vatNumber);
  const countryCode = parts?.countryCode ?? input.countryCode?.toUpperCase() ?? "";
  const structural = parts
    ? checkStructure(parts.countryCode, parts.vatNumber)
    : ({ ok: false, reason: "format", countryCode } as const);
  // A malformed number is a typo, and typos are not sent to the Commission.
  const registry = structural.ok
    ? await checkVatNumber(input.vatNumber, input.vies)
    : null;
  return {
    gate: gateFromInput(countryCode, parts?.vatNumber ?? "", registry),
    attempt: registry ? toAttempt(input.vatNumber, registry) : null,
    price: priceView(priceFor(countryCode, registry, input.netCents)),
  };
};
