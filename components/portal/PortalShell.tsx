import type { Session } from "next-auth";
import { getLocale } from "next-intl/server";
import { AdminTestPanel } from "@/components/portal/AdminTestPanel";
import { AppSidebar, type FrameworkGroup } from "@/components/portal/AppSidebar";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { hasReviewAccess } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { mayWalkDurchgang } from "@/lib/billing/access";
import { billingFor } from "@/lib/billing/ordering-access";
import {
  type CategoryInfo,
  canSeeCategory,
  getAllActiveCategories,
  getUserAccess,
  myRequirementCount,
} from "@/lib/compliance/access";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import {
  type ComplianceMessages,
  getCategoryName,
  getComplianceMessages,
} from "@/lib/messages";
import { api } from "@/lib/trpc/server";
import { walkthroughLive } from "@/lib/walkthrough";

/** Map sortOrder ranges to i18n phase keys.
 * REG(0) | GOV(1) RSK(2) SUP(3) INC(4) | CRY(5) ACC(6) AUT(7) | PRO(8) BCP(9) | TRN(10) EFF(11)
 *
 * Incident handling sits in the foundation group, not with operations: the
 * plan and the reporting readiness are what you reach for the first time
 * something goes wrong, which can be any day after you are in scope. */
function phaseForSortOrder(sortOrder: number): string {
  if (sortOrder <= 0) return "phaseRegistration";
  if (sortOrder <= 4) return "phaseFoundation";
  if (sortOrder <= 7) return "phaseControls";
  if (sortOrder <= 9) return "phaseOperations";
  if (sortOrder <= 11) return "phaseVerification";
  return "phaseAdmin";
}

function buildSteps(
  categories: CategoryInfo[],
  access: Awaited<ReturnType<typeof getUserAccess>> | null,
  progress: Record<string, { completed: number; total: number }>,
  compliance: ComplianceMessages,
) {
  return categories
    .filter((cat) => !access || canSeeCategory(access, cat.id))
    .map((cat) => {
      const reqCount = access
        ? myRequirementCount(access, cat.id, cat.requirementCount)
        : cat.requirementCount;
      return {
        slug: cat.slug,
        code: cat.code,
        name: getCategoryName(compliance, cat.code),
        phase: phaseForSortOrder(cat.sortOrder),
        requirementCount: reqCount,
        completedCount: Math.min(progress[cat.id]?.completed ?? 0, reqCount),
        requirements: cat.requirements.map((r) => r.code),
      };
    });
}

/**
 * The framework trees for the sidebar. Always loaded in the journey's portal, so the sidebar shows
 * the NIS2 / GDPR groups even before the user has set up their company: pre-onboarding the
 * category links work as a preview, and clicking lands on the onboarding banner.
 */
async function sidebarFrameworks(
  session: Session,
  mustOrder: boolean,
): Promise<FrameworkGroup[]> {
  const [allFrameworks, compliance, assessments] = await Promise.all([
    getAllActiveCategories(),
    getLocale().then(getComplianceMessages),
    session.companyId ? api.assessment.listAssessments() : [],
  ]);

  return Promise.all(
    [...allFrameworks.entries()].map(([code, { framework, categories }]) => {
      const assessment = assessments.find((a) => a.framework?.code === code);
      return Promise.all([
        assessment ? getUserAccess(assessment.id, session.user.id, session.role) : null,
        assessment && !mustOrder
          ? api.assessment.getProgressByCategory({ assessmentId: assessment.id })
          : ({} as Record<string, { completed: number; total: number }>),
      ]).then(([access, progress]) => {
        const steps = buildSteps(categories, access, progress, compliance);
        return {
          code,
          label: framework.sidebarLabel ?? code,
          codePrefix: framework.codePrefix ?? "",
          steps,
          completed: steps.reduce((s, x) => s + x.completedCount, 0),
          total: steps.reduce((s, x) => s + x.requirementCount, 0),
        } satisfies FrameworkGroup;
      });
    }),
  );
}

/**
 * The compliance portal's frame: its sidebar, its header, and the page beside them. Gates (the
 * paywall, the activation banner) belong to the portal layout, not here, so the offer's own
 * layout draws the same frame without them.
 */
export async function PortalShell({
  session,
  children,
}: {
  session: Session;
  children: React.ReactNode;
}) {
  const mustOrder = session.accessLevel === "free";
  // Once the walkthrough is the portal's front, the framework tree leaves the sidebar: the walk
  // and the journey both lead to every item (Simon, 03.10.2026).
  const liveRead = walkthroughLive(session.user.email);
  const [live, frameworks, billing] = await Promise.all([
    liveRead,
    liveRead.then((on) => (on ? [] : sidebarFrameworks(session, mustOrder))),
    billingFor(db, session.user.email),
  ]);

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
        frameworks={frameworks}
        showBilling={billing.open}
        showAuditTrail={hasReviewAccess(session.role)}
        walkthroughLive={live}
        // An account that has not paid has no journey once the walkthrough is the front.
        showJourney={!mustOrder}
        // Only someone who can walk is pointed back to the walkthrough: for a grandfathered account
        // it is locked, and the journey is what it has.
        journeyNotice={
          live &&
          session.hints.journeyNotice &&
          mayWalkDurchgang(session.accessLevel, platformAdmin)
        }
      />
      <SidebarInset>
        <PortalHeader
          home={live ? "walkthrough" : "journey"}
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
