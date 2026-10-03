import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { OnboardingBanner } from "@/components/dashboard/OnboardingBanner";
import { PortalShell } from "@/components/portal/PortalShell";
import { redirect as localeRedirect } from "@/i18n/navigation";
import { getSession } from "@/lib/auth";
import { mayOpenPortalPath, OFFER_PATH, ORDER_PATHS } from "@/lib/billing/access";
import { WALK_HOME_PATHS, walkthroughLive } from "@/lib/walkthrough";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/auth/signin");

  // The access gate (lib/billing/access.ts): an account that must order first reaches only the few
  // pages that let it do so, and is sent to the offer for anything else. A redirect rather than the
  // offer in the page's place: Next.js renders a page alongside its layout and sends it with the
  // response even when the layout leaves it out. The offer has its own layout ((offer)/layout.tsx),
  // never this one, because a layout must not redirect to a page under itself.
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "";
  const mustOrder = session.accessLevel === "free";
  // Once the walkthrough is the front, its home opens to an unpaid account too, locked, with the
  // way to order (Simon, 03.10.2026). Its items stay closed (the walk's own gate).
  const walkHome =
    WALK_HOME_PATHS.includes(pathname) && (await walkthroughLive(session.user.email));
  if (mustOrder && !mayOpenPortalPath("free", pathname) && !walkHome) {
    localeRedirect({ href: OFFER_PATH, locale: await getLocale() });
  }

  // Routes a not-yet-activated user (no company, or a draft shell
  // auto-provisioned at verification) may reach without the activation banner.
  // /journey is here: it is the draft's home surface, rendering the seeded path
  // with a "set up your organization" first step. Every other real-work route
  // steers the draft to activation. /team is intentionally absent — a draft must
  // not manage a team before activating. Gating on companyActivated (not merely
  // companyId) is what makes a draft see the banner here instead of an empty,
  // 403-on-write shell. /billing and the order page are here because ordering
  // only needs the draft: someone may order before setting up their
  // organization, and must still see their invoices and be able to cancel.
  const ALLOWED_WITHOUT_COMPANY = [
    "/dashboard",
    "/journey",
    "/organization",
    "/audit",
    "/notifications",
    "/settings",
    "/gap-assessment",
    "/billing",
    ...ORDER_PATHS,
  ];
  const needsCompany = !ALLOWED_WITHOUT_COMPANY.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  const showOnboarding = !session.companyActivated && needsCompany;

  return (
    <PortalShell session={session}>
      {showOnboarding ? <OnboardingBanner /> : children}
    </PortalShell>
  );
}
