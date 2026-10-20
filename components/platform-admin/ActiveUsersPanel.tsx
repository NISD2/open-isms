"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  clampActiveDays,
  DEFAULT_ACTIVE_DAYS,
  MAX_ACTIVE_DAYS,
  QUICK_ACTIVE_DAYS,
} from "@/lib/platform-admin/active-window";
import { trpc } from "@/lib/trpc/client";
import { UserName } from "./UserDialog";

const signedInAt = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  dateStyle: "medium",
  timeStyle: "short",
});

/**
 * Everyone who signed in or did something during the past N days, the latest of the two first
 * (`platformAdminUsers.active`). N starts at 14 and is the admin's to change. What is typed is a draft until the field is left
 * or Enter is pressed, so a number can be edited freely and only the finished one is asked for.
 */
export function ActiveUsersPanel() {
  const [days, setDays] = useState<number>(DEFAULT_ACTIVE_DAYS);
  const [draft, setDraft] = useState(String(DEFAULT_ACTIVE_DAYS));
  const choose = (next: number) => {
    setDays(next);
    setDraft(String(next));
  };
  // An empty or non-numeric draft goes back to the window in use.
  const commit = () => choose(clampActiveDays(draft) ?? days);
  const active = trpc.platformAdminUsers.active.useQuery(
    { days },
    // Changing the window keeps the rows on screen until the new ones arrive.
    { placeholderData: (previous) => previous },
  );

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-base">
          Active during the past {days} {days === 1 ? "day" : "days"}
          {active.data && (
            <span className="ml-2 font-normal text-muted-foreground">
              ({active.data.length})
            </span>
          )}
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <label className="flex items-center gap-1.5">
            Days
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_ACTIVE_DAYS}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onBlur={commit}
              onKeyDown={(event) => {
                if (event.key === "Enter") commit();
              }}
              className="w-20 rounded-md border bg-background px-2 py-1 text-foreground"
            />
          </label>
          {QUICK_ACTIVE_DAYS.map((d) => (
            <Button
              key={d}
              type="button"
              size="sm"
              variant={d === days ? "secondary" : "ghost"}
              onClick={() => choose(d)}
            >
              {d}
            </Button>
          ))}
          {active.isFetching && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>
      </CardHeader>
      <CardContent>
        {active.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : active.error ? (
          <p className="text-sm text-destructive">{active.error.message}</p>
        ) : active.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nobody signed in or did anything during the past {days}{" "}
            {days === 1 ? "day" : "days"}.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Name</th>
                  <th className="pb-2 pr-4 font-medium">Email</th>
                  <th className="pb-2 pr-4 font-medium">Company</th>
                  <th className="pb-2 pr-4 font-medium">Last sign-in (Berlin)</th>
                  <th className="pb-2 pr-4 font-medium">Last action (Berlin)</th>
                  <th className="pb-2 font-medium">Sign-ins in total</th>
                </tr>
              </thead>
              <tbody>
                {active.data.map((u) => (
                  <tr key={u.id} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-4 font-medium">
                      <UserName id={u.id}>{u.name}</UserName>
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">{u.email}</td>
                    <td className="py-2 pr-4">
                      {u.companyName ?? (
                        <span className="text-muted-foreground italic">none</span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {u.lastLoginAt ? signedInAt.format(new Date(u.lastLoginAt)) : null}
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {u.lastActionAt
                        ? signedInAt.format(new Date(u.lastActionAt))
                        : null}
                    </td>
                    <td className="py-2 tabular-nums">{u.loginCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
