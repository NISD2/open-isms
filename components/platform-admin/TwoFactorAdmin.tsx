"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc/client";

const at = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  dateStyle: "medium",
});

/**
 * In the user dialog: whether the person signs in with an authenticator app, and the reset for
 * someone who lost their phone and their recovery codes (twoFactor.adminReset). Check who is
 * asking outside the app first; the reason goes into the audit log, the person gets an email.
 */
export function TwoFactorAdmin({ userId }: { userId: string }) {
  const utils = trpc.useUtils();
  const status = trpc.twoFactor.adminStatus.useQuery({ userId });
  const reset = trpc.twoFactor.adminReset.useMutation({
    onSuccess: () => utils.twoFactor.adminStatus.invalidate({ userId }),
  });
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  if (status.isPending)
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  const enabledAt = status.data?.enabledAt ?? null;

  return (
    <section className="space-y-2">
      <h3 className="font-medium">Two-factor sign-in</h3>
      <p>
        {enabledAt
          ? `On since ${at.format(new Date(enabledAt))}, ${status.data?.recoveryCodesLeft ?? 0} recovery codes left.`
          : "Off."}
        {reset.isSuccess && " Reset; the person was emailed."}
      </p>
      {enabledAt && !open && (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          Reset two-factor sign-in
        </Button>
      )}
      {enabledAt && open && (
        <form
          className="max-w-lg space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            reset.mutate({ userId, reason }, { onSuccess: () => setOpen(false) });
          }}
        >
          <label
            htmlFor={`two-factor-reason-${userId}`}
            className="block text-muted-foreground"
          >
            Why, and how you checked who asked (at least 10 characters, kept in the audit
            log)
          </label>
          <div>
            <Textarea
              id={`two-factor-reason-${userId}`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              minLength={10}
              maxLength={500}
              required
              rows={2}
            />
          </div>
          {reset.error && <p className="text-destructive">{reset.error.message}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={reset.isPending}>
              {reset.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove their authenticator app
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
