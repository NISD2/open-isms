import { eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { AcceptInviteCard } from "@/components/invite/AcceptInviteCard";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { inviteRedirectPath } from "@/lib/organization/invite-redirect";
import { inviteLinkState } from "@/lib/organization/invite-state";
import { asMembershipRole } from "@/lib/organization/membership";
import { companyInvite } from "@/schema";
import { invitedRoleOf } from "@/server/trpc/helpers/company-invite";

interface Props {
  params: Promise<{ token: string }>;
}

// Open without a session, and the token in its address is the credential: never a search result.
export const metadata = { robots: { index: false, follow: false } };

export default async function InvitePage({ params }: Props) {
  const { token } = await params;
  const t = await getTranslations("team");

  // Direct DB query — no auth required to view the invite page
  const invite = await db.query.companyInvite.findFirst({
    where: eq(companyInvite.token, token),
    with: {
      company: { columns: { id: true, name: true } },
    },
  });

  const state = inviteLinkState(invite, new Date());
  if (!invite || state !== "open") {
    const [title, description] =
      state === "accepted"
        ? [
            t("acceptedTitle"),
            t("acceptedDescription", { company: invite?.company.name ?? "" }),
          ]
        : state === "revoked"
          ? [t("revokedTitle"), t("revokedDescription")]
          : state === "expired"
            ? [t("expiredTitle"), t("expiredDescription")]
            : [t("invalidTitle"), t("invalidDescription")];
    return <CenteredCard title={title} description={description} />;
  }

  const session = await getSession();
  // The compliance role the person was invited for names the invite better than the access role,
  // which is "member" for every invite sent today.
  const complianceRole = invitedRoleOf(invite.assignmentContext);
  const roleLabel = complianceRole
    ? t(`roles.${complianceRole}`)
    : t(`memberRole.${asMembershipRole(invite.role) ?? "member"}`);

  return (
    <AcceptInviteCard
      token={token}
      inviteEmail={invite.email}
      companyName={invite.company.name}
      roleLabel={roleLabel}
      redirectPath={inviteRedirectPath(invite.redirectPath)}
      userEmail={session?.user.email ?? null}
      isSignedIn={!!session}
    />
  );
}

function CenteredCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border bg-card p-6 text-center shadow-sm">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
