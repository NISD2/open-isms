import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar, type FrameworkGroup } from "@/components/portal/AppSidebar";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { AdminTestPanel } from "@/components/portal/AdminTestPanel";
import { OnboardingBanner } from "@/components/dashboard/OnboardingBanner";
import { getSession } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { api } from "@/lib/trpc/server";
import {
  getAllActiveCategories,
  getUserAccess,
  canSeeCategory,
  myRequirementCount,
  type CategoryInfo,
} from "@/lib/compliance/access";
import complianceEn from "@/messages/compliance/en.json";

/** Map sortOrder ranges to i18n phase keys.
 * REG(0) | GOV(1) RSK(2) SUP(3) | CRY(4) ACC(5) AUT(6) | PRO(7) INC(8) BCP(9) | TRN(10) EFF(11) */
function phaseForSortOrder(sortOrder: number): string {
  if (sortOrder <= 0) return "phaseRegistration";
  if (sortOrder <= 3) return "phaseFoundation";
  if (sortOrder <= 6) return "phaseControls";
  if (sortOrder <= 9) return "phaseOperations";
  if (sortOrder <= 11) return "phaseVerification";
  return "phaseAdmin";
}

function buildSteps(
  categories: CategoryInfo[],
  access: Awaited<ReturnType<typeof getUserAccess>> | null,
  progress: Record<string, { completed: number; total: number }>,
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
        name: complianceEn.compliance.categories[cat.code as keyof typeof complianceEn.compliance.categories]?.name ?? cat.code,
        phase: phaseForSortOrder(cat.sortOrder),
        requirementCount: reqCount,
        completedCount: Math.min(progress[cat.id]?.completed ?? 0, reqCount),
        requirements: cat.requirements.map((r) => r.code),
      };
    });
}

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/auth/signin");

  // Always load framework structure so the sidebar shows NIS2 / GDPR groups
  // even before the user has set up their company. Pre-onboarding the
  // category links work as a preview — clicking lands on the onboarding banner.
  const allFrameworks = await getAllActiveCategories();
  const assessments = session.companyId
    ? await api.assessment.listAssessments()
    : [];

  const frameworks: FrameworkGroup[] = await Promise.all(
    [...allFrameworks.entries()].map(([code, { framework, categories }]) => {
      const assessment = assessments.find((a) => a.framework?.code === code);
      return Promise.all([
        assessment
          ? getUserAccess(assessment.id, session.user.id, session.role)
          : null,
        assessment
          ? api.assessment.getProgressByCategory({ assessmentId: assessment.id })
          : ({} as Record<string, { completed: number; total: number }>),
        assessment
          ? api.assessment.getBlockedRequirements({ assessmentId: assessment.id })
          : ({} as Record<string, string[]>),
      ]).then(([access, progress, blocked]) => {
        const steps = buildSteps(categories, access, progress);
        return {
          code,
          label: framework.sidebarLabel ?? code,
          codePrefix: framework.codePrefix ?? "",
          steps,
          completed: steps.reduce((s, x) => s + x.completedCount, 0),
          total: steps.reduce((s, x) => s + x.requirementCount, 0),
          blockedRequirements: blocked,
        } satisfies FrameworkGroup;
      });
    }),
  );

  // Pages that work without a company
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "";
  const ALLOWED_WITHOUT_COMPANY = ["/dashboard", "/team", "/organization", "/audit", "/notifications", "/settings", "/gap-assessment"];
  const needsCompany = !ALLOWED_WITHOUT_COMPANY.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  const showOnboarding = !session.companyId && needsCompany;

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
        <PortalHeader />
        <div className="flex-1 px-6 py-6">
          {showOnboarding ? <OnboardingBanner /> : children}
        </div>
      </SidebarInset>
      <AdminTestPanel />
    </SidebarProvider>
  );
}
