"use client";

import { UserMinus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "@/i18n/navigation";
import { ALL_ROLE_KEYS, type RoleKey } from "@/lib/compliance/role-keys";
import { ROLE_HIERARCHY } from "@/lib/compliance/role-mapping";
import type { MembershipRole } from "@/lib/organization/membership";
import { trpc } from "@/lib/trpc/client";
import { userFacingError } from "@/lib/trpc/error-message";
import { OwnershipCard, type OwnershipState } from "./OwnershipCard";
import { type Invite, InviteForm, InvitesCard } from "./TeamInvites";

const MEMBERSHIP_ROLES: readonly MembershipRole[] = [
  "admin",
  "member",
  "reviewer",
  "legal_reviewer",
];

interface CategoryInfo {
  categoryCode: string;
  categoryName: string;
}

interface Member {
  id: string;
  name: string;
  email: string;
  role: MembershipRole;
  jobTitle: string | null;
  createdAt: Date;
  isOwner: boolean;
  assignments: CategoryInfo[];
}

interface Props {
  members: Member[];
  invites: Invite[];
  currentUserId: string;
  isAdmin: boolean;
  ownership: OwnershipState;
}

export function TeamPage({ members, invites, currentUserId, isAdmin, ownership }: Props) {
  // A handover waiting for this person is the one thing on the page they have to act on.
  const offered = ownership.pending?.toUserId === currentUserId;
  const ownershipCard = (
    <OwnershipCard state={ownership} members={members} currentUserId={currentUserId} />
  );
  return (
    <div className="space-y-6">
      {offered && ownershipCard}
      <MembersCard members={members} currentUserId={currentUserId} isAdmin={isAdmin} />
      {isAdmin && !offered && ownershipCard}
      {isAdmin && <InvitesCard invites={invites} />}
      {isAdmin && <InviteForm />}
    </div>
  );
}

/*
 * Columns only where the card is wide enough for all of them; narrower, each member stacks. The
 * list never scrolls sideways, so the remove action is always on screen. Measured on the card, not
 * the window, because the portal sidebar takes a varying share of the window.
 */
const ADMIN_COLUMNS = "@3xl:grid-cols-[minmax(0,1fr)_9rem_14rem_7rem]";
const MEMBER_COLUMNS = "@3xl:grid-cols-[minmax(0,1fr)_9rem]";

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
  const tc = useTranslations("common");
  // Kept after the dialog closes, so its text does not empty out while it fades.
  const [target, setTarget] = useState<Member | null>(null);
  const [confirming, setConfirming] = useState(false);

  // Sort by role hierarchy (users with compliance roles first, then unassigned)
  const sortedMembers = [...members].sort((a, b) => {
    const aOrder =
      a.jobTitle && a.jobTitle in ROLE_HIERARCHY
        ? ROLE_HIERARCHY[a.jobTitle as RoleKey]
        : 100;
    const bOrder =
      b.jobTitle && b.jobTitle in ROLE_HIERARCHY
        ? ROLE_HIERARCHY[b.jobTitle as RoleKey]
        : 100;
    return aOrder - bOrder;
  });

  const removeMutation = trpc.team.removeMember.useMutation({
    onSuccess: () => {
      toast.success(t("remove.success"));
      router.refresh();
    },
    onError: (err) => toast.error(userFacingError(err, tc("actionFailed"))),
  });

  const setMemberRoleMutation = trpc.team.setMemberRole.useMutation({
    onSuccess: () => {
      toast.success(t("memberRole.success"));
      router.refresh();
    },
    onError: (err) => toast.error(userFacingError(err, tc("actionFailed"))),
  });

  // The owner always stays an admin and there is always at least one, as the server enforces.
  const adminCount = members.filter((m) => m.role === "admin").length;

  const assignRoleMutation = trpc.team.assignRole.useMutation({
    onSuccess: (data) => {
      if (data.assigned === 0) {
        toast.info(t("assignRole.noCategories"));
      } else {
        toast.success(t("assignRole.success"));
      }
      router.refresh();
    },
    onError: (err) => toast.error(userFacingError(err, tc("actionFailed"))),
  });

  const columns = isAdmin ? ADMIN_COLUMNS : MEMBER_COLUMNS;

  return (
    <Card className="@container">
      <CardHeader>
        <CardTitle>{t("members.title")}</CardTitle>
        <CardDescription>
          {t("members.description", { count: members.length })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          aria-hidden
          className={`hidden gap-4 border-b pb-2 text-xs font-medium text-muted-foreground @3xl:grid ${columns}`}
        >
          <span>{t("members.member")}</span>
          <span>{t("members.role")}</span>
          {isAdmin && <span>{t("members.complianceRole")}</span>}
        </div>
        <ul className="divide-y" data-testid="team-members">
          {sortedMembers.map((m) => (
            <li
              key={m.id}
              data-testid="team-member"
              data-email={m.email}
              className={`grid gap-3 py-3 @3xl:items-center @3xl:gap-4 ${columns}`}
            >
              <MemberIdentity member={m} />

              <div className="space-y-1">
                <p aria-hidden className="text-xs text-muted-foreground @3xl:hidden">
                  {t("members.role")}
                </p>
                {isAdmin ? (
                  <Select
                    value={m.role}
                    onValueChange={(role) =>
                      setMemberRoleMutation.mutate({
                        userId: m.id,
                        role: role as MembershipRole,
                      })
                    }
                    disabled={
                      setMemberRoleMutation.isPending ||
                      m.isOwner ||
                      (m.role === "admin" && adminCount <= 1)
                    }
                  >
                    <SelectTrigger
                      size="sm"
                      className="w-36"
                      aria-label={t("members.role")}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MEMBERSHIP_ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {t(`memberRole.${role}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant={m.role === "admin" ? "default" : "secondary"}>
                    {t(`memberRole.${m.role}`)}
                  </Badge>
                )}
              </div>

              {isAdmin && (
                <div className="space-y-1">
                  <p aria-hidden className="text-xs text-muted-foreground @3xl:hidden">
                    {t("members.complianceRole")}
                  </p>
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
                    <SelectTrigger
                      size="sm"
                      className="w-56"
                      aria-label={t("members.complianceRole")}
                    >
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
                </div>
              )}

              {isAdmin && (
                <div className="@3xl:justify-self-end">
                  {m.id === currentUserId ? (
                    <span className="text-xs text-muted-foreground">
                      {t("members.you")}
                    </span>
                  ) : m.isOwner ? null : (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={removeMutation.isPending}
                      onClick={() => {
                        setTarget(m);
                        setConfirming(true);
                      }}
                    >
                      <UserMinus />
                      {t("remove.action")}
                    </Button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </CardContent>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("remove.title", { name: target?.name ?? "" })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("remove.description", { name: target?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (target) removeMutation.mutate({ userId: target.id });
              }}
            >
              {t("remove.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function MemberIdentity({ member }: { member: Member }) {
  const t = useTranslations("team");
  return (
    <div className="min-w-0 space-y-0.5">
      <p className="font-medium">{member.name}</p>
      {member.jobTitle && (
        <p className="text-xs text-muted-foreground">
          {t(`roles.${member.jobTitle}`, { defaultMessage: member.jobTitle })}
        </p>
      )}
      <p className="break-all text-sm text-muted-foreground">{member.email}</p>
      {member.isOwner && (
        <p className="text-xs text-muted-foreground">{t("memberRole.owner")}</p>
      )}
      {member.assignments.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {member.assignments.map((a) => (
            <Badge
              key={a.categoryCode}
              variant="outline"
              className="text-xs"
              title={a.categoryName}
            >
              {a.categoryCode}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
