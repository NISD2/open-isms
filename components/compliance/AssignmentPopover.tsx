"use client";

import { useState, useOptimistic, useTransition } from "react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import { UserPlus, Plus, Check } from "lucide-react";
import { toast } from "sonner";
import { getInitials } from "@/lib/utils";
import { InlineInvite } from "@/components/team/InlineInvite";
import { cn } from "@/lib/utils";

export interface CategoryOwner {
  userId: string;
  userName: string;
}

interface AssignmentPopoverProps {
  assessmentId: string;
  categoryId: string;
  owner: CategoryOwner | null;
}

export function AssignmentPopover({
  assessmentId,
  categoryId,
  owner,
}: AssignmentPopoverProps) {
  const t = useTranslations("compliance");
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [showInvite, setShowInvite] = useState(false);

  const [optimisticOwner, setOptimisticOwner] = useOptimistic(
    owner,
    (_current: CategoryOwner | null, next: CategoryOwner | null) => next,
  );

  const { data: users } = trpc.assignment.listAssignableUsers.useQuery();
  const assign = trpc.assignment.assign.useMutation({
    onError: () => {
      toast.error(t("assignFailed"));
      router.refresh();
    },
  });
  const unassign = trpc.assignment.unassign.useMutation({
    onError: () => {
      toast.error(t("unassignFailed"));
      router.refresh();
    },
  });

  function selectOwner(userId: string, userName: string) {
    if (optimisticOwner?.userId === userId) {
      // Clicking current owner = unassign
      startTransition(async () => {
        setOptimisticOwner(null);
        await unassign.mutateAsync({ assessmentId, categoryId, userId });
        router.refresh();
      });
    } else {
      startTransition(async () => {
        setOptimisticOwner({ userId, userName });
        await assign.mutateAsync({ assessmentId, categoryId, userId });
        router.refresh();
      });
    }
  }

  const assignableUsers = users ?? [];

  return (
    <Popover onOpenChange={(open) => { if (!open) setShowInvite(false); }}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {optimisticOwner ? (
            <>
              <Avatar size="sm">
                <AvatarFallback>{getInitials(optimisticOwner.userName)}</AvatarFallback>
              </Avatar>
              <span className="text-sm">{optimisticOwner.userName}</span>
            </>
          ) : (
            <>
              <UserPlus className="h-3.5 w-3.5" />
              {t("categoryOwner")}
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-0" onClick={(e) => e.stopPropagation()}>
        <div className="p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            {t("categoryOwner")}
          </p>

          {assignableUsers.length === 0 && !showInvite && (
            <p className="text-sm text-muted-foreground">
              {t("noUsersToAssign")}
            </p>
          )}

          <div className="space-y-0.5">
            {assignableUsers.map((u) => {
              const isSelected = optimisticOwner?.userId === u.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  disabled={isPending}
                  onClick={() => selectOwner(u.id, u.name)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                    isSelected
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted text-foreground",
                  )}
                >
                  <Avatar size="sm">
                    <AvatarFallback>{getInitials(u.name)}</AvatarFallback>
                  </Avatar>
                  <span className="flex-1 text-left truncate">{u.name}</span>
                  {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        <Separator />

        <div className="p-3">
          {showInvite ? (
            <InlineInvite
              compact
              placeholder={t("invitePlaceholder")}
              redirectPath={pathname}
              assignmentContext={{ assessmentId, categoryId }}
              onInvited={() => setShowInvite(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowInvite(true)}
              className="flex w-full items-center gap-2 rounded-md px-1 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              {t("inviteMember")}
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
