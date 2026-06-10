import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { companyInvite, company } from "@/schema";
import { getSession } from "@/lib/auth";
import { AcceptInviteCard } from "@/components/invite/AcceptInviteCard";
import { getTranslations } from "next-intl/server";

interface Props {
  params: Promise<{ token: string }>;
}

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

  if (!invite) {
    return (
      <CenteredCard
        title={t("invalidTitle")}
        description={t("invalidDescription")}
      />
    );
  }

  if (invite.status !== "pending") {
    return (
      <CenteredCard
        title={t("usedTitle")}
        description={t("usedDescription")}
      />
    );
  }

  if (invite.expiresAt < new Date()) {
    return (
      <CenteredCard
        title={t("expiredTitle")}
        description={t("expiredDescription")}
      />
    );
  }

  const session = await getSession();

  return (
    <AcceptInviteCard
      token={token}
      inviteEmail={invite.email}
      companyName={invite.company.name}
      role={invite.role}
      redirectPath={invite.redirectPath}
      userEmail={session?.user.email ?? null}
      hasCompany={!!session?.companyId}
      isSignedIn={!!session}
    />
  );
}

function CenteredCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border bg-card p-6 text-center shadow-sm">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
