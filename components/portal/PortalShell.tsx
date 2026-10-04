import type { Session } from "next-auth";
import { AdminTestPanel } from "@/components/portal/AdminTestPanel";
import { AppSidebar } from "@/components/portal/AppSidebar";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { hasReviewAccess } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { mayWalkDurchgang } from "@/lib/billing/access";
import { billingFor } from "@/lib/billing/ordering-access";
import { env } from "@/lib/env";
import { mayExport } from "@/lib/export/access";

/**
 * The compliance portal's frame: its sidebar, its header, and the page beside them. Gates (the
 * paywall, the activation banner) belong to the portal layout, not here, so the offer's own
 * layout draws the same frame without them.
 */
export function PortalShell({
  session,
  children,
}: {
  session: Session;
  children: React.ReactNode;
}) {
  const mustOrder = session.accessLevel === "free";
  const platformAdmin = isPlatformAdmin(session.user.email);

  return (
    <SidebarProvider defaultOpen>
      <AppSidebar
        user={{
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          isPlatformAdmin: platformAdmin,
        }}
        showBilling={billingFor(session.user.email).open}
        reviewAccess={hasReviewAccess(session.role)}
        mayExport={mayExport(session)}
        portalOpen={!mustOrder}
        // Only someone who can walk is pointed back to the walkthrough, and every time (Simon,
        // 04.10.2026): for a grandfathered account it is locked, and the journey is what it has.
        journeyNotice={mayWalkDurchgang(session.accessLevel, platformAdmin)}
      />
      <SidebarInset>
        <PortalHeader
          home="walkthrough"
          guide={{
            hints: session.hints,
            calLink: env.CAL_LINK,
            supportEmail: env.SUPPORT_EMAIL,
          }}
        />
        <div className="flex-1 px-6 py-6">{children}</div>
      </SidebarInset>
      <AdminTestPanel />
    </SidebarProvider>
  );
}
