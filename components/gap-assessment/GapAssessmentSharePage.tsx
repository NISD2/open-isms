"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GapAssessmentResults } from "./GapAssessmentResults";
import type { AssessmentScores, GapDomain, GapQuestion } from "@/lib/gap-assessment/schema";

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
  const [passwordInput, setPasswordInput] = useState("");
  const [submittedPassword, setSubmittedPassword] = useState<string | null>(null);

  const query = trpc.gapAssessment.getSharedByToken.useQuery(
    { token, password: submittedPassword ?? "" },
    {
      enabled: submittedPassword !== null,
      retry: false,
    },
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (passwordInput.length === 0) return;
    setSubmittedPassword(passwordInput);
  }

  if (query.data?.scores) {
    return (
      <GapAssessmentResults
        sessionId=""
        scores={query.data.scores as AssessmentScores}
        domains={domains}
        questions={questions}
        locale={locale}
        shared
      />
    );
  }

  const errorMessage = query.error
    ? query.error.data?.code === "TOO_MANY_REQUESTS"
      ? "Too many attempts. Please wait 15 minutes and try again."
      : query.error.data?.code === "NOT_FOUND"
        ? "This share link is invalid or has been revoked."
        : "Incorrect password."
    : null;

  return (
    <div className="container mx-auto flex min-h-[60vh] max-w-md items-center px-4 py-16">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Password-protected results</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Enter the password you received with this link to view the gap
              assessment results.
            </p>

            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
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
              disabled={query.isFetching || passwordInput.length === 0}
              className="w-full"
            >
              {query.isFetching ? "Checking..." : "View results"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
