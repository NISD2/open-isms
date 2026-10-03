import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getPathname } from "@/i18n/navigation";

/** An item's old address: the same item and screen in the NIS 2 walkthrough. */
export default async function DurchgangItemRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ s?: string }>;
}) {
  const [{ code }, { s }, locale] = await Promise.all([
    params,
    searchParams,
    getLocale(),
  ]);
  redirect(
    getPathname({
      href: {
        pathname: "/durchgang/nis2/[code]",
        params: { code },
        ...(s === undefined ? {} : { query: { s } }),
      },
      locale,
    }),
  );
}
