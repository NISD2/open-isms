"use client";

import { useState } from "react";
import { useRouter, Link } from "@/i18n/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield, UserPlus } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface Props {
  token: string;
  inviteEmail: string;
  companyName: string;
  role: string;
  redirectPath?: string | null;
  userEmail: string | null;
  hasCompany: boolean;
  isSignedIn: boolean;
}

export function AcceptInviteCard({
  token,
  inviteEmail,
  companyName,
  role,
  redirectPath,
  userEmail,
  hasCompany,
  isSignedIn,
}: Props) {
  const t = useTranslations("team");
  const router = useRouter();
  const [accepting, setAccepting] = useState(false);

  const acceptMutation = trpc.team.acceptInvite.useMutation({
    onSuccess: () => {
      toast.success(t("accept.joined", { company: companyName }));
      router.push((redirectPath ?? "/") as never);
      router.refresh();
    },
    onError: (err) => {
      toast.error(err.message);
      setAccepting(false);
    },
  });

  const handleAccept = () => {
    setAccepting(true);
    acceptMutation.mutate({ token });
  };

  // Case 1: Not signed in. Route to the standard signin page, which exposes
  // both email/password and Google. The callbackUrl returns the user to
  // /invite/[token] so the invite is auto-resolved after auth.
  if (!isSignedIn) {
    const callbackUrl = `/invite/${token}`;
    return (
      <CenteredCard
        title={t("accept.joinTitle", { company: companyName })}
        description={t("accept.signInDescription", { role })}
      >
        <Button asChild className="w-full" size="lg">
          <Link
            href={
              {
                pathname: "/auth/signin",
                query: { callbackUrl },
              } as never
            }
          >
            {t("accept.signInToAccept")}
          </Link>
        </Button>
      </CenteredCard>
    );
  }

  // Case 2: Already in a company
  if (hasCompany) {
    return (
      <CenteredCard
        title={t("accept.alreadyMemberTitle")}
        description={t("accept.alreadyMemberDescription")}
      >
        <Button variant="outline" className="w-full" onClick={() => router.push("/dashboard")}>
          {t("accept.goToDashboard")}
        </Button>
      </CenteredCard>
    );
  }

  // Case 3: Email mismatch
  if (userEmail?.toLowerCase() !== inviteEmail.toLowerCase()) {
    return (
      <CenteredCard
        title={t("accept.wrongAccountTitle")}
        description={t("accept.wrongAccountDescription", { inviteEmail, userEmail: userEmail ?? "" })}
      >
        <Button
          className="w-full"
          variant="outline"
          onClick={() => signOut({ callbackUrl: `/invite/${token}` })}
        >
          {t("accept.signOutRetry")}
        </Button>
      </CenteredCard>
    );
  }

  // Case 4: Email matches — accept
  return (
    <CenteredCard
      title={t("accept.joinTitle", { company: companyName })}
      description={t("accept.joinDescription", { role })}
    >
      <Button
        className="w-full"
        size="lg"
        disabled={accepting}
        onClick={handleAccept}
      >
        <UserPlus className="mr-2 h-4 w-4" />
        {accepting ? t("accept.joining") : t("accept.acceptInvite")}
      </Button>
    </CenteredCard>
  );
}

function CenteredCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}
