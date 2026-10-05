import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { DurchgangHome } from "@/components/durchgang/DurchgangHome";
import { ForwardToManagement } from "@/components/durchgang/ForwardToManagement";
import { TalkFirst } from "@/components/pricing/PaidPricingCards";
import { getSession } from "@/lib/auth";
import { walkLockFor } from "@/lib/billing/access";
import { formatWholeEuro } from "@/lib/billing/order";
import { billingFor } from "@/lib/billing/ordering-access";
import { MANAGEMENT_ROLE } from "@/lib/durchgang/types";
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
 * sees setting it up as a step, right after the registration.
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
  const [walk, status] = await Promise.all([
    loadWalk({ locked: lock !== null }),
    lock?.orderAt ? api.billing.status() : null,
  ]);
  // Handing the order to management invites someone into the company, and only management the
  // holder invited may order (team.forwardToManagement), so the holder sends it, as an admin. Not
  // to someone who is management already: they order themselves.
  const mayForward =
    status?.isPayer === true &&
    session?.role === "admin" &&
    session.jobTitle !== MANAGEMENT_ROLE;
  return (
    <DurchgangHome
      walk={walk}
      lock={lock}
      price={status ? formatWholeEuro(status.netCents, locale) : null}
      setup={!session?.companyActivated}
      call={<TalkFirst size="button" className="h-12 rounded-xl" />}
      forward={mayForward ? <ForwardToManagement /> : null}
    />
  );
}
