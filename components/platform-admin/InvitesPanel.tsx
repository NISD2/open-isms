"use client";

import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type RouterOutputs, trpc } from "@/lib/trpc/client";
import { UserName } from "./UserDialog";

type Invite = RouterOutputs["platformAdminInvites"]["list"][number];

const invitedOn = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  dateStyle: "medium",
  timeStyle: "short",
});

const STATUS_LABEL: Record<Invite["status"], string> = {
  pending: "Pending",
  joined: "Joined",
  expired: "Expired",
  revoked: "Revoked",
};

const STATUS_CLASS: Record<Invite["status"], string> = {
  pending: "text-foreground",
  joined: "font-medium text-foreground",
  expired: "text-muted-foreground",
  revoked: "text-muted-foreground",
};

/**
 * Everyone invited onto the platform and who invited them, the newest first
 * (`platformAdminInvites.list`): colleagues invited into a company and suppliers sent the
 * questionnaire. A name opens that person's dialog.
 */
export function InvitesPanel() {
  const invites = trpc.platformAdminInvites.list.useQuery();
  const joined = invites.data?.filter((i) => i.status === "joined").length ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Invited users
          {invites.data && (
            <span className="ml-2 font-normal text-muted-foreground">
              ({invites.data.length}, {joined} joined)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {invites.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : invites.error ? (
          <p className="text-sm text-destructive">{invites.error.message}</p>
        ) : invites.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nobody has invited anyone yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Invited (Berlin)</th>
                  <th className="pb-2 pr-4 font-medium">Invited by</th>
                  <th className="pb-2 pr-4 font-medium">Invited</th>
                  <th className="pb-2 pr-4 font-medium">Company</th>
                  <th className="pb-2 pr-4 font-medium">As</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {invites.data.map((i) => (
                  <tr
                    key={`${i.kind}-${i.id}`}
                    className="border-b border-border/50 align-top last:border-0"
                  >
                    <td className="whitespace-nowrap py-2 pr-4 text-muted-foreground">
                      {invitedOn.format(new Date(i.invitedAt))}
                    </td>
                    <td className="py-2 pr-4">
                      {i.inviter ? (
                        <>
                          <UserName id={i.inviter.id}>{i.inviter.name}</UserName>
                          <div className="text-xs text-muted-foreground">
                            {i.inviter.email}
                          </div>
                        </>
                      ) : (
                        <span className="text-muted-foreground italic">unknown</span>
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      {i.invitee ? (
                        <>
                          <UserName id={i.invitee.id}>{i.invitee.name}</UserName>
                          <div className="text-xs text-muted-foreground">{i.email}</div>
                        </>
                      ) : (
                        <span className="text-muted-foreground">{i.email}</span>
                      )}
                    </td>
                    <td className="py-2 pr-4">{i.companyName}</td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {i.kind === "supplier" ? "supplier" : (i.role ?? "member")}
                    </td>
                    <td className={`py-2 ${STATUS_CLASS[i.status]}`}>
                      {STATUS_LABEL[i.status]}
                    </td>
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
