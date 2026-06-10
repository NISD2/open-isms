"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ReviewActionsProps {
  statusId: string;
  currentStatus: string;
}

export function ReviewActions({ statusId, currentStatus }: ReviewActionsProps) {
  const t = useTranslations("review");
  const router = useRouter();
  const [showReject, setShowReject] = useState(false);
  const [feedback, setFeedback] = useState("");

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
      router.refresh();
    },
    onError: (err) => toast.error(err.message),
  });

  if (currentStatus !== "completed") {
    return (
      <p className="text-sm text-muted-foreground">
        {t("notReviewable", { status: currentStatus })}
      </p>
    );
  }

  const isPending = approve.isPending || reject.isPending;

  return (
    <div className="space-y-3">
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
              disabled={!feedback.trim() || isPending}
              onClick={() => reject.mutate({ statusId, feedback })}
            >
              {reject.isPending ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <X className="mr-1.5 h-3.5 w-3.5" />
              )}
              {t("confirmRejection")}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowReject(false);
                setFeedback("");
              }}
              disabled={isPending}
            >
              {t("cancel")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button
            onClick={() => approve.mutate({ statusId })}
            disabled={isPending}
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
            onClick={() => setShowReject(true)}
            disabled={isPending}
          >
            <X className="mr-1.5 h-3.5 w-3.5" />
            {t("rejectButton")}
          </Button>
        </div>
      )}
    </div>
  );
}
