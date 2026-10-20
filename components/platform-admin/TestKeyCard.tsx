"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";

/**
 * A key and address for the test endpoint (`platformAdminUsers.createTestKey`), shown once. A sign-in
 * older than a few minutes is sent to sign in again, as the key outlives this browser session.
 * Or just the address (`testAddress`), for an assistant that signs in through the browser.
 */
export function TestKeyCard() {
  const [made, setMade] = useState<{ key: string; url: string; hours: number } | null>(
    null,
  );
  const create = trpc.platformAdminUsers.createTestKey.useMutation({
    onSuccess: setMade,
  });
  const [address, setAddress] = useState<string | null>(null);
  const showAddress = trpc.platformAdminUsers.testAddress.useMutation({
    onSuccess: ({ url }) => setAddress(url),
  });
  const revoke = trpc.user.disconnectMcp.useMutation({
    onSuccess: () => {
      setMade(null);
      setAddress(null);
    },
  });
  const command = made
    ? `claude mcp add --transport http test ${made.url} --header "Authorization: Bearer ${made.key}"`
    : "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Test endpoint</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {made ? (
          <>
            <p className="text-muted-foreground">
              Shown once. Valid for {made.hours} hours, or until you sign out. Run this in
              a terminal; it is not stored anywhere.
            </p>
            <pre className="overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs">
              {command}
            </pre>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setMade(null);
                create.reset();
              }}
            >
              Hide
            </Button>
          </>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => create.mutate()}
                disabled={create.isPending}
              >
                {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Make a key
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => showAddress.mutate()}
                disabled={showAddress.isPending}
              >
                Sign in with the browser
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => revoke.mutate()}
                disabled={revoke.isPending}
              >
                End all my keys
              </Button>
            </div>
            {address && (
              <>
                <p className="text-muted-foreground">
                  Add it once, then run /mcp in Claude Code and choose Authenticate. The
                  browser asks you to allow it; the sign-in renews itself for up to 14
                  days, and ends when you sign out here or press End all my keys.
                </p>
                <pre className="overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs">
                  {`claude mcp add --transport http test ${address}`}
                </pre>
              </>
            )}
            {showAddress.error && (
              <p className="text-destructive">{showAddress.error.message}</p>
            )}
            {revoke.isSuccess && (
              <p className="text-muted-foreground">
                Every key you made, and every assistant you connected, has ended.
              </p>
            )}
            {create.error && (
              <p className="text-destructive">
                {create.error.message === "reauth"
                  ? "Sign out and in again, then try once more."
                  : create.error.message}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
