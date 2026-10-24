"use client";

import {
  AlertTriangle,
  ArrowUpCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  RefreshCw,
  Server,
  ShieldAlert,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";

export function UpdatesPanel() {
  const utils = trpc.useUtils();
  const [confirmUpdateOpen, setConfirmUpdateOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const query = trpc.platformAdminUpdates.status.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const trigger = trpc.platformAdminUpdates.trigger.useMutation({
    onSuccess: (res) => {
      if (res.ok) {
        setUpdating(true);
        toast.success("Update initiated. Container is restarting...");
        // Poll health after a delay to watch for recovery
        const interval = setInterval(async () => {
          try {
            const h = await fetch("/api/health");
            if (h.ok) {
              clearInterval(interval);
              setUpdating(false);
              toast.success("Instance successfully updated and online!");
              void utils.platformAdminUpdates.status.invalidate();
            }
          } catch {
            // Container still restarting
          }
        }, 3000);
      } else {
        toast.error(res.message);
      }
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleCheckNow = async () => {
    try {
      await query.refetch();
      toast.success("Update status refreshed");
    } catch {
      toast.error("Failed to check for updates");
    }
  };

  const data = query.data;

  if (query.isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (query.isError || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            Unable to load update status
          </CardTitle>
          <CardDescription>
            {query.error?.message ?? "An error occurred while loading update status."}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Installed Version</CardDescription>
            <CardTitle className="text-xl font-mono flex items-center gap-2">
              {data.currentVersion}
              {data.currentVersion === "dev" && (
                <Badge variant="outline" className="text-xs">
                  dev
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Current container image tag
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Update Mode</CardDescription>
            <CardTitle className="text-xl">
              <Badge variant={data.mode === "notify" ? "default" : "secondary"}>
                {data.mode}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {data.mode === "notify"
              ? "Daily check against releases API"
              : "No outbound update checks"}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Compose Revision</CardDescription>
            <CardTitle className="text-xl font-mono">
              {data.currentComposeRevision ?? "unknown"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {data.composeUpdateRequired ? (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                Revision update needed
              </span>
            ) : (
              "compose.yaml revision level"
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">In-App Updater</CardDescription>
            <CardTitle className="text-xl">
              <Badge variant={data.updaterAvailable ? "outline" : "secondary"}>
                {data.updaterAvailable ? "Ready" : "Disabled"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {data.updaterAvailable
              ? "Watchtower token configured"
              : "UPDATE_API_TOKEN not set"}
          </CardContent>
        </Card>
      </div>

      {/* Main Status & Action Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Server className="h-5 w-5 text-primary" />
                Update Status
              </CardTitle>
              <CardDescription>
                Self-host deployment maintenance and release tracking
              </CardDescription>
            </div>
            {data.mode === "notify" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCheckNow}
                disabled={query.isFetching}
              >
                <RefreshCw
                  className={`mr-1.5 h-3.5 w-3.5 ${query.isFetching ? "animate-spin" : ""}`}
                />
                Check now
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {data.mode === "off" ? (
            <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-3">
              <p className="text-muted-foreground">
                Update notifications are disabled (<code>UPDATE_MODE=off</code>). In this
                mode, no outbound requests are made to the GitHub releases API.
              </p>
              <p className="text-muted-foreground">
                To check for updates, view releases directly on GitHub or run{" "}
                <code>docker compose pull && docker compose up -d</code>.
              </p>
              <div>
                <Button asChild variant="outline" size="sm">
                  <a href={data.releaseUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                    View releases on GitHub
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {data.error ? (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                  <p className="font-medium">Could not reach the GitHub releases API:</p>
                  <p className="text-xs mt-1 font-mono">{data.error}</p>
                </div>
              ) : data.hasUpdate ? (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <ArrowUpCircle className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold text-foreground">
                          New version available: v{data.latestVersion}
                        </h4>
                      </div>
                      {data.releaseDate && (
                        <p className="text-xs text-muted-foreground">
                          Published on {new Date(data.releaseDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Badge variant="default">Update Available</Badge>
                  </div>

                  {data.composeUpdateRequired && (
                    <div className="rounded border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      <div>
                        <strong>compose.yaml update recommended:</strong> This release
                        expects{" "}
                        <code>COMPOSE_REVISION={data.expectedComposeRevision}</code>, but
                        your deployment is running{" "}
                        <code>COMPOSE_REVISION={data.currentComposeRevision}</code>.
                        Please review the release notes and update your compose file.
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-2">
                    {data.updaterAvailable ? (
                      <Button
                        size="sm"
                        onClick={() => setConfirmUpdateOpen(true)}
                        disabled={updating || trigger.isPending}
                      >
                        {updating || trigger.isPending ? (
                          <>
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <ArrowUpCircle className="mr-1.5 h-3.5 w-3.5" />
                            Install update
                          </>
                        )}
                      </Button>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        To install, run{" "}
                        <code>docker compose pull && docker compose up -d</code> on the
                        host server.
                      </p>
                    )}

                    <Button asChild variant="outline" size="sm">
                      <a href={data.releaseUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                        Release notes
                      </a>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border bg-muted/20 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <h4 className="text-sm font-medium">Your instance is up to date</h4>
                      <p className="text-xs text-muted-foreground">
                        Running version {data.currentVersion}
                      </p>
                    </div>
                  </div>
                  <Button asChild variant="ghost" size="sm">
                    <a href={data.releaseUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                      Releases
                    </a>
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t bg-muted/10 text-xs text-muted-foreground py-3">
          {data.lastCheckedAt ? (
            <span>Last checked: {new Date(data.lastCheckedAt).toLocaleString()}</span>
          ) : (
            <span>Update checks: {data.mode === "notify" ? "configured" : "off"}</span>
          )}
        </CardFooter>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmUpdateOpen} onOpenChange={setConfirmUpdateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply update to v{data.latestVersion}?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                This requests the companion updater (watchtower) to pull the new container
                image and restart the application service.
              </p>
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                Ensure you have a recent database backup before applying migrations.
                Active browser sessions will temporarily disconnect while the container
                restarts.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmUpdateOpen(false);
                trigger.mutate();
              }}
            >
              Confirm and restart
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
