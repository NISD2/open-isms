"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";

/**
 * A key and address for the test endpoint (`platformAdminUsers.createTestKey`), shown once. A sign-in
 * older than a few minutes is sent to sign in again, as the key outlives this browser session.
 */
export function TestKeyCard() {
  const [made, setMade] = useState<{ key: string; url: string; hours: number } | null>(
    null,
  );
  const create = trpc.platformAdminUsers.createTestKey.useMutation({
    onSuccess: setMade,
  });
  const revoke = trpc.user.disconnectMcp.useMutation({ onSuccess: () => setMade(null) });
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
                onClick={() => revoke.mutate()}
                disabled={revoke.isPending}
              >
                End all my keys
              </Button>
            </div>
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
