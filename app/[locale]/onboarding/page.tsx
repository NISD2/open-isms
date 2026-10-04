import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { CompanySetup } from "@/components/organization/CompanySetup";
import { getSession } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { mayWalkDurchgang } from "@/lib/billing/access";
import { ALL_ROLE_KEYS, getCategoriesByRole } from "@/lib/compliance/role-mapping";
import { db } from "@/lib/db";
import { WALK } from "@/lib/durchgang";
import { getCategoryName, getComplianceMessages } from "@/lib/messages";
import { walkthroughLive } from "@/lib/walkthrough";

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) redirect("/auth/signin");
  // A draft company (auto-provisioned at email verification) is expected here —
  // this wizard fills in the real identity and activates it. Only an already
  // activated company skips onboarding.
  if (session.companyActivated) redirect("/dashboard");

  // Once the walkthrough is the portal's front, the company is set up with the
  // walk's three essentials, here too: the journey's "Einrichten" and links
  // already sent lead here, and a grandfathered account needs a set-up company
  // for its journey. Then on into what the account has: the walk's first item
  // for one that may walk, the journey for any other.
  if (await walkthroughLive(session.user.email)) {
    const mayWalk = mayWalkDurchgang(
      session.accessLevel,
      isPlatformAdmin(session.user.email),
    );
    const first = WALK[0]?.code;
    return (
      <main className="px-6 py-12">
        <CompanySetup
          next={
            mayWalk && first
              ? { pathname: "/durchgang/nis2/[code]", params: { code: first } }
              : "/journey"
          }
        />
      </main>
    );
  }

  // What each role takes on, named the way the rest of the app names it.
  // Resolved here rather than in the form so the client component does not
  // have to carry the framework catalogue or a slug-to-code lookup.
  const [categoriesByRole, compliance] = await Promise.all([
    getCategoriesByRole(db),
    getLocale().then(getComplianceMessages),
  ]);
  const roleAreas: Record<string, string[]> = Object.fromEntries(
    ALL_ROLE_KEYS.map((key) => [
      key,
      (categoriesByRole[key] ?? []).map((c) => getCategoryName(compliance, c.code)),
    ]),
  );

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <OnboardingFlow roleAreas={roleAreas} />
    </main>
  );
}
