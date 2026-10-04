import { redirect } from "next/navigation";
import { CompanySetup } from "@/components/organization/CompanySetup";
import { getSession } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { mayWalkDurchgang } from "@/lib/billing/access";
import { WALK } from "@/lib/durchgang";

/**
 * Setting a company up, for links that lead here: the journey's "Einrichten", and links already
 * sent. It is the walk's three essentials (`CompanySetup`), as everywhere a company is set up;
 * a grandfathered account needs a set-up company for its journey. Then on into what the account
 * has: the walk's first item for one that may walk, the journey for any other. A company already
 * set up goes to the portal's home.
 */
export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) redirect("/auth/signin");
  if (session.companyActivated) redirect("/dashboard");

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
