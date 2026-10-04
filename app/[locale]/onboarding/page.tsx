import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { getSession } from "@/lib/auth";
import { ALL_ROLE_KEYS, getCategoriesByRole } from "@/lib/compliance/role-mapping";
import { db } from "@/lib/db";
import { getCategoryName, getComplianceMessages } from "@/lib/messages";
import { walkthroughLive } from "@/lib/walkthrough";

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) redirect("/auth/signin");
  // A draft company (auto-provisioned at email verification) is expected here —
  // this wizard fills in the real identity and activates it. Only an already
  // activated company skips onboarding. Once the walkthrough is the portal's
  // front, its first step sets the company up, so links already sent here go to
  // the portal's home.
  if (session.companyActivated || (await walkthroughLive(session.user.email))) {
    redirect("/dashboard");
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
