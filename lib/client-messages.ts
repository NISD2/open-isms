import type { AbstractIntlMessages } from "next-intl";

/**
 * The namespaces client components read on public pages (the landing page, the info pages, the
 * wiki, sign-in), and all the locale layout hands to the browser. Routes whose client components
 * read more render under `AllMessagesProvider` in their own layout. Handing every namespace to
 * every page made the landing page's HTML 517 KB, 375 KB of it translations, nearly all for
 * screens the page never shows (measured 04.10.2026).
 *
 * `client-messages.test.ts` walks each public route's client imports and fails when one reads a
 * namespace missing here.
 */
export const PUBLIC_CLIENT_NAMESPACES = [
  "common",
  "landing",
  "info",
  "auth",
  "help",
  "pricing",
  "assetInventory",
  "riskAssessment",
  "grcComparison",
] as const;

/**
 * The `info` namespace holds ~1.8 MB of long-form wiki body content per locale. Server components
 * render it via getTranslations('info'); client components read only these keys of it.
 */
const INFO_CLIENT_KEYS = ["footer", "relatedArticles"] as const;

const pick = (
  source: AbstractIntlMessages,
  keys: readonly string[],
): AbstractIntlMessages =>
  Object.fromEntries(
    keys.filter((key) => Object.hasOwn(source, key)).map((key) => [key, source[key]]),
  );

/** The messages for client components: `namespaces` when given, else all, with `info` trimmed. */
export function clientMessages(
  messages: AbstractIntlMessages,
  namespaces?: readonly string[],
): AbstractIntlMessages {
  const { info, ...rest } = namespaces ? pick(messages, namespaces) : messages;
  return typeof info === "object"
    ? { ...rest, info: pick(info, INFO_CLIENT_KEYS) }
    : rest;
}
