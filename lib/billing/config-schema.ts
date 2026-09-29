/**
 * The billing settings, as a slice of the environment schema, and the constants they default to.
 *
 * A leaf module on purpose: it imports nothing but zod, so `lib/env.ts` can include it without
 * pulling billing code into every bundle that reads the environment, and the billing modules can
 * take their constants from here without importing the environment.
 *
 * Nothing here can fail validation. A billing setting that is wrong must switch billing off, not
 * stop the whole application from starting, so values are only trimmed and normalised here and are
 * checked where they are used.
 */
import { z } from "zod";
import { PROMO_ENDED } from "./promo";

export const QONTO_PRODUCTION_BASE = "https://thirdparty.qonto.com/v2";
export const QONTO_SANDBOX_HOST = "thirdparty-sandbox.staging.qonto.co";
export const VIES_DEFAULT_ENDPOINT =
  "https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number";

/** Trimmed; empty or only whitespace counts as unset, so a copied `KEY=` still gets its default. */
const trimmed = (v: unknown): unknown =>
  typeof v === "string" ? v.trim() || undefined : v;
const upper = (v: unknown): unknown => {
  const t = trimmed(v);
  return typeof t === "string" ? t.toUpperCase() : t;
};

const optional = z.preprocess(trimmed, z.string().optional());

export const billingEnvShape = {
  QONTO_API_BASE: z.preprocess(trimmed, z.string().default(QONTO_PRODUCTION_BASE)),
  QONTO_LOGIN: optional,
  QONTO_SECRET_KEY: optional,
  QONTO_SANDBOX_LOGIN: optional,
  QONTO_SANDBOX_SECRET_KEY: optional,
  QONTO_STAGING_TOKEN: optional,
  /** RE, because Qonto only matches a transfer to an invoice by itself for prefixes it knows. */
  INVOICE_PREFIX: z.preprocess(upper, z.string().default("RE")),
  /** The seller's own VAT number, with its country prefix, e.g. DE123456789. */
  OWN_VAT_NUMBER: optional,
  VIES_ENDPOINT: z.preprocess(trimmed, z.string().default(VIES_DEFAULT_ENDPOINT)),
  /** A public code that grandfathers whoever signs in with it (lib/billing/promo.ts). Unset: none. */
  GRANDFATHER_PROMO_CODE: optional,
  /**
   * The promo's last day, YYYY-MM-DD, in Berlin, inclusive. Required: without it the code does
   * nothing. A value that is not a date closes the promo rather than leaving it open for good.
   */
  GRANDFATHER_PROMO_UNTIL: z.preprocess(trimmed, z.iso.date().optional()).catch(() => {
    console.warn(
      "[billing] GRANDFATHER_PROMO_UNTIL is not a YYYY-MM-DD date; the promo is closed",
    );
    return PROMO_ENDED;
  }),
};

export const billingEnvSchema = z.object(billingEnvShape);
