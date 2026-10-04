"use client";

/**
 * The Feature flags tab: every platform switch (lib/feature-flags.ts), what it does, and its
 * state. A switch flipped here shows on each person's next full page load.
 */
import { ToggleRight } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc/client";

export function FeatureFlagsPanel() {
  const flags = trpc.platformAdmin.featureFlags.useQuery();
  const set = trpc.platformAdmin.setFeatureFlag.useMutation({
    onSuccess: async (_, { key, enabled }) => {
      await flags.refetch();
      toast.success(`${key} switched ${enabled ? "on" : "off"}.`);
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ToggleRight className="h-4 w-4" /> Feature flags
        </CardTitle>
        <CardDescription>
          Platform switches for every company at once. A switch with no saved state is
          off.
        </CardDescription>
      </CardHeader>
      <CardContent className="divide-y text-sm">
        {flags.data?.length === 0 && (
          <p className="text-muted-foreground">No switches right now.</p>
        )}
        {(flags.data ?? []).map((flag) => (
          <div key={flag.key} className="flex items-start justify-between gap-6 py-4">
            <div className="min-w-0 space-y-1">
              <p className="font-medium">
                {flag.label}{" "}
                <span className="font-mono text-xs text-muted-foreground">
                  {flag.key}
                </span>
              </p>
              <p className="max-w-prose text-muted-foreground">{flag.description}</p>
              <p className="text-xs text-muted-foreground">
                {flag.updatedAt
                  ? `${flag.enabled ? "On" : "Off"} since ${new Date(flag.updatedAt).toLocaleString("de-DE")}${flag.updatedBy ? ` by ${flag.updatedBy}` : ""}`
                  : "Never set, so off."}
              </p>
            </div>
            <Switch
              aria-label={flag.label}
              checked={flag.enabled}
              disabled={set.isPending}
              onCheckedChange={(enabled) => set.mutate({ key: flag.key, enabled })}
              className="mt-1"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
