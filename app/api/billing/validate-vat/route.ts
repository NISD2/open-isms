/**
 * Validate a VAT number and price the order.
 *
 * Two layers, deliberately: the offline check digit decides whether the form may proceed, and VIES
 * is consulted for the record. VIES never blocks, because it is 27 government backends behind one
 * facade with no service guarantee and it was observed down for forty minutes on 24.09.2026 while
 * its own status endpoint claimed otherwise.
 *
 * Read-only and cheap, so it needs no auth, but it is deliberately not a proxy for arbitrary
 * lookups: it takes one number and returns one answer about one order.
 */
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { formatEuro, priceFor } from "@/lib/billing/order";
import { gateFromInput } from "@/lib/billing/order-gate";
import { checkStructure } from "@/lib/billing/vat-checksum";
import { checkVatNumber, splitVatNumber, toAttempt } from "@/lib/billing/vies";

const body = z.object({
  vatNumber: z.string().trim().min(2).max(32),
  /** Optional: where the customer says they are, used when the number cannot be parsed. */
  countryCode: z.string().trim().length(2).optional(),
});

export async function POST(req: NextRequest) {
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "vatNumber is required" }, { status: 400 });
  }

  const parts = splitVatNumber(parsed.data.vatNumber);
  const countryCode = parts?.countryCode ?? parsed.data.countryCode?.toUpperCase() ?? "";

  const structural = parts
    ? checkStructure(parts.countryCode, parts.vatNumber)
    : ({ ok: false, reason: "format", countryCode } as const);

  // Only ask the register once the number is structurally sound. A malformed number is a typo,
  // and sending typos to the Commission is neither useful nor polite.
  const registry = structural.ok ? await checkVatNumber(parsed.data.vatNumber) : null;
  const attempt = registry ? toAttempt(parsed.data.vatNumber, registry) : null;
  const gate = gateFromInput(countryCode, parts?.vatNumber ?? "", registry);
  const money = priceFor(countryCode, registry);

  return NextResponse.json({
    countryCode,
    structural,
    /** What the register said, or why it could not say anything. Stored with the order. */
    attempt,
    gate,
    price: {
      net: formatEuro(money.netCents),
      vat: formatEuro(money.vatCents),
      gross: formatEuro(money.grossCents),
      vatRatePercent: Math.round(money.vatRate * 100),
      treatment: money.treatment.kind,
      treatmentNote:
        "note" in money.treatment
          ? money.treatment.note
          : "why" in money.treatment
            ? money.treatment.why
            : null,
    },
  });
}
