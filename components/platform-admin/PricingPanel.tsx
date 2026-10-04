"use client";

/**
 * The Pricing tab. Pricing launched once, which grandfathered everyone who had got in and froze them
 * into a newsletter group (lib/billing/announcement-group.ts). Here: the promo link, the
 * announcement to that group (a newsletter draft, written in the Newsletter tab, sent through the
 * ordinary newsletter send, so it is logged and people who opted out of follow-up mail are skipped),
 * and the orders and cancels waiting to be checked in Qonto (./OrderChecksCard). Door two, closing a
 * sale on the call, lives in the Subscriptions tab as "New customer".
 */
import { Megaphone, Ticket } from "lucide-react";
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
import { type RouterOutputs, trpc } from "@/lib/trpc/client";
import { OrderChecksCard } from "./OrderChecksCard";

/** A YYYY-MM-DD calendar day as the admin reads it, e.g. "13.10.2026". */
const day = (isoDay: string) =>
  new Date(`${isoDay}T12:00:00Z`).toLocaleDateString("de-DE", { timeZone: "UTC" });

type Promo = NonNullable<RouterOutputs["platformAdmin"]["pricingState"]>["promo"];

/**
 * The promo link (lib/billing/promo.ts): set by GRANDFATHER_PROMO_CODE and
 * GRANDFATHER_PROMO_UNTIL on the deployment, so this card only reads. It says
 * whether the link runs, until when, how many it grandfathered, and the links.
 */
function PromoCard({ promo }: { promo: Promo | undefined }) {
  const summary = promo?.summary;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Ticket className="h-4 w-4" /> Promo link
        </CardTitle>
        <CardDescription>
          Whoever opens a page with the code and then signs in or signs up is
          grandfathered, until the last day (Berlin, inclusive). After it the sign-in
          pages say the offer has ended. Set on the deployment, not here.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {!promo || !summary ? (
          "…"
        ) : !summary.configured ? (
          <p className="text-muted-foreground">
            {summary.missing === "valid last day"
              ? "Off: GRANDFATHER_PROMO_UNTIL is not a YYYY-MM-DD date, so the promo is closed."
              : `Off: no ${summary.missing} set. Needs GRANDFATHER_PROMO_CODE and GRANDFATHER_PROMO_UNTIL (YYYY-MM-DD).`}
          </p>
        ) : (
          <>
            <p>
              Code <span className="font-mono font-medium">{summary.code}</span>, last day{" "}
              <span className="font-medium">{day(summary.until)}</span>:{" "}
              {summary.state === "active"
                ? summary.daysLeft === 0
                  ? "running, ends tonight."
                  : `running, ${summary.daysLeft} day(s) left.`
                : `ended ${-summary.daysLeft} day(s) ago.`}
            </p>
            <p>
              Grandfathered through promo links so far (all codes): {promo.grandfathered}.
            </p>
            <ul className="space-y-1">
              {promo.links.map((link) => (
                <li key={link.locale} className="break-all font-mono text-xs">
                  {link.locale.toUpperCase()}: {link.url}
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function PricingPanel() {
  const state = trpc.platformAdmin.pricingState.useQuery();
  const issues = trpc.newsletter.listIssues.useQuery();
  const [issueId, setIssueId] = useState("");

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
      <PromoCard promo={s?.promo} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Megaphone className="h-4 w-4" /> Announcement to grandfathered people
          </CardTitle>
          <CardDescription>
            Write the mail as a newsletter draft in the Newsletter tab, then send it here
            to the group frozen at the launch. People who opted out of follow-up mail are
            skipped.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {!group ? (
            <p className="text-muted-foreground">No announcement group found.</p>
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

      <OrderChecksCard />
    </div>
  );
}
