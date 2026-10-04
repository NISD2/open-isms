import "@/lib/server-guard";
import { getSession } from "@/lib/auth";

/**
 * Whether a page of `EXAMPLE_PORTAL_PATHS` shows example rows in place of the company's own: the
 * account must order first, so its own data sits behind the paywall. Asked before the page reads
 * anything.
 */
export const showsExamples = async (): Promise<boolean> =>
  (await getSession())?.accessLevel === "free";
