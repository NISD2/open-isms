"use client";

/**
 * The Pricing tab: two separate buttons, in the order they are used.
 *
 *   1. Launch pricing, once. Grandfathers everyone who has got in, freezes them into a newsletter
 *      group, and turns the paywall on. There is no way back (lib/billing/launch.ts).
 *   2. Send the announcement: a newsletter draft, written in the Newsletter tab, sent to that frozen
 *      group through the ordinary newsletter send, so it is logged and people who opted out of
 *      follow-up mail are skipped.
 */
import { Megaphone, Rocket } from "lucide-react";
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
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { trpc } from "@/lib/trpc/client";

const when = (d: Date | string) => new Date(d).toLocaleString("de-DE");

export function PricingPanel() {
  const state = trpc.platformAdmin.pricingState.useQuery();
  const issues = trpc.newsletter.listIssues.useQuery();
  const [issueId, setIssueId] = useState("");

  const launch = trpc.platformAdmin.launchPricing.useMutation({
    onSuccess: async (r) => {
      await state.refetch();
      toast.success(
        `Pricing launched. ${r.stampedUsers} people grandfathered, ${r.accountsGrandfathered} accounts moved, announcement group of ${r.groupMembers}.`,
      );
    },
    onError: (e) => toast.error(e.message),
  });

  const send = trpc.newsletter.sendIssue.useMutation({
    onSuccess: async ({ recipientCount }) => {
      await issues.refetch();
      setIssueId("");
      toast.success(`Announcement sent to ${recipientCount} people.`);
    },
    onError: (e) => toast.error(e.message),
  });

  const s = state.data;
  const drafts = (issues.data ?? []).filter((i) => i.status !== "sent");
  const group = s?.group ?? null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Rocket className="h-4 w-4" /> 1. Launch pricing
          </CardTitle>
          <CardDescription>
            Once, and for good. Everyone who has ever got in is grandfathered: they keep
            the current journey free in every company they belong to or start later. From
            then on a new signup without a paid or grandfathered account is sent to
            /bestellen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {!s ? (
            "…"
          ) : s.launched ? (
            <p>
              Launched {s.launchedAt ? when(s.launchedAt) : ""}. This cannot be undone
              here.
            </p>
          ) : (
            <>
              {!s.liveKeys && (
                <p className="text-muted-foreground">
                  Needs live Qonto keys (QONTO_LOGIN and QONTO_SECRET_KEY) on this
                  deployment.
                </p>
              )}
              <Button
                disabled={!s.liveKeys || launch.isPending}
                onClick={() => {
                  if (
                    window.confirm(
                      "Launch pricing now? Everyone who has got in so far is grandfathered for good, new signups must order, and this cannot be undone.",
                    )
                  ) {
                    launch.mutate();
                  }
                }}
                data-testid="launch-pricing"
              >
                Launch pricing and grandfather everyone
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Megaphone className="h-4 w-4" /> 2. Announcement to grandfathered people
          </CardTitle>
          <CardDescription>
            Write the mail as a newsletter draft in the Newsletter tab, then send it here
            to the group frozen at the launch. People who opted out of follow-up mail are
            skipped.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {!group ? (
            <p className="text-muted-foreground">Available after the launch.</p>
          ) : (
            <>
              <p>
                Group <span className="font-medium">{group.name}</span>: {group.members}{" "}
                people.
              </p>
              <NativeSelect value={issueId} onChange={(e) => setIssueId(e.target.value)}>
                <NativeSelectOption value="">
                  Choose a newsletter draft
                </NativeSelectOption>
                {drafts.map((i) => (
                  <NativeSelectOption key={i.id} value={i.id}>
                    {i.subject}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <Button
                disabled={!issueId || send.isPending}
                onClick={() => {
                  const subject = drafts.find((d) => d.id === issueId)?.subject ?? "";
                  if (
                    window.confirm(
                      `Send "${subject}" to ${group.members} grandfathered people? A newsletter is sent once.`,
                    )
                  ) {
                    send.mutate({ id: issueId, groupId: group.id });
                  }
                }}
                data-testid="send-announcement"
              >
                Send announcement
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
