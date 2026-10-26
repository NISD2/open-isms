import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { InviteNotHere } from "@/components/supplier-portal/InviteNotHere";
import { SupplierInviteAcceptForm } from "@/components/supplier-portal/SupplierInviteAcceptForm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { listUserCompanies } from "@/lib/organization/membership";
import { api } from "@/lib/trpc/server";

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
 * A token no invite here carries mostly comes from a self-hosted install, whose
 * invite link forwards to this page while the invite stays in its database.
 * Instead of a 404, the supplier learns why and how to share its answers anyway.
 *
 * The token is the credential. Token expiry is 30 days.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("supplierInvite");
  return {
    title: t("metaTitle"),
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
  if (invite.state === "closed") notFound();

  const userEmail = session.user.email?.toLowerCase() ?? "";

  // If the user already has an ACTIVATED company, whichever one is open, they
  // can't accept this invite under their current account. A draft shell
  // (auto-provisioned at verification) is fine — the accept handler discards
  // it. Server-side accept enforces the same; this is the user-friendly preview.
  const alreadyHasCompany = (await listUserCompanies(db, session.user.id)).some(
    (c) => c.activatedAt !== null,
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 px-4 py-10">
      <div className="w-full max-w-md">
        {invite.state === "unknown" ? (
          <InviteNotHere />
        ) : (
          <SupplierInviteAcceptForm
            token={token}
            fromCompanyName={invite.fromCompanyName}
            toEmail={invite.toEmail}
            message={invite.message}
            emailMatch={userEmail === invite.toEmail.toLowerCase()}
            alreadyHasCompany={alreadyHasCompany}
            signedInAs={userEmail}
          />
        )}
      </div>
    </div>
  );
}
