"use client";

/**
 * The team page's invites: the open ones, each saying whether its link still works, and the form
 * that sends a new one.
 */
import { Check, Clock, Copy, Send, UserPlus, X } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "@/i18n/navigation";
import { ALL_ROLE_KEYS, type RoleKey } from "@/lib/compliance/role-keys";
import { INVITE_EXPIRY_DAYS } from "@/lib/organization/invite-state";
import { trpc } from "@/lib/trpc/client";
import { userFacingError } from "@/lib/trpc/error-message";

export interface Invite {
  id: string;
  email: string;
  inviteUrl: string;
  expiresAt: Date;
  expired: boolean;
  role: RoleKey | null;
}

/** Expiry is a moment; the page names its calendar day where the company works. */
const DAY_FORMAT = { dateStyle: "medium", timeZone: "Europe/Berlin" } as const;

export function InvitesCard({ invites }: { invites: Invite[] }) {
  const router = useRouter();
  const t = useTranslations("team");
  const tc = useTranslations("common");
  const format = useFormatter();

  const revokeMutation = trpc.team.revokeInvite.useMutation({
    onSuccess: () => {
      toast.success(t("revoke.success"));
      router.refresh();
    },
    onError: (err) => toast.error(userFacingError(err, tc("actionFailed"))),
  });

  const resendMutation = trpc.team.resendInvite.useMutation({
    onError: (err) => toast.error(userFacingError(err, tc("actionFailed"))),
  });

  const resend = (invite: Invite) =>
    resendMutation.mutate(
      { inviteId: invite.id },
      {
        onSuccess: (data) => {
          if (data.emailed) {
            toast.success(
              t("invites.resent", { email: invite.email, days: INVITE_EXPIRY_DAYS }),
            );
          } else {
            toast.warning(t("invites.resentNotEmailed", { email: invite.email }));
          }
          router.refresh();
        },
      },
    );

  const copyLink = (invite: Invite) => {
    navigator.clipboard.writeText(invite.inviteUrl);
    toast.success(t("invites.linkCopied"));
  };

  if (invites.length === 0) return null;

  return (
    <Card className="@container">
      <CardHeader>
        <CardTitle>{t("invites.title")}</CardTitle>
        <CardDescription>
          {t("invites.description", { count: invites.length })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y" data-testid="team-invites">
          {invites.map((inv) => {
            const day = format.dateTime(new Date(inv.expiresAt), DAY_FORMAT);
            return (
              <li
                key={inv.id}
                data-testid="team-invite"
                data-email={inv.email}
                className="flex flex-col gap-2 py-3 @xl:flex-row @xl:items-center @xl:justify-between @xl:gap-4"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="break-all font-medium">{inv.email}</p>
                  {inv.role && (
                    <p className="text-xs text-muted-foreground">
                      {t(`roles.${inv.role}`)}
                    </p>
                  )}
                  {inv.expired ? (
                    <p className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400">
                      <Clock className="size-3.5 shrink-0" />
                      {t("invites.expiredOn", { date: day })}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {t("invites.validUntil", { date: day })}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {/* An expired link opens nothing, so it is not offered for copying. */}
                  {!inv.expired && (
                    <Button variant="ghost" size="sm" onClick={() => copyLink(inv)}>
                      <Copy />
                      {t("invites.copyLink")}
                    </Button>
                  )}
                  <Button
                    variant={inv.expired ? "outline" : "ghost"}
                    size="sm"
                    disabled={resendMutation.isPending}
                    onClick={() => resend(inv)}
                  >
                    <Send />
                    {t("invites.sendAgain")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={revokeMutation.isPending}
                    onClick={() => revokeMutation.mutate({ inviteId: inv.id })}
                  >
                    <X />
                    {t("invites.withdraw")}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

interface SentInvite {
  readonly email: string;
  readonly url: string;
  readonly emailed: boolean;
}

export function InviteForm() {
  const router = useRouter();
  const t = useTranslations("team");
  const tc = useTranslations("common");
  const [email, setEmail] = useState("");
  const [complianceRole, setComplianceRole] = useState<RoleKey | undefined>();
  const [sent, setSent] = useState<SentInvite | null>(null);
  const [copied, setCopied] = useState(false);

  const inviteMutation = trpc.team.invite.useMutation({
    onSuccess: (data, variables) => {
      setSent({ email: variables.email, url: data.inviteUrl, emailed: data.emailed });
      setEmail("");
      setComplianceRole(undefined);
      router.refresh();
    },
    onError: (err) => toast.error(userFacingError(err, tc("actionFailed"))),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSent(null);
    inviteMutation.mutate({
      email: email.trim(),
      complianceRole,
    });
  };

  const handleCopy = () => {
    if (!sent) return;
    navigator.clipboard.writeText(sent.url);
    setCopied(true);
    toast.success(t("invites.linkCopied"));
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("invite.title")}</CardTitle>
        <CardDescription>{t("invite.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <div className="min-w-48 flex-1 space-y-1.5">
              <Label htmlFor="invite-email">{t("invite.email")}</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder={t("invite.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="w-56 space-y-1.5">
              <Label>{t("invite.complianceRole")}</Label>
              <Select
                value={complianceRole ?? ""}
                onValueChange={(v) =>
                  setComplianceRole(v === "" ? undefined : (v as RoleKey))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("invite.complianceRolePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {ALL_ROLE_KEYS.map((key) => (
                    <SelectItem key={key} value={key}>
                      {t(`roles.${key}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" disabled={inviteMutation.isPending}>
            <UserPlus className="mr-2 h-4 w-4" />
            {inviteMutation.isPending ? t("invite.submitting") : t("invite.submit")}
          </Button>
        </form>

        {sent && (
          <div className="mt-4 space-y-2" data-testid="invite-result">
            <p
              className={
                sent.emailed
                  ? "text-sm text-muted-foreground"
                  : "text-sm text-amber-700 dark:text-amber-400"
              }
            >
              {sent.emailed
                ? t("invite.sent", { email: sent.email })
                : t("invite.notEmailed", { email: sent.email })}
            </p>
            <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-3">
              <code className="flex-1 truncate text-sm">{sent.url}</code>
              <Button
                variant="outline"
                size="sm"
                aria-label={t("invites.copyLink")}
                onClick={handleCopy}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
