import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { api } from "@/lib/trpc/server";
import { SupplierInviteAcceptForm } from "@/components/supplier-portal/SupplierInviteAcceptForm";

/**
 * Direction-B landing page — supplier opens this link from their email.
 *
 * Flow:
 *   1. Supplier clicks the magic link in their inbox → lands here
 *   2. If not signed in → redirect to /auth/signin (cookie-bound, will return)
 *   3. If signed in but already a member of a company → tell them their
 *      account already has a company; they need a fresh email to accept
 *   4. If signed in fresh → show the accept form, prefill toEmail, on submit
 *      call supplierPortal.onboarding.acceptInvite which bootstraps the
 *      supplier company AND auto-binds it to the inviting entity
 *
 * The token is the credential. Token expiry is 30 days.
 */
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Accept supplier invite",
    robots: { index: false, follow: false },
  };
}

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function SupplierInvitePage({ params }: PageProps) {
  const { token } = await params;
  const session = await getSession();
  if (!session) {
    redirect(`/auth/signin?callbackUrl=/supplier-invite/${token}`);
  }

  // Look up the invite to display the inviting entity name + pre-filled email.
  const invite = await api.supplierPortal.onboarding.getInviteByToken({ token });
  if (!invite) notFound();

  const userEmail = session.user.email?.toLowerCase() ?? "";
  const emailMatch = userEmail === invite.toEmail.toLowerCase();

  // If the user already has an ACTIVATED company, they can't accept this invite
  // under their current account. A draft shell (auto-provisioned at
  // verification) is fine — the accept handler discards it. Server-side accept
  // enforces the same; this is the user-friendly preview.
  const alreadyHasCompany = session.companyActivated;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 px-4 py-10">
      <div className="w-full max-w-md">
        <SupplierInviteAcceptForm
          token={token}
          fromCompanyName={invite.fromCompanyName}
          toEmail={invite.toEmail}
          message={invite.message}
          emailMatch={emailMatch}
          alreadyHasCompany={alreadyHasCompany}
          signedInAs={userEmail}
        />
      </div>
    </div>
  );
}
