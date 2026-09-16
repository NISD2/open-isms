import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { OnboardingBanner } from "@/components/dashboard/OnboardingBanner";
import { AdminTestPanel } from "@/components/portal/AdminTestPanel";
import { AppSidebar, type FrameworkGroup } from "@/components/portal/AppSidebar";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getSession } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import {
  type CategoryInfo,
  canSeeCategory,
  getAllActiveCategories,
  getUserAccess,
  myRequirementCount,
} from "@/lib/compliance/access";
import { env } from "@/lib/env";
import {
  type ComplianceMessages,
  getCategoryName,
  getComplianceMessages,
} from "@/lib/messages";
import { api } from "@/lib/trpc/server";

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

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/auth/signin");

  // Always load framework structure so the sidebar shows NIS2 / GDPR groups
  // even before the user has set up their company. Pre-onboarding the
  // category links work as a preview — clicking lands on the onboarding banner.
  const [allFrameworks, compliance, assessments] = await Promise.all([
    getAllActiveCategories(),
    getLocale().then(getComplianceMessages),
    session.companyId ? api.assessment.listAssessments() : [],
  ]);

  const frameworks: FrameworkGroup[] = await Promise.all(
    [...allFrameworks.entries()].map(([code, { framework, categories }]) => {
      const assessment = assessments.find((a) => a.framework?.code === code);
      return Promise.all([
        assessment ? getUserAccess(assessment.id, session.user.id, session.role) : null,
        assessment
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

  // Routes a not-yet-activated user (no company, or a draft shell
  // auto-provisioned at verification) may reach without the activation banner.
  // /journey is here: it is the draft's home surface, rendering the seeded path
  // with a "set up your organization" first step. Every other real-work route
  // steers the draft to activation. /team is intentionally absent — a draft must
  // not manage a team before activating. Gating on companyActivated (not merely
  // companyId) is what makes a draft see the banner here instead of an empty,
  // 403-on-write shell.
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "";
  const ALLOWED_WITHOUT_COMPANY = [
    "/dashboard",
    "/journey",
    "/organization",
    "/audit",
    "/notifications",
    "/settings",
    "/gap-assessment",
  ];
  const needsCompany = !ALLOWED_WITHOUT_COMPANY.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  const showOnboarding = !session.companyActivated && needsCompany;

  return (
    <SidebarProvider defaultOpen>
      <AppSidebar
        user={{
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          isPlatformAdmin: isPlatformAdmin(session.user.email),
        }}
        frameworks={frameworks}
      />
      <SidebarInset>
        <PortalHeader
          guide={{
            hints: session.hints,
            calLink: env.CAL_LINK,
            supportEmail: env.SUPPORT_EMAIL,
          }}
        />
        <div className="flex-1 px-6 py-6">
          {showOnboarding ? <OnboardingBanner /> : children}
        </div>
      </SidebarInset>
      <AdminTestPanel />
    </SidebarProvider>
  );
}
