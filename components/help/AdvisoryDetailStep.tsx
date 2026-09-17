"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ADVISORY_SIZES,
  ADVISORY_TIMEFRAMES,
  ADVISORY_TRIGGERS,
  type AdvisorySize,
  type AdvisoryTimeframe,
  type AdvisoryTrigger,
} from "@/lib/advisory-options";
import { trpc } from "@/lib/trpc/client";

/**
 * Step two, shown only once the request is already stored.
 *
 * Everything here makes the request worth more to a partner firm, and not one
 * field is worth risking the request itself. Abandoning this screen costs us
 * detail. The same fields on a single long form would have cost us the lead.
 *
 * Which is also why there is a visible way out: an ask that cannot be declined
 * is the thing people close the tab on.
 */
export function AdvisoryDetailStep({
  requestId,
  onDone,
}: {
  requestId: string;
  onDone: () => void;
}) {
  const t = useTranslations("help.request");

  const [trigger, setTrigger] = useState<AdvisoryTrigger | "">("");
  const [timeframe, setTimeframe] = useState<AdvisoryTimeframe | "">("");
  const [companySize, setCompanySize] = useState<AdvisorySize | "">("");
  const [companyName, setCompanyName] = useState("");
  const [note, setNote] = useState("");

  const enrich = trpc.advisory.enrich.useMutation({ onSuccess: onDone });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (enrich.isPending) return;
    enrich.mutate({
      id: requestId,
      trigger: trigger === "" ? undefined : trigger,
      timeframe: timeframe === "" ? undefined : timeframe,
      companySize: companySize === "" ? undefined : companySize,
      companyName: companyName.trim() || undefined,
      note: note.trim() || undefined,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-lg border bg-card p-5"
      aria-labelledby="advisory-detail-heading"
    >
      <div className="flex items-start gap-3">
        <CheckCircle2
          className="mt-0.5 size-5 shrink-0 text-primary"
          aria-hidden="true"
        />
        <div className="space-y-1">
          <p id="advisory-detail-heading" className="font-semibold">
            {t("success.heading")}
          </p>
          <p className="text-sm text-muted-foreground">{t("detail.intro")}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="advisory-company">{t("fields.companyName")}</Label>
          <Input
            id="advisory-company"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            maxLength={500}
            autoComplete="organization"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="advisory-trigger">{t("fields.trigger")}</Label>
          <Select value={trigger} onValueChange={(v) => setTrigger(v as AdvisoryTrigger)}>
            <SelectTrigger id="advisory-trigger">
              <SelectValue placeholder={t("placeholders.select")} />
            </SelectTrigger>
            <SelectContent>
              {ADVISORY_TRIGGERS.map((value) => (
                <SelectItem key={value} value={value}>
                  {t(`triggers.${value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="advisory-timeframe">{t("fields.timeframe")}</Label>
            <Select
              value={timeframe}
              onValueChange={(v) => setTimeframe(v as AdvisoryTimeframe)}
            >
              <SelectTrigger id="advisory-timeframe">
                <SelectValue placeholder={t("placeholders.select")} />
              </SelectTrigger>
              <SelectContent>
                {ADVISORY_TIMEFRAMES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`timeframes.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="advisory-size">{t("fields.companySize")}</Label>
            <Select
              value={companySize}
              onValueChange={(v) => setCompanySize(v as AdvisorySize)}
            >
              <SelectTrigger id="advisory-size">
                <SelectValue placeholder={t("placeholders.select")} />
              </SelectTrigger>
              <SelectContent>
                {ADVISORY_SIZES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`sizes.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="advisory-note">{t("fields.note")}</Label>
          <Textarea
            id="advisory-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={2000}
            rows={3}
            placeholder={t("placeholders.note")}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={enrich.isPending} className="gap-2">
          {enrich.isPending && (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          )}
          {t("detail.cta")}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          {t("detail.skip")}
        </Button>
      </div>
    </form>
  );
}
