import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { ALL_ROLE_KEYS, getSlugsForRole, type RoleKey } from "@/lib/compliance/role-mapping";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) redirect("/auth/signin");
  // A draft company (auto-provisioned at email verification) is expected here —
  // this wizard fills in the real identity and activates it. Only an already
  // activated company skips onboarding.
  if (session.companyActivated) redirect("/dashboard");

  // Build roleKey → category slugs map for TeamRolesForm badges
  const entries = await Promise.all(
    ALL_ROLE_KEYS.map(async (key) => {
      const slugs = await getSlugsForRole(db, key as RoleKey);
      return [key, slugs] as const;
    }),
  );
  const roleSlugMap: Record<string, string[]> = Object.fromEntries(entries);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <OnboardingFlow roleSlugMap={roleSlugMap} />
    </main>
  );
}
