"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Copy, UserMinus, UserPlus, X, Check } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { ALL_ROLE_KEYS, type RoleKey } from "@/lib/compliance/role-keys";
import { ROLE_HIERARCHY } from "@/lib/compliance/role-mapping";

interface CategoryInfo {
  categoryCode: string;
  categoryName: string;
}

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  jobTitle: string | null;
  createdAt: Date;
  assignments: CategoryInfo[];
}

interface Invite {
  id: string;
  email: string;
  token: string;
  role: string;
  status: string;
  expiresAt: Date;
  createdAt: Date;
}

interface Props {
  members: Member[];
  invites: Invite[];
  currentUserId: string;
  isAdmin: boolean;
}

export function TeamPage({ members, invites, currentUserId, isAdmin }: Props) {
  return (
    <div className="space-y-6">
      <MembersCard
        members={members}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
      />
      {isAdmin && <InvitesCard invites={invites} />}
      {isAdmin && <InviteForm />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Members
// ---------------------------------------------------------------------------

function MembersCard({
  members,
  currentUserId,
  isAdmin,
}: {
  members: Member[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const t = useTranslations("team");

  // Sort by role hierarchy (users with compliance roles first, then unassigned)
  const sortedMembers = [...members].sort((a, b) => {
    const aOrder = a.jobTitle && a.jobTitle in ROLE_HIERARCHY
      ? ROLE_HIERARCHY[a.jobTitle as RoleKey] : 100;
    const bOrder = b.jobTitle && b.jobTitle in ROLE_HIERARCHY
      ? ROLE_HIERARCHY[b.jobTitle as RoleKey] : 100;
    return aOrder - bOrder;
  });

  const removeMutation = trpc.team.removeMember.useMutation({
    onSuccess: () => {
      toast.success(t("remove.success"));
      router.refresh();
    },
    onError: (err) => toast.error(err.message),
  });

  const assignRoleMutation = trpc.team.assignRole.useMutation({
    onSuccess: (data) => {
      if (data.assigned === 0) {
        toast.info(t("assignRole.noCategories"));
      } else {
        toast.success(t("assignRole.success"));
      }
      router.refresh();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("members.title")}</CardTitle>
        <CardDescription>
          {t("members.description", { count: members.length })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("members.name")}</TableHead>
              <TableHead>{t("members.email")}</TableHead>
              <TableHead>{t("members.role")}</TableHead>
              <TableHead>{t("members.assignedCategories")}</TableHead>
              {isAdmin && <TableHead>{t("members.complianceRole")}</TableHead>}
              {isAdmin && <TableHead className="w-24" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedMembers.map((m) => (
              <TableRow key={m.id}>
                <TableCell>
                  <div className="space-y-0.5">
                    <span className="font-medium">{m.name}</span>
                    {m.jobTitle && (
                      <p className="text-xs text-muted-foreground">
                        {t(`roles.${m.jobTitle}`, { defaultMessage: m.jobTitle })}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {m.email}
                </TableCell>
                <TableCell>
                  <Badge variant={m.role === "admin" ? "default" : "secondary"}>
                    {m.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  {m.assignments.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {m.assignments.map((a) => (
                        <Badge key={a.categoryCode} variant="outline" className="text-xs">
                          {a.categoryCode}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                {isAdmin && (
                  <TableCell>
                    <Select
                      value={m.jobTitle ?? ""}
                      onValueChange={(roleKey) =>
                        assignRoleMutation.mutate({
                          userId: m.id,
                          roleKey: roleKey as RoleKey,
                        })
                      }
                      disabled={assignRoleMutation.isPending}
                    >
                      <SelectTrigger size="sm" className="w-48">
                        <SelectValue placeholder={t("assignRole.placeholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_ROLE_KEYS.map((key) => (
                          <SelectItem key={key} value={key}>
                            {t(`roles.${key}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                )}
                {isAdmin && (
                  <TableCell>
                    {m.id === currentUserId ? (
                      <span className="text-xs text-muted-foreground">
                        {t("members.you")}
                      </span>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={removeMutation.isPending}
                        onClick={() =>
                          removeMutation.mutate({ userId: m.id })
                        }
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Pending Invites
// ---------------------------------------------------------------------------

function InvitesCard({ invites }: { invites: Invite[] }) {
  const router = useRouter();
  const t = useTranslations("team");

  const revokeMutation = trpc.team.revokeInvite.useMutation({
    onSuccess: () => {
      toast.success(t("revoke.success"));
      router.refresh();
    },
    onError: (err) => toast.error(err.message),
  });

  if (invites.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("invites.title")}</CardTitle>
        <CardDescription>
          {t("invites.description", { count: invites.length })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("invites.email")}</TableHead>
              <TableHead>{t("invites.expires")}</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {invites.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="font-medium">{inv.email}</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(inv.expiresAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const url = `${window.location.origin}/invite/${inv.token}`;
                        navigator.clipboard.writeText(url);
                        toast.success(t("invites.linkCopied"));
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={revokeMutation.isPending}
                      onClick={() =>
                        revokeMutation.mutate({ inviteId: inv.id })
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Invite Form
// ---------------------------------------------------------------------------

function InviteForm() {
  const router = useRouter();
  const t = useTranslations("team");
  const [email, setEmail] = useState("");
  const [complianceRole, setComplianceRole] = useState<RoleKey | undefined>();
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const inviteMutation = trpc.team.invite.useMutation({
    onSuccess: (data) => {
      setInviteUrl(data.inviteUrl);
      setEmail("");
      setComplianceRole(undefined);
      router.refresh();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setInviteUrl(null);
    inviteMutation.mutate({
      email: email.trim(),
      complianceRole,
    });
  };

  const handleCopy = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
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
          <div className="flex gap-2">
            <div className="flex-1 space-y-1.5">
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
            {inviteMutation.isPending
              ? t("invite.submitting")
              : t("invite.submit")}
          </Button>
        </form>

        {inviteUrl && (
          <div className="mt-4 flex items-center gap-2 rounded-md border bg-muted/50 p-3">
            <code className="flex-1 truncate text-sm">{inviteUrl}</code>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
