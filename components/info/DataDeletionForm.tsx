"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type DataDeletionMode = "verified" | "public" | "gone";

interface Props {
  mode: DataDeletionMode;
  email: string | null;
  token: string | null;
  userId: string | null;
}

export function DataDeletionForm({ mode, email, token, userId }: Props) {
  const t = useTranslations("dataDeletion");
  const [feedback, setFeedback] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [hadFeedback, setHadFeedback] = useState(false);

  const submit = trpc.dataRequest.submit.useMutation({
    onSuccess: () => {
      setHadFeedback(feedback.trim().length > 0);
      setSubmitted(true);
    },
  });

  if (submitted) {
    return (
      <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">{t("confirm.title")}</h2>
        </div>
        <p className="text-sm text-muted-foreground">{t("confirm.body")}</p>
        {hadFeedback && (
          <p className="text-sm text-muted-foreground">{t("confirm.feedbackNoted")}</p>
        )}
      </div>
    );
  }

  const isPublic = mode === "public";

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        submit.mutate({
          token: token ?? undefined,
          userId: userId ?? undefined,
          email: isPublic ? emailInput.trim() : undefined,
          feedback: feedback.trim() || undefined,
        });
      }}
    >
      <p className="text-muted-foreground">
        {isPublic ? t("publicIntro") : t("verifiedIntro", { email: email ?? "" })}
      </p>

      {isPublic && (
        <div className="space-y-2">
          <Label htmlFor="dd-email">{t("emailLabel")}</Label>
          <Input
            id="dd-email"
            type="email"
            required
            autoComplete="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder={t("emailPlaceholder")}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="dd-feedback">{t("feedbackLabel")}</Label>
        <Textarea
          id="dd-feedback"
          rows={4}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder={t("feedbackPlaceholder")}
        />
      </div>

      {submit.isError && <p className="text-sm text-destructive">{t("error")}</p>}

      <Button type="submit" disabled={submit.isPending}>
        {submit.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> {t("submitting")}
          </>
        ) : (
          t("submit")
        )}
      </Button>
    </form>
  );
}
