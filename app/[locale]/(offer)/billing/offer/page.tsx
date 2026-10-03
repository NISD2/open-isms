import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { PortalOffer } from "@/components/billing/PortalOffer";
import { redirect } from "@/i18n/navigation";
import { getSession } from "@/lib/auth";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("billing.offer");
  return { title: t("paidName") };
}

/**
 * Where the portal layout sends an account that must order first, from any page it may not open,
 * and where the locked walk's "Jetzt bestellen" leads it. Anyone else already has the Compliance
 * Portal, so the offer would only confuse them; they go to the portal's home.
 */
export default async function OfferPage() {
  const session = await getSession();
  if (session?.accessLevel !== "free") {
    redirect({ href: "/dashboard", locale: await getLocale() });
  }
  return <PortalOffer />;
}
