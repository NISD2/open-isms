import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { AllMessagesProvider } from "@/components/AllMessagesProvider";
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
import { isConsentPath } from "@/lib/mcp/consent-path";
import { WALK_FREE_PATHS, WALK_HOME_PATHS } from "@/lib/walkthrough";

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
  // The walk's home opens to an unpaid account too, with the way to order (Simon, 03.10.2026), and
  // so do its free steps (Simon, 20.10.2026). Every other item stays closed (the walk's own gate).
  const walkHome =
    WALK_HOME_PATHS.includes(pathname) || WALK_FREE_PATHS.includes(pathname);
  // An assistant's sign-in too: its page says the walkthrough is locked, with the way there, where
  // the offer would drop the assistant's request unexplained. Allowing stays refused server side.
  const consent = isConsentPath(pathname);
  if (mustOrder && !mayOpenPortalPath("free", pathname) && !walkHome && !consent) {
    localeRedirect({ href: OFFER_PATH, locale: await getLocale() });
  }

  // Routes a not-yet-activated user (no company, or a draft shell
  // auto-provisioned at verification) may reach without setting the company up.
  // /journey is here: it is the draft's home surface, rendering the seeded path
  // with a "set up your organization" first step. The walk is here too: its home
  // shows a draft the walk (locked until paid), and the step after the
  // registration sets the company up (Simon, 04.10.2026). Every other real-work route asks the draft
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
    ...WALK_FREE_PATHS,
    ...(mustOrder ? EXAMPLE_PORTAL_PATHS : []),
  ];
  const needsCompany = !ALLOWED_WITHOUT_COMPANY.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  const showSetup = !session.companyActivated && needsCompany;
  // An assistant's sign-in reaches a company not set up yet too: the form then says why it is
  // there and that the consent follows on the same page once the company is saved.
  const setupLead =
    showSetup && consent
      ? (await getTranslations("settings.mcp.connect"))("setupFirst")
      : undefined;

  return (
    <AllMessagesProvider>
      <PortalShell session={session}>
        {showSetup ? <CompanySetup lead={setupLead} /> : children}
      </PortalShell>
    </AllMessagesProvider>
  );
}
