import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DurchgangHome } from "@/components/durchgang/DurchgangHome";
import { getSession } from "@/lib/auth";
import { walkLockFor } from "@/lib/billing/access";
import { billingFor } from "@/lib/billing/ordering-access";
import { db } from "@/lib/db";
import { walkAccess } from "../gate";
import { loadWalk } from "./load";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("durchgang");
  return { title: t("title"), robots: { index: false, follow: false } };
}

/**
 * The Durchgang's front door. An account that has not paid sees it locked once the walkthrough is
 * the portal's front: the same page, with the way to order in place of the way in.
 */
export default async function DurchgangHomePage() {
  const [{ mayWalk }, session] = await Promise.all([walkAccess(), getSession()]);
  const lock =
    mayWalk || !session
      ? null
      : walkLockFor(session.accessLevel, (await billingFor(db, session.user.email)).open);
  return <DurchgangHome walk={await loadWalk({ locked: lock !== null })} lock={lock} />;
}
