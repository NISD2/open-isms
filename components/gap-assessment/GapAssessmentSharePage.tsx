"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  AssessmentScores,
  GapDomain,
  GapQuestion,
} from "@/lib/gap-assessment/schema";
import { trpc } from "@/lib/trpc/client";
import { GapAssessmentResults } from "./GapAssessmentResults";

interface GapAssessmentSharePageProps {
  token: string;
  locale: string;
  domains: GapDomain[];
  questions: GapQuestion[];
}

export function GapAssessmentSharePage({
  token,
  locale,
  domains,
  questions,
}: GapAssessmentSharePageProps) {
  const t = useTranslations("gap-assessment.share");
  const [passwordInput, setPasswordInput] = useState("");

  // The page shows its own error; an empty handler keeps the app-wide toast out of it.
  const unlock = trpc.gapAssessment.openShared.useMutation({ onError: () => {} });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (passwordInput.length === 0) return;
    unlock.mutate({ token, password: passwordInput });
  }

  if (unlock.data?.scores) {
    return (
      <GapAssessmentResults
        sessionId=""
        scores={unlock.data.scores as AssessmentScores}
        domains={domains}
        questions={questions}
        locale={locale}
        shared
      />
    );
  }

  const errorMessage = unlock.error
    ? unlock.error.data?.code === "TOO_MANY_REQUESTS"
      ? t("tooManyAttempts")
      : unlock.error.data?.code === "NOT_FOUND"
        ? t("invalidLink")
        : t("wrongPassword")
    : null;

  return (
    <div className="container mx-auto flex min-h-[60vh] max-w-md items-center px-4 py-16">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-muted-foreground text-sm">{t("intro")}</p>

            <div className="space-y-1">
              <Label htmlFor="password">{t("password")}</Label>
              <Input
                id="password"
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                autoFocus
                autoComplete="off"
                required
                maxLength={64}
              />
            </div>

            {errorMessage ? (
              <p className="text-destructive text-sm">{errorMessage}</p>
            ) : null}

            <Button
              type="submit"
              disabled={unlock.isPending || passwordInput.length === 0}
              className="w-full"
            >
              {unlock.isPending ? t("checking") : t("submit")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
