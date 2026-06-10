import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { SupplierOnboardingForm } from "@/components/supplier-portal/SupplierOnboardingForm";

/**
 * Supplier-only onboarding page.
 *
 * Coequal entry point with /onboarding (entity portal). Reachable when a fresh
 * user lands on /portal/supplier without a company. Creates a supplier-only
 * company and redirects to /portal/supplier so they can fill the security
 * profile.
 *
 * No NIS2 sectors, no CISO question, no BSI registration. Most suppliers are
 * not directly regulated under NIS2 — the onboarding has to reflect that.
 */
export default async function SupplierOnboardingPage() {
  const session = await getSession();
  if (!session) redirect("/auth/signin");
  // If the user already has a company, send them straight to the profile.
  if (session.companyId) redirect("/portal/supplier");

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 px-4">
      <div className="w-full max-w-md">
        <SupplierOnboardingForm
          userName={session.user.name ?? session.user.email ?? "there"}
        />
      </div>
    </div>
  );
}
