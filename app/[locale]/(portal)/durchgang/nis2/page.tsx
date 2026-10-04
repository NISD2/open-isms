import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { DurchgangHome } from "@/components/durchgang/DurchgangHome";
import { getSession } from "@/lib/auth";
import { walkLockFor } from "@/lib/billing/access";
import { formatWholeEuro } from "@/lib/billing/order";
import { billingFor } from "@/lib/billing/ordering-access";
import { api } from "@/lib/trpc/server";
import { walkAccess } from "../gate";
import { loadWalk } from "./load";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("durchgang");
  return { title: t("title"), robots: { index: false, follow: false } };
}

/**
 * The Durchgang's front door, and the portal's. An account that has not paid sees it locked: the
 * same page, with the way to order and its price in place of the way in. A company not set up yet
 * sees setting it up as the first step.
 */
export default async function DurchgangHomePage() {
  const [{ mayWalk }, session, locale] = await Promise.all([
    walkAccess(),
    getSession(),
    getLocale(),
  ]);
  const lock =
    mayWalk || !session
      ? null
      : walkLockFor(session.accessLevel, billingFor(session.user.email).open);
  const [walk, price] = await Promise.all([
    loadWalk({ locked: lock !== null }),
    lock?.orderAt
      ? api.billing.status().then((status) => formatWholeEuro(status.netCents, locale))
      : null,
  ]);
  return (
    <DurchgangHome
      walk={walk}
      lock={lock}
      price={price}
      setup={!session?.companyActivated}
    />
  );
}
