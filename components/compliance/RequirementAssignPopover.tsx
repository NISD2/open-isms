"use client";

import { useTranslations } from "next-intl";
import { getInitials, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import { Check, UserPlus, Users } from "lucide-react";
export interface AssignUser {
  id: string;
  name: string;
  email: string;
  role: string;
  jobTitle: string | null;
}

export interface AssignmentRow {
  id: string;
  userId: string;
  signedOffAt: string | null;
  user: { id: string; name: string; email: string; jobTitle: string | null };
}

export function RequirementAssignPopover({
  assignments,
  users,
  isPending,
  onAssign,
  onUnassign,
}: {
  assignments: AssignmentRow[];
  users: AssignUser[];
  isPending: boolean;
  onAssign: (userId: string) => void;
  onUnassign: (userId: string) => void;
}) {
  const t = useTranslations("compliance");
  const assignedIds = new Set(assignments.map((a) => a.userId));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
          {assignments.length > 0 ? (
            <>
              {assignments.length === 1 ? (
                <>
                  <Avatar size="sm">
                    <AvatarFallback className="text-[9px]">
                      {getInitials(assignments[0].user.name)}
                    </AvatarFallback>
                  </Avatar>
                  {assignments[0].user.name}
                </>
              ) : (
                <>
                  <Users className="h-3 w-3" />
                  {t("assignedCount", { count: assignments.length })}
                </>
              )}
            </>
          ) : (
            <>
              <UserPlus className="h-3 w-3" />
              {t("assign")}
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-2">
        <p className="text-xs font-medium text-muted-foreground px-2 mb-1">
          {t("assign")}
        </p>
        <div className="space-y-0.5">
          {users.map((u) => {
            const isSelected = assignedIds.has(u.id);
            return (
              <button
                key={u.id}
                type="button"
                disabled={isPending}
                onClick={() => (isSelected ? onUnassign(u.id) : onAssign(u.id))}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                  isSelected
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted text-foreground",
                )}
              >
                <Avatar size="sm">
                  <AvatarFallback className="text-[9px]">
                    {getInitials(u.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 text-left truncate">{u.name}</span>
                {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
