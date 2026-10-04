import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { CompanySetup } from "@/components/organization/CompanySetup";
import { PortalShell } from "@/components/portal/PortalShell";
import { redirect as localeRedirect } from "@/i18n/navigation";
import { getSession } from "@/lib/auth";
import {
  EXAMPLE_PORTAL_PATHS,
  mayOpenPortalPath,
  OFFER_PATH,
  ORDER_PATHS,
} from "@/lib/billing/access";
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
  // auto-provisioned at verification) may reach without setting the company up.
  // /journey is here: it is the draft's home surface, rendering the seeded path
  // with a "set up your organization" first step. The walk is here too: its home
  // shows a draft the walk (locked until paid), and its first step sets the
  // company up (Simon, 04.10.2026). Every other real-work route asks the draft
  // to set the company up in its place. /team is intentionally absent — a draft
  // must not manage a team before activating. Gating on companyActivated (not
  // merely companyId) is what keeps a draft from an empty, 403-on-write shell.
  // /billing and the order page are here because ordering only needs the draft:
  // someone may order before setting up their organization, and must still see
  // their invoices and be able to cancel. A free account sees the registers as
  // examples, which need no company.
  const ALLOWED_WITHOUT_COMPANY = [
    "/journey",
    "/organization",
    "/audit",
    "/notifications",
    "/settings",
    "/gap-assessment",
    "/billing",
    ...ORDER_PATHS,
    ...WALK_HOME_PATHS,
    ...(mustOrder ? EXAMPLE_PORTAL_PATHS : []),
  ];
  const needsCompany = !ALLOWED_WITHOUT_COMPANY.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  const showSetup = !session.companyActivated && needsCompany;

  return (
    <PortalShell session={session}>{showSetup ? <CompanySetup /> : children}</PortalShell>
  );
}
