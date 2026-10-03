import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getPathname } from "@/i18n/navigation";

/**
 * The NIS 2 walkthrough lives at /durchgang/nis2, so a walkthrough for another framework can sit
 * beside it. This address, and the two below it, keep working for links already sent.
 */
export default async function DurchgangRedirect() {
  redirect(getPathname({ href: "/durchgang/nis2", locale: await getLocale() }));
}
