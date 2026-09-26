import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { DURCHGANG_CODES } from "@/lib/compliance/durchgang";
import { isDoneStatus } from "@/lib/compliance/journey-position";
import { api } from "@/lib/trpc/server";

/**
 * Resume where the walk is open: the first of its items not yet done. Partial
 * is a normal state, so this is what "continue" means; once every item is
 * done, the overview is the place to be.
 */
export default async function DurchgangPage() {
  const [locale, { items }] = await Promise.all([getLocale(), api.journey.getItems({})]);
  const statusByCode = new Map(items.map((item) => [item.code, item.status]));
  const openCode = DURCHGANG_CODES.find((code) => !isDoneStatus(statusByCode.get(code)));

  redirect(
    openCode
      ? { href: { pathname: "/durchgang/[code]", params: { code: openCode } }, locale }
      : { href: "/journey", locale },
  );
}
