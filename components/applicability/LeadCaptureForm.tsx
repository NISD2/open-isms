"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Mail, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc/client";

export function LeadCaptureForm({
  classification,
}: {
  classification?: string;
}) {
  const t = useTranslations("applicability");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const captureLead = trpc.applicability.captureLead.useMutation({
    onSuccess: () => setSubmitted(true),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || captureLead.isPending) return;
    captureLead.mutate({
      email,
      classification: classification ?? undefined,
      source: "applicability_check",
    });
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20 p-4 flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
        <p className="text-sm font-medium text-green-800 dark:text-green-200">
          {t("leadCapture.success")}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-5 space-y-3">
      <div>
        <h3 className="font-semibold text-base">{t("leadCapture.title")}</h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t("leadCapture.description")}
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("leadCapture.placeholder")}
            className="pl-10 h-11"
          />
        </div>
        <Button type="submit" disabled={captureLead.isPending} className="h-11 gap-2 shrink-0">
          {captureLead.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              {t("leadCapture.cta")}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>
      {captureLead.isError && (
        <p className="text-xs text-destructive">{t("leadCapture.error")}</p>
      )}
    </div>
  );
}
