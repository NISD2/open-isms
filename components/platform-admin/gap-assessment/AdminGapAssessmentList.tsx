"use client";

import { useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AdminGapAssessmentRow {
  id: string;
  companyId: string | null;
  companyName: string | null;
  sector: string | null;
  completedAt: Date | null;
  sharedAt: Date | null;
  shareToken: string | null;
  createdAt: Date;
}

interface AdminGapAssessmentListProps {
  rows: AdminGapAssessmentRow[];
}

interface PublishedCredentials {
  assessmentId: string;
  shareUrl: string;
  sharePassword: string;
}

export function AdminGapAssessmentList({ rows }: AdminGapAssessmentListProps) {
  const router = useRouter();
  const [credentials, setCredentials] = useState<PublishedCredentials | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const publishMutation = trpc.platformAdmin.gapAssessmentPublish.useMutation({
    onSuccess: (data, vars) => {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      setRevealed(false);
      setCredentials({
        assessmentId: vars.assessmentId,
        shareUrl: `${origin}${data.shareUrl}`,
        sharePassword: data.sharePassword,
      });
      router.refresh();
    },
    onError: (err) => {
      toast.error(err.message);
    },
    onSettled: () => {
      setPublishingId(null);
    },
  });

  function handlePublish(row: AdminGapAssessmentRow) {
    if (row.sharedAt) {
      const confirmed = window.confirm(
        "Re-publishing will invalidate the previous share URL and password. Anyone you sent the old credentials to will lose access. Continue?",
      );
      if (!confirmed) return;
    }
    setPublishingId(row.id);
    publishMutation.mutate({ assessmentId: row.id });
  }

  function copy(text: string, label: string) {
    void navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copied`);
    });
  }

  return (
    <div className="container mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Gap Assessments</h1>
          <p className="text-muted-foreground text-sm">
            Admin-managed assessments. Create one for a client, fill it in,
            publish a password-protected share URL.
          </p>
        </div>
        <Link
          href={"/platform-admin/gap-assessment/new" as never}
          className="inline-flex items-center rounded-md border bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          New assessment
        </Link>
      </div>

      {credentials ? (
        <Card className="border-amber-500/50 bg-amber-50/40 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle>Share credentials (shown once)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">
              Save these now. The password is not stored in plaintext and
              cannot be shown again. Paste them into a password manager or send
              them to the client before navigating away.
            </p>

            <div className="space-y-1">
              <div className="text-muted-foreground text-xs uppercase">Share URL</div>
              <div className="flex items-center gap-2">
                <code className="bg-muted block flex-1 rounded px-2 py-1 text-xs">
                  {credentials.shareUrl}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copy(credentials.shareUrl, "Share URL")}
                >
                  Copy
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-muted-foreground text-xs uppercase">Password</div>
              <div className="flex items-center gap-2">
                <code className="bg-muted block flex-1 rounded px-2 py-1 font-mono text-xs">
                  {revealed ? credentials.sharePassword : "••••••••••••"}
                </code>
                <Button variant="outline" size="sm" onClick={() => setRevealed((v) => !v)}>
                  {revealed ? "Hide" : "Reveal"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copy(credentials.sharePassword, "Password")}
                >
                  Copy
                </Button>
              </div>
            </div>

            <Button variant="ghost" size="sm" onClick={() => setCredentials(null)}>
              Dismiss
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No assessments yet. Click "New assessment" to create one.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => {
            const status = row.sharedAt
              ? "shared"
              : row.completedAt
                ? "completed"
                : "in progress";
            return (
              <Card key={row.id}>
                <CardContent className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{row.companyName ?? "(no company)"}</span>
                      <Badge variant="outline">{row.sector ?? "n/a"}</Badge>
                      <Badge variant={row.sharedAt ? "default" : "secondary"}>
                        {status}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Created {new Date(row.createdAt).toLocaleString()}
                      {row.sharedAt
                        ? ` · Shared ${new Date(row.sharedAt).toLocaleString()}`
                        : ""}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Link
                      href={`/platform-admin/gap-assessment/${row.id}/fill` as never}
                      className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
                    >
                      Open
                    </Link>
                    <Button
                      size="sm"
                      disabled={publishingId === row.id}
                      onClick={() => handlePublish(row)}
                    >
                      {publishingId === row.id
                        ? "Publishing..."
                        : row.sharedAt
                          ? "Re-publish"
                          : "Publish"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
