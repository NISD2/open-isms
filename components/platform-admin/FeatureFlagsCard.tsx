"use client";

/**
 * Platform switches. Unlike the rest of the Dev tab, which only touches the operator's own account,
 * these act on every customer at once, so each one says what it opens and every flip is audited.
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
import { useRouter } from "@/i18n/navigation";
import { trpc } from "@/lib/trpc/client";

const DESCRIPTIONS = {
  billing: {
    label: "Billing for customers",
    what: "Opens /bestellen, /billing and the Billing sidebar entry to every account holder. Needs live Qonto keys as well; without them it opens nothing. Platform admins see billing whenever Qonto is configured, switch or not.",
  },
} as const;

export function FeatureFlagsCard() {
  const router = useRouter();
  const flags = trpc.platformAdmin.featureFlags.useQuery();
  const set = trpc.platformAdmin.setFeatureFlag.useMutation({
    onSuccess: async ({ key, enabled }) => {
      await flags.refetch();
      router.refresh();
      toast.success(`${DESCRIPTIONS[key].label}: ${enabled ? "on" : "off"}.`);
    },
    onError: () => toast.error("Could not change that switch."),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ToggleRight className="h-4 w-4" /> Platform switches
        </CardTitle>
        <CardDescription>
          These act on every customer, not only on you. Each change is written to the
          audit log.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {(flags.data ?? []).map(({ key, enabled, updatedAt }) => (
          <div key={key} className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="font-medium text-sm">{DESCRIPTIONS[key].label}</p>
              <p className="text-muted-foreground text-sm">{DESCRIPTIONS[key].what}</p>
              {updatedAt ? (
                <p className="text-muted-foreground text-xs">
                  Last changed {new Date(updatedAt).toLocaleString("de-DE")}
                </p>
              ) : null}
            </div>
            <Switch
              checked={enabled}
              disabled={set.isPending}
              onCheckedChange={(next) => set.mutate({ key, enabled: next })}
              aria-label={DESCRIPTIONS[key].label}
              data-testid={`feature-flag-${key}`}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
