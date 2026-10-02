"use client";

import {
  ExternalLink,
  GraduationCap,
  Loader2,
  Paperclip,
  Plus,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { SimpleFileUpload } from "@/components/shared/SimpleFileUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { recordDay, type TrainingAudience } from "@/lib/durchgang";
import { trpc } from "@/lib/trpc/client";
import type { Registers } from "./view";

type Row = Registers["training_record"][number];

/** A line as the form holds it, trimmed. */
interface Entered {
  readonly who: string;
  readonly what: string;
  readonly provider: string;
}

/** A new row starts on today's Berlin day: a training is usually entered the day it is held. */
const blank = () => ({
  who: "",
  what: "",
  provider: "",
  link: "",
  date: recordDay(new Date()),
});

/** Whether a training register row belongs to the audience a screen lists. */
export const inAudience = (
  row: Pick<Row, "isManagement">,
  audience: TrainingAudience,
): boolean => Boolean(row.isManagement) === (audience === "management");

/**
 * How each audience's line maps to the register's row. Management lines are one person and the
 * provider they trained with; staff lines are one session: what it covered and who took part.
 */
const AUDIENCE = {
  management: {
    labels: {
      who: "name",
      what: "provider",
      whatHint: "providerPlaceholder",
      empty: "empty",
      proofHint: "proofHint",
    },
    // The provider is the line's own second answer, so it is not asked twice.
    asksProvider: false,
    row: (entered: Entered) => ({
      trainingType: "management",
      isManagement: true,
      participantName: entered.who,
      title: entered.what,
      providerName: entered.what,
    }),
    line: (row: Row) => ({ head: row.participantName, detail: row.providerName }),
  },
  staff: {
    labels: {
      who: "staff.who",
      what: "staff.what",
      whatHint: "staff.whatHint",
      empty: "staff.empty",
      proofHint: "staff.proofHint",
    },
    asksProvider: true,
    row: (entered: Entered) => ({
      trainingType: "awareness",
      isManagement: false,
      participantName: entered.who,
      title: entered.what,
      providerName: entered.provider || null,
    }),
    line: (row: Row) => ({
      head: row.title,
      detail: [row.participantName, row.providerName].filter(Boolean).join(", "),
    }),
  },
} as const;

/** The name a training line goes by: the person for management, the topic for staff. */
export const headOf = (row: Row, audience: TrainingAudience): string | null =>
  AUDIENCE[audience].line(row).head;

/**
 * A training day as the person entered it: a calendar date, shown back as that same date. A
 * moment the platform recorded, such as a course's last lesson, is shown as its day in Berlin.
 */
const dayOf = (locale: "de" | "en", date: Date, timeZone = "UTC") =>
  new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    timeZone,
    dateStyle: "long",
  }).format(date);

/**
 * The training register's own rows (`training_record`) for one audience, with a form to add a
 * line and attach its proof: a certificate for a member of management, an attendance list for a
 * staff session. The requirement page and the training page show the same list.
 */
