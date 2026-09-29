/**
 * URL slugs written per locale for routes a buyer is sent to by link: pricing, the
 * order page and the promo sign-in. Shared by the routing map (./routing) and the
 * redirects that keep the slugs they replaced working (lib/content/legacy-redirects),
 * so the two cannot drift apart.
 */
// Relative: next.config.ts loads this through lib/content/legacy-redirects.
import type { LocaleCode } from "../lib/locale";

export const PRICING_SLUGS = {
  de: "/preise",
  en: "/pricing",
  nl: "/prijzen",
  fr: "/tarifs",
  it: "/prezzi",
  es: "/precios",
  pl: "/cennik",
  cs: "/cenik",
  pt: "/precos",
  ro: "/preturi",
} as const satisfies Record<LocaleCode, string>;

export const ORDER_SLUGS = {
  de: "/bestellen",
  en: "/order",
  nl: "/bestellen",
  fr: "/commander",
  it: "/ordinare",
  es: "/pedir",
  pl: "/zamowic",
  cs: "/objednat",
  pt: "/encomendar",
  ro: "/comanda",
} as const satisfies Record<LocaleCode, string>;

/** The promo link's sign-in page (lib/billing/promo.ts). New on 30.09.2026, so no old slugs. */
export const PROMO_SIGNIN_SLUGS = {
  de: "/anmelden",
  en: "/login",
  nl: "/inloggen",
  fr: "/connexion",
  it: "/accedi",
  es: "/acceder",
  pl: "/logowanie",
  cs: "/prihlaseni",
  pt: "/entrar",
  ro: "/autentificare",
} as const satisfies Record<LocaleCode, string>;

/**
 * The slugs these routes had until 30.09.2026, the same in every locale except
 * Dutch pricing, which already read /prijzen.
 */
export const REPLACED_SLUGS = {
  pricing: "/pricing",
  order: "/bestellen",
} as const;
