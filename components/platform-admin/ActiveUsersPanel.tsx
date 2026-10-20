"use client";

import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";
import { UserName } from "./UserDialog";

const signedInAt = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  dateStyle: "medium",
  timeStyle: "short",
});

/** Everyone who signed in during the past seven days, the latest first (`platformAdminUsers.active`). */
export function ActiveUsersPanel() {
  const active = trpc.platformAdminUsers.active.useQuery();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Signed in during the past 7 days
          {active.data && (
            <span className="ml-2 font-normal text-muted-foreground">
              ({active.data.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {active.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : active.error ? (
          <p className="text-sm text-destructive">{active.error.message}</p>
        ) : active.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nobody signed in this week.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Name</th>
                  <th className="pb-2 pr-4 font-medium">Email</th>
                  <th className="pb-2 pr-4 font-medium">Company</th>
                  <th className="pb-2 pr-4 font-medium">Last sign-in (Berlin)</th>
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
