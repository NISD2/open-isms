"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { formatFileSize } from "@/lib/utils";
import {
  Check,
  ChevronDown,
  FileText,
  Loader2,
  ScrollText,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { SignOffSnapshot } from "@nisd2/isms-schema/tables/assessments";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EvidenceItem {
  id: string;
  fileName: string;
  fileSize: number | null;
  description: string | null;
  uploadedAt: Date;
}

interface AuditEntry {
  action: string;
  description: string;
  createdAt: Date;
  userName: string | null;
}

export interface ReviewRow {
  id: string;
  status: string;
  completedAt: Date | null;
  reviewedAt: Date | null;
  reviewFeedback: string | null;
  submitterName: string | null;
  reviewerName: string | null;
  requirementCode: string;
  requirementTitle: string;
  categorySlug: string;
  categoryName: string;
  evidenceCount: number;
  signOffSnapshot: SignOffSnapshot | null;
  signedOffRole: string | null;
  signedOffAt: Date | null;
  evidence: EvidenceItem[];
  auditLog: AuditEntry[];
}

interface ReviewDashboardProps {
  rows: ReviewRow[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReviewDashboard({ rows }: ReviewDashboardProps) {
  const t = useTranslations("review");

  const pending = rows.filter((r) => r.status === "completed");
  const recent = rows
    .filter((r) => r.status === "approved" || r.status === "rejected")
    .slice(0, 50);

  return (
    <div className="space-y-10">
      {/* Pending Review */}
      <section>
        <h2 className="text-lg font-semibold mb-3">{t("pending")}</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noSubmissions")}</p>
        ) : (
          <div className="space-y-2">
            {pending.map((row) => (
              <ReviewItem key={row.id} row={row} />
            ))}
          </div>
        )}
      </section>

      {/* Recently Reviewed */}
      {recent.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">{t("reviewHistory")}</h2>
          <div className="space-y-2">
            {recent.map((row) => (
              <ReviewItem key={row.id} row={row} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single expandable review item
// ---------------------------------------------------------------------------

function ReviewItem({ row }: { row: ReviewRow }) {
  const t = useTranslations("review");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [feedback, setFeedback] = useState("");

  const isPending = row.status === "completed";

  const approve = trpc.review.approve.useMutation({
    onSuccess: () => {
      toast.success(t("approveConfirm"));
      router.refresh();
    },
    onError: (err) => toast.error(err.message),
  });

  const reject = trpc.review.reject.useMutation({
    onSuccess: () => {
      toast.success(t("rejectConfirm"));
      setShowReject(false);
      setFeedback("");
      router.refresh();
    },
    onError: (err) => toast.error(err.message),
  });

  const isMutating = approve.isPending || reject.isPending;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-lg border bg-card">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
          >
            <ChevronDown
              className={`size-4 shrink-0 text-muted-foreground transition-transform ${
                open ? "rotate-0" : "-rotate-90"
              }`}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">
                  {row.requirementCode}
                </span>
                <span className="text-sm font-medium truncate">
                  {row.requirementTitle}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                <span>{row.categoryName}</span>
                {row.submitterName && (
                  <>
                    <span>·</span>
                    <span>{row.submitterName}</span>
                  </>
                )}
                {row.completedAt && (
                  <>
                    <span>·</span>
                    <span>
                      {new Date(row.completedAt).toLocaleDateString()}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {row.evidenceCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {row.evidenceCount} {t("evidenceCount").toLowerCase()}
                </span>
              )}
              <StatusBadge status={row.status} />
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t px-4 py-4 space-y-5">
            {/* Sign-off Data */}
            {row.signOffSnapshot && (
              <SignOffDisplay snapshot={row.signOffSnapshot} role={row.signedOffRole} signedAt={row.signedOffAt} />
            )}

            {/* Evidence Files */}
            {row.evidence.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                  <FileText className="size-3.5" />
                  {t("evidenceFiles")}
                </h4>
                <div className="space-y-1.5">
                  {row.evidence.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center gap-3 text-sm rounded-md bg-muted/50 px-3 py-2"
                    >
                      <span className="truncate font-medium">
                        {e.fileName}
                      </span>
                      {e.fileSize && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatFileSize(e.fileSize)}
                        </span>
                      )}
                      {e.description && (
                        <span className="text-xs text-muted-foreground truncate">
                          — {e.description}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Review Feedback (for already-reviewed items) */}
            {row.reviewFeedback && !isPending && (
              <div>
                <h4 className="text-sm font-medium mb-1">
                  {t("feedbackFromReviewer")}
                </h4>
                <p className="text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                  {row.reviewFeedback}
                </p>
              </div>
            )}

            {/* Audit Log */}
            {row.auditLog.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                  <ScrollText className="size-3.5" />
                  {t("reviewHistory")}
                </h4>
                <div className="space-y-1">
                  {row.auditLog.map((entry, i) => (
                    <div
                      key={i}
                      className="flex items-baseline gap-3 text-xs text-muted-foreground"
                    >
                      <span className="shrink-0 tabular-nums">
                        {new Date(entry.createdAt).toLocaleString()}
                      </span>
                      {entry.userName && (
                        <span className="font-medium text-foreground">
                          {entry.userName}
                        </span>
                      )}
                      <span className="truncate">{entry.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inline Approve / Reject */}
            {isPending && (
              <div className="pt-2 border-t">
                {showReject ? (
                  <div className="space-y-2">
                    <Textarea
                      placeholder={t("feedbackPlaceholder")}
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={!feedback.trim() || isMutating}
                        onClick={() =>
                          reject.mutate({ statusId: row.id, feedback })
                        }
                      >
                        {reject.isPending ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <X className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        {t("rejectButton")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowReject(false);
                          setFeedback("");
                        }}
                        disabled={isMutating}
                      >
                        {t("cancel")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => approve.mutate({ statusId: row.id })}
                      disabled={isMutating}
                    >
                      {approve.isPending ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      {t("approveButton")}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowReject(true)}
                      disabled={isMutating}
                    >
                      <X className="mr-1.5 h-3.5 w-3.5" />
                      {t("rejectButton")}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ---------------------------------------------------------------------------
// Sign-off display — shows snapshot data instead of form data
// ---------------------------------------------------------------------------

function SignOffDisplay({
  snapshot,
  role,
  signedAt,
}: {
  snapshot: SignOffSnapshot;
  role: string | null;
  signedAt: Date | null;
}) {
  const t = useTranslations("review");

  return (
    <div>
      <h4 className="text-sm font-medium mb-2">{t("signOffDetails")}</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
        {role && (
          <div>
            <span className="text-muted-foreground">{t("signedOffAs")}: </span>
            <span className="font-medium">{role}</span>
          </div>
        )}
        {signedAt && (
          <div>
            <span className="text-muted-foreground">{t("signedOffDate")}: </span>
            <span className="font-medium">{new Date(signedAt).toLocaleDateString()}</span>
          </div>
        )}
        <div>
          <span className="text-muted-foreground">{t("templateVersion")}: </span>
          <span className="font-medium">v{snapshot.templateVersion}</span>
        </div>
        {snapshot.derivedData && Object.keys(snapshot.derivedData).length > 0 && (
          <div className="sm:col-span-2">
            <span className="text-muted-foreground">{t("operationalData")}: </span>
            <span className="font-medium">
              {Object.entries(snapshot.derivedData)
                .map(([key, val]) => {
                  const data = val as Record<string, unknown> | null;
                  return `${key}: ${data && typeof data === "object" && "total" in data ? data.total : JSON.stringify(val)}`;
                })
                .join(", ")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("review");
  switch (status) {
    case "completed":
      return <Badge variant="outline">{t("pending")}</Badge>;
    case "approved":
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          {t("approved")}
        </Badge>
      );
    case "rejected":
      return <Badge variant="destructive">{t("rejected")}</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

