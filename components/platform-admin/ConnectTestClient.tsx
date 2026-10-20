"use client";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { signInAgain } from "@/components/settings/ConnectAssistant";
import { Button } from "@/components/ui/button";
import { RECENT_SIGN_IN_S } from "@/lib/auth/session-age";
import { trpc } from "@/lib/trpc/client";

/**
 * The consent card of the test endpoint's browser sign-in (`platformAdminUsers.allowTestClient`),
 * shown to the operator only. It says nothing of what the endpoint is for: the page carries a
 * request any signed-in person could open, and only the operator's allow does anything. A sign-in
 * older than a few minutes is sent to sign in again and comes back here, as a made key's is.
 */
export function ConnectTestClient({
  request,
  client,
  person,
  returnTo,
  denyUrl,
  signedInRecently,
}: {
  request: string;
  /** The name the application gave itself when it registered; null when it gave none. */
  client: string | null;
  person: string;
  returnTo: string;
  denyUrl: string;
  signedInRecently: boolean;
}) {
  const allow = trpc.platformAdminUsers.allowTestClient.useMutation({
    onSuccess: ({ url }) => window.location.assign(url),
    onError: (error) => {
      if (error.message === "reauth") return;
      toast.error(
        error.data?.code === "BAD_REQUEST"
          ? "This request has expired. Connect again from the application."
          : "Something went wrong. Try again.",
      );
    },
  });
  const needsSignIn = !signedInRecently || allow.error?.message === "reauth";

  return (
    <div className="space-y-5 rounded-2xl border bg-card p-6 shadow-sm">
      <h1 className="text-xl font-semibold">Allow this sign-in?</h1>
      <p>
        {client ?? "An application"} asks to sign in as {person}.
      </p>
      <p className="rounded-lg border bg-muted/40 px-4 py-3 text-sm">
        <span className="font-medium">
          After you allow it, your browser goes to {returnTo}.
        </span>
        {client && <> The name {client} was chosen by the application itself.</>} Allow it
        only if you started this from your own machine just now.
      </p>
      <p className="text-sm text-muted-foreground">
        It stays signed in for up to 14 days. Signing out, or ending your assistants in
        Settings, ends it.
      </p>
      {needsSignIn && (
        <p className="rounded-lg border bg-muted/40 px-4 py-3 text-sm">
          Allowing needs a sign-in from the last {RECENT_SIGN_IN_S / 60} minutes.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {needsSignIn ? (
          <Button type="button" onClick={signInAgain}>
            Sign in again
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => allow.mutate({ request })}
            disabled={allow.isPending || allow.isSuccess}
          >
            {allow.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Allow
          </Button>
        )}
        <Button asChild variant="outline">
          <a href={denyUrl}>Decline</a>
        </Button>
      </div>
    </div>
  );
}
