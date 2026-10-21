import { ORDER_SLUGS } from "@/i18n/slugs";
import { isTokenRoute } from "@/lib/analytics/token-routes";
import { isLocaleCode } from "@/lib/locale";
import { localCallbackPath } from "./local-path";

export const CALLBACK_DESTINATIONS = [
  "course",
  "walkthrough",
  "order",
  "billing",
  "supplierQuestionnaire",
  "assistant",
  "link",
  "other",
] as const;

export type CallbackDestination = (typeof CALLBACK_DESTINATIONS)[number];

const BASE = "http://local.invalid";
const ORDER_SEGMENTS: ReadonlySet<string> = new Set(
  Object.values(ORDER_SLUGS).map((slug) => slug.slice(1)),
);

/**
 * What a sign-in is about to open, as a name the page may show. Never the path: a callbackUrl can
 * be /invite/<token>, which is a credential, so the result is one of a fixed list and the notice
 * has no way to print the path. Null without a callbackUrl, so a plain visit shows nothing.
 */
export function callbackDestination(raw: string | undefined): CallbackDestination | null {
  const local = localCallbackPath(raw ?? null, "");
  if (local === "") return null;

  const { pathname } = new URL(local, BASE);
  // A credential link wins over every other reading of its path.
  if (isTokenRoute(pathname)) return "link";

  const segments = pathname.split("/").filter(Boolean);
  const [first, second] = isLocaleCode(segments[0]?.toLowerCase())
    ? segments.slice(1)
    : segments;

  if (first === "training") return "course";
  if (first === "durchgang" || first === "walkthrough" || first === "dashboard") {
    return "walkthrough";
  }
  if (first !== undefined && ORDER_SEGMENTS.has(first)) return "order";
  if (first === "billing") return "billing";
  if (first === "sicherheitsfragebogen") return "supplierQuestionnaire";
  if (first === "portal" && second === "supplier-onboarding")
    return "supplierQuestionnaire";
  if (first === "mcp") return "assistant";
  return "other";
}
