"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { recordDay } from "@/lib/durchgang";
import { trpc } from "@/lib/trpc/client";
import type { Registers } from "./view";

/** A new row starts on today's Berlin day: a review is usually entered the day it is held. */
const blank = () => ({
  date: recordDay(new Date()),
  attendees: "",
  decisions: "",
  actions: "",
});

/** A review day as entered: a calendar date, shown back as that same date. */
const dayOf = (locale: "de" | "en", day: string) =>
  new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    timeZone: "UTC",
    dateStyle: "long",
  }).format(new Date(`${day}T00:00:00Z`));

/**
 * The management review register's own rows (`management_review`): when management looked at
 * how security stands, who took part, what it decided and what has to be done. The requirement
 * page shows the same list. Minutes are not uploaded here; the requirement page keeps that.
 */
export function ManagementReviews({
  initial,
  locale,
}: {
  initial: Registers["management_review"];
  locale: "de" | "en";
}) {
  const t = useTranslations("durchgang.ui.review");
  const utils = trpc.useUtils();
  const { data: rows = initial } = trpc.managementReview.list.useQuery(undefined, {
    initialData: initial,
  });
  const refresh = () => utils.managementReview.list.invalidate();
  const create = trpc.managementReview.create.useMutation({ onSuccess: refresh });
  const remove = trpc.managementReview.delete.useMutation({ onSuccess: refresh });
  const [form, setForm] = useState(blank);
  const ready = form.date && form.decisions.trim();

  const add = () => {
    if (!ready) return;
    create.mutate(
      {
        title: t("title", { date: dayOf(locale, form.date) }),
        reviewDate: form.date,
        attendees: form.attendees
          .split(",")
          .map((name) => name.trim())
          .filter(Boolean),
        decisions: form.decisions.trim(),
        actionItems: form.actions.trim() || null,
      },
      {
        onSuccess: () => setForm(blank()),
        onError: () => toast.error(t("failed")),
      },
    );
  };

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      {rows.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="divide-y">
          {rows.map((row) => (
            <li key={row.id} className="flex items-start gap-3 px-5 py-3.5">
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm font-medium">{row.title}</p>
                {row.attendees && row.attendees.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {row.attendees.join(", ")}
                  </p>
                )}
                {row.decisions && (
                  <p className="text-sm whitespace-pre-line">{row.decisions}</p>
                )}
                {row.actionItems && (
                  <p className="text-sm whitespace-pre-line text-muted-foreground">
                    {t("actionsPrefix")} {row.actionItems}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("remove")}
                disabled={remove.isPending}
                onClick={() => remove.mutate({ id: row.id })}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="space-y-4 border-t bg-muted/30 px-5 py-5">
        <p className="text-sm font-semibold">{t("add")}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="dg-review-date">{t("date")}</Label>
            <Input
              id="dg-review-date"
              type="date"
              className="max-w-48"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dg-review-attendees">{t("attendees")}</Label>
            <Input
              id="dg-review-attendees"
              value={form.attendees}
              maxLength={500}
              placeholder={t("attendeesHint")}
              onChange={(e) => setForm({ ...form, attendees: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dg-review-decisions">{t("decisions")}</Label>
          <Textarea
            id="dg-review-decisions"
            rows={3}
            value={form.decisions}
            placeholder={t("decisionsHint")}
            onChange={(e) => setForm({ ...form, decisions: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dg-review-actions">{t("actions")}</Label>
          <Textarea
            id="dg-review-actions"
            rows={3}
            value={form.actions}
            placeholder={t("actionsHint")}
            onChange={(e) => setForm({ ...form, actions: e.target.value })}
          />
        </div>
        <Button type="button" disabled={!ready || create.isPending} onClick={add}>
          {create.isPending ? <Loader2 className="animate-spin" /> : <Plus />}
          {t("save")}
        </Button>
      </div>
    </div>
  );
}
