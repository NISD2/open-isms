import "@/lib/server-guard";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ApprovalPage } from "@/components/durchgang/ApprovalPage";
import { DurchgangHome } from "@/components/durchgang/DurchgangHome";
import { DurchgangItem } from "@/components/durchgang/DurchgangItem";
import { ForwardToManagement } from "@/components/durchgang/ForwardToManagement";
import { TalkFirst } from "@/components/pricing/PaidPricingCards";
import { getSession } from "@/lib/auth";
import { walkLockFor } from "@/lib/billing/access";
import { formatWholeEuro } from "@/lib/billing/order";
import { billingFor } from "@/lib/billing/ordering-access";
import {
  isFreeStep,
  MANAGEMENT_ROLE,
  type Walk,
  walkLocaleOf,
  walkOfCode,
} from "@/lib/durchgang";
import { api } from "@/lib/trpc/server";
import { requireWalk, walkAccess } from "../gate";
import { loadItem, loadWalk } from "./load";

/**
 * Every walk's three pages, rendered from its `Walk`: the route files under durchgang/<framework>
 * only name the walk, so a new framework adds routes, not page code.
 */

/** A walk page's title and the rule that no walk page is indexed. */
export async function walkMetadata(walk: Walk): Promise<Metadata> {
  const t = await getTranslations("durchgang");
  return {
    title: t(`walks.${walk.framework}.title`),
    robots: { index: false, follow: false },
  };
}

/** The approval page's title, the same for every walk. */
export async function approvalMetadata(): Promise<Metadata> {
  const t = await getTranslations("durchgang.ui.approve");
  return { title: t("pageTitle"), robots: { index: false, follow: false } };
}

/**
 * A walk's front door, and the portal's. An account that has not paid walks the walk's first
 * steps (`isFreeStep`) and sees the rest locked: the same page, with the way to order and its
 * price once those are filled in. Setting the company up is a step, right after the walk's
 * `setupAfter`.
 */
export async function WalkHome({ walk }: { walk: Walk }) {
  const [{ mayWalk }, session, locale] = await Promise.all([
    walkAccess(),
    getSession(),
    getLocale(),
  ]);
  const lock =
    mayWalk || !session
      ? null
      : walkLockFor(session.accessLevel, billingFor(session.user.email).open);
  const [entries, status] = await Promise.all([
    loadWalk(walk),
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
      framework={walk.framework}
      walk={entries}
      lock={lock}
      price={status ? formatWholeEuro(status.netCents, locale) : null}
      setup={!session?.companyActivated}
      call={<TalkFirst size="button" className="h-12 rounded-xl" />}
      forward={mayForward ? <ForwardToManagement /> : null}
    />
  );
}

/**
 * One item of a walk, one screen at a time. The screen index is `?s=`, written by the client as
 * the person moves, so a reload or the back button keeps the place. A code of another walk is not
 * found here: each walk opens only its own items.
 */
export async function WalkItem({
  walk,
  code,
  screen,
}: {
  walk: Walk;
  code: string;
  screen: string | undefined;
}) {
  if (walkOfCode(code) !== walk) notFound();
  const mayWalk = await requireWalk(walk, code);
  const [item, entries, session] = await Promise.all([
    loadItem(code),
    loadWalk(walk),
    getSession(),
  ]);
  if (!item) notFound();
  return (
    <DurchgangItem
      key={code}
      item={item}
      walk={mayWalk ? entries : entries.filter((w) => isFreeStep(w.code))}
      setup={!session?.companyActivated}
      initialScreen={Number(screen ?? 0)}
    />
  );
}

/**
 * Where management approves the documents a walk wrote, the page its invite and its link lead to.
 * It needs no category of the walk: approving is management's act, which the server checks by
 * role. The layout checks sign-in, `requireWalk` the plan and that the company is set up.
 */
export async function WalkApproval({ walk }: { walk: Walk }) {
  await requireWalk(walk);
  const [session, locale] = await Promise.all([getSession(), getLocale()]);
  return (
    <ApprovalPage
      framework={walk.framework}
      locale={walkLocaleOf(locale, walk.locales)}
      viewer={{
        id: session?.user.id ?? "",
        management: session?.jobTitle === MANAGEMENT_ROLE,
        admin: session?.role === "admin",
      }}
    />
  );
}
