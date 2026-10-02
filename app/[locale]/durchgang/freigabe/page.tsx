import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getPathname } from "@/i18n/navigation";

/** Management's approval page at its old address, which invites already sent link to. */
export default async function ApprovalRedirect() {
  redirect(getPathname({ href: "/durchgang/nis2/freigabe", locale: await getLocale() }));
}
