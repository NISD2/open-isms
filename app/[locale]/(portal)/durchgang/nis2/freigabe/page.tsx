import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { ApprovalPage } from "@/components/durchgang/ApprovalPage";
import { getSession } from "@/lib/auth";
import { MANAGEMENT_ROLE } from "@/lib/durchgang";
import { requireWalk } from "../../gate";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("durchgang.ui.approve");
  return { title: t("pageTitle"), robots: { index: false, follow: false } };
}

/**
 * Where management approves the documents the walk wrote, the page its invite and its link lead
 * to. It needs no category of the walk: approving is management's act, which the server checks
 * by role. The layout checks sign-in and activation, `requireWalk` the plan.
 */
export default async function ApprovalRoute() {
  await requireWalk();
  const [session, locale] = await Promise.all([getSession(), getLocale()]);
  return (
    <ApprovalPage
      locale={locale === "de" ? "de" : "en"}
      viewer={{
        id: session?.user.id ?? "",
        management: session?.jobTitle === MANAGEMENT_ROLE,
        admin: session?.role === "admin",
      }}
    />
  );
}
