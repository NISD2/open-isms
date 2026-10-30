"use client";

import { Shield, UserPlus } from "lucide-react";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link, useRouter } from "@/i18n/navigation";
import { trpc } from "@/lib/trpc/client";
import { userFacingError } from "@/lib/trpc/error-message";

interface Props {
  token: string;
  inviteEmail: string;
  companyName: string;
  /** The role the person is invited as, already in the reader's language. */
  roleLabel: string;
  /** Already checked to be a same-origin path (lib/organization/invite-redirect.ts). */
  redirectPath: string;
  userEmail: string | null;
  isSignedIn: boolean;
}

export function AcceptInviteCard({
  token,
  inviteEmail,
  companyName,
  roleLabel,
  redirectPath,
  userEmail,
  isSignedIn,
}: Props) {
  const t = useTranslations("team");
  const tc = useTranslations("common");
  const router = useRouter();
  const [accepting, setAccepting] = useState(false);

  const acceptMutation = trpc.team.acceptInvite.useMutation({
    onSuccess: () => {
      toast.success(t("accept.joined", { company: companyName }));
      router.push(redirectPath as never);
      router.refresh();
    },
    onError: (err) => {
      toast.error(userFacingError(err, tc("actionFailed")));
      setAccepting(false);
    },
  });

  const handleAccept = () => {
    setAccepting(true);
    acceptMutation.mutate({ token });
  };

  // Case 1: Not signed in. Most people opening an invite have no account yet, so creating one
  // comes first, with the invited address filled in: an account under any other address cannot
  // accept it. The callbackUrl returns the person to /invite/[token] after either way in.
  if (!isSignedIn) {
    const query = { callbackUrl: `/invite/${token}`, email: inviteEmail };
    return (
      <CenteredCard
        title={t("accept.joinTitle", { company: companyName })}
        description={t("accept.signInDescription", { role: roleLabel })}
      >
        <p className="mb-4 text-center text-sm">
          {t("accept.forAddress", { email: inviteEmail })}
        </p>
        <div className="space-y-2">
          <Button asChild className="w-full" size="lg">
            <Link
              href={
                {
                  pathname: "/auth/signin",
                  query: { ...query, mode: "register" },
                } as never
              }
            >
              {t("accept.createAccount")}
            </Link>
          </Button>
          <Button asChild className="w-full" size="lg" variant="outline">
            <Link href={{ pathname: "/auth/signin", query } as never}>
              {t("accept.haveAccount")}
            </Link>
          </Button>
        </div>
      </CenteredCard>
    );
  }

  // Case 2: Email mismatch
  if (userEmail?.toLowerCase() !== inviteEmail.toLowerCase()) {
    return (
      <CenteredCard
        title={t("accept.wrongAccountTitle")}
        description={t("accept.wrongAccountDescription", {
          inviteEmail,
          userEmail: userEmail ?? "",
        })}
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

  // Case 3: Email matches — accept
  return (
    <CenteredCard
      title={t("accept.joinTitle", { company: companyName })}
      description={t("accept.joinDescription", { role: roleLabel })}
    >
      <Button className="w-full" size="lg" disabled={accepting} onClick={handleAccept}>
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
