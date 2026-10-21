"use client";

import { Loader2 } from "lucide-react";
import {
  formatWeekdays,
  formatWindow,
  MIN_ACTIVE_DAYS,
  REACH_DAYS,
  type Reach,
} from "@/lib/platform-admin/best-time";
import { trpc } from "@/lib/trpc/client";

const seen = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Berlin",
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const plural = (n: number) => (n === 1 ? "day" : "days");

function Reading({ reach }: { reach: Reach }) {
  const lastSeen = reach.lastSeen ? `Last seen ${seen.format(reach.lastSeen)}. ` : "";
  if (reach.kind === "unknown") {
    const days = `${reach.activeDays} ${plural(reach.activeDays)} with activity in the last ${REACH_DAYS}`;
    return (
      <p className="mt-1 text-muted-foreground">
        {reach.activeDays >= MIN_ACTIVE_DAYS
          ? `No repeating time yet (${days}, never at the same hours).`
          : `Not enough activity to tell yet (${days}).`}{" "}
        {lastSeen}
      </p>
    );
  }
  const best = reach.windows[0];
  return (
    <>
      <p className="mt-1 text-base font-medium">
        {formatWeekdays(reach.weekdays)}, {reach.windows.map(formatWindow).join(" and ")}{" "}
        <span className="font-normal text-muted-foreground">Berlin time</span>
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Active on {reach.activeDays} {plural(reach.activeDays)} in the last {REACH_DAYS}
        {best ? `, in the best window on ${best.days} of them` : ""}. {lastSeen}Read from
        what they did in the app and their last sign-in. Their own time zone is not
        stored.
      </p>
    </>
  );
}

/**
 * The top of a person's dialog: when to message or call them, worked out from their own activity
 * each time the dialog opens (lib/platform-admin/best-time).
 */
export function ReachLine({ id }: { id: string }) {
  const reach = trpc.platformAdminUsers.reach.useQuery({ id });
  return (
    <section className="rounded-md border bg-muted/40 p-3">
      <h3 className="font-medium">Good time to message or call</h3>
      {reach.isPending ? (
        <Loader2 className="mt-1 h-4 w-4 animate-spin text-muted-foreground" />
      ) : reach.error ? (
        <p className="mt-1 text-destructive">{reach.error.message}</p>
      ) : (
        <Reading reach={reach.data} />
      )}
    </section>
  );
}