export function TrainingRecords({
  initial,
  locale,
  audience,
}: {
  initial: Registers["training_record"];
  locale: "de" | "en";
  audience: TrainingAudience;
}) {
  const t = useTranslations("durchgang.ui.training");
  const { labels, row: rowOf, line, asksProvider } = AUDIENCE[audience];
  const utils = trpc.useUtils();
  const { data = initial } = trpc.training.list.useQuery(undefined, {
    initialData: initial,
  });
  const rows = data.filter((row) => inAudience(row, audience));
  // Management also counts the platform's own course, read off each member's progress.
  const course = trpc.training.managementCourse.useQuery(undefined, {
    enabled: audience === "management",
  });
  const graduates = audience === "management" ? (course.data?.graduates ?? []) : [];
  const courseTitle = course.data?.title[locale] ?? course.data?.title.en ?? "";
  const refresh = () => utils.training.list.invalidate();
  const create = trpc.training.create.useMutation({ onSuccess: refresh });
  const remove = trpc.training.delete.useMutation({ onSuccess: refresh });
  const certUpload = trpc.training.getCertificateUploadUrl.useMutation();
  const [form, setForm] = useState(blank);
  const [cert, setCert] = useState<{ key: string; name: string } | null>(null);
  const ready = form.who.trim() && form.what.trim() && form.date;

  const add = () => {
    if (!ready) return;
    create.mutate(
      {
        ...rowOf({
          who: form.who.trim(),
          what: form.what.trim(),
          provider: form.provider.trim(),
        }),
        completedAt: new Date(form.date),
        certificateFileKey: cert?.key ?? null,
        sourceUrl: form.link.trim() || null,
      },
      {
        onSuccess: () => {
          setForm(blank());
          setCert(null);
        },
        onError: () => toast.error(t("failed")),
      },
    );
  };

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      {rows.length === 0 && graduates.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted-foreground">{t(labels.empty)}</p>
      ) : (
        <ul className="divide-y">
          {graduates.map((g) => (
            <li key={g.userId} className="flex items-start gap-3 px-5 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{g.name}</p>
                <p className="text-sm text-muted-foreground">
                  {[
                    courseTitle,
                    g.completedAt &&
                      dayOf(locale, new Date(g.completedAt), "Europe/Berlin"),
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <GraduationCap className="size-3" />
                  {t("onPlatform")}
                </p>
              </div>
            </li>
          ))}
          {rows.map((row) => {
            const { head, detail } = line(row);
            return (
              <li key={row.id} className="flex items-start gap-3 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{head}</p>
                  <p className="text-sm text-muted-foreground">
                    {[detail, row.completedAt && dayOf(locale, row.completedAt)]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Paperclip className="size-3" />
                      {row.certificateFileKey ? t("withProof") : t("withoutProof")}
                    </span>
                    {row.sourceUrl && (
                      // The address is checked as http or https when it is saved.
                      <a
                        href={row.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                      >
                        <ExternalLink className="size-3" />
                        {t("atProvider")}
                      </a>
                    )}
                  </p>
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
            );
          })}
        </ul>
      )}
      <div className="space-y-4 border-t bg-muted/30 px-5 py-5">
        <p className="text-sm font-semibold">{t("add")}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="dg-training-who">{t(labels.who)}</Label>
            <Input
              id="dg-training-who"
              value={form.who}
              maxLength={255}
              onChange={(e) => setForm({ ...form, who: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dg-training-what">{t(labels.what)}</Label>
            <Input
              id="dg-training-what"
              value={form.what}
              maxLength={255}
              placeholder={t(labels.whatHint)}
              onChange={(e) => setForm({ ...form, what: e.target.value })}
            />
          </div>
          {asksProvider && (
            <div className="space-y-1.5">
              <Label htmlFor="dg-training-provider">{t("staff.provider")}</Label>
              <Input
                id="dg-training-provider"
                value={form.provider}
                maxLength={255}
                placeholder={t("staff.providerHint")}
                onChange={(e) => setForm({ ...form, provider: e.target.value })}
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="dg-training-date">{t("date")}</Label>
            <Input
              id="dg-training-date"
              type="date"
              className="max-w-48"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="dg-training-link">{t("link")}</Label>
            <Input
              id="dg-training-link"
              type="url"
              inputMode="url"
              value={form.link}
              maxLength={2048}
              placeholder="https://"
              onChange={(e) => setForm({ ...form, link: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">{t("linkHint")}</p>
          </div>
        </div>
        <SimpleFileUpload
          label={t("proof")}
          hint={t(labels.proofHint)}
          uploadingText={t("uploading")}
          errorText={t("uploadFailed")}
          removeText={t("removeProof")}
          currentFileKey={cert?.key ?? null}
          currentFileName={cert?.name ?? null}
          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
          getUploadUrl={(file) => certUpload.mutateAsync(file)}
          onUploaded={(key, name) => setCert({ key, name })}
          onRemoved={() => setCert(null)}
        />
        <Button type="button" disabled={!ready || create.isPending} onClick={add}>
          {create.isPending ? <Loader2 className="animate-spin" /> : <Plus />}
          {t("save")}
        </Button>
      </div>
    </div>
  );
}
