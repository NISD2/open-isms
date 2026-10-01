"use client";

import { Loader2, Paperclip, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { SimpleFileUpload } from "@/components/shared/SimpleFileUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc/client";
import type { Registers } from "./view";

const EMPTY = { name: "", provider: "", date: "" };

/** A training day as the person entered it: a calendar date, shown back as that same date. */
const dayOf = (locale: "de" | "en", date: Date) =>
  new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    timeZone: "UTC",
    dateStyle: "long",
  }).format(date);

/**
 * One line per member of management: who, with which provider, on which day, and the certificate
 * where there is one. The lines are the training register's own rows (`training_record`, marked
 * as management), so the requirement page and the training page show the same list.
 */
export function TrainingRecords({
  initial,
  locale,
}: {
  initial: Registers["training_record"];
  locale: "de" | "en";
}) {
  const t = useTranslations("durchgang.ui.training");
  const utils = trpc.useUtils();
  const { data = initial } = trpc.training.list.useQuery(undefined, {
    initialData: initial,
  });
  const rows = data.filter((row) => row.isManagement);
  const refresh = () => utils.training.list.invalidate();
  const create = trpc.training.create.useMutation({ onSuccess: refresh });
  const remove = trpc.training.delete.useMutation({ onSuccess: refresh });
  const certUpload = trpc.training.getCertificateUploadUrl.useMutation();
  const [form, setForm] = useState(EMPTY);
  const [cert, setCert] = useState<{ key: string; name: string } | null>(null);
  const ready = form.name.trim() && form.provider.trim() && form.date;

  const add = () => {
    if (!ready) return;
    create.mutate(
      {
        trainingType: "management",
        title: form.provider.trim(),
        participantName: form.name.trim(),
        isManagement: true,
        providerName: form.provider.trim(),
        completedAt: new Date(form.date),
        certificateFileKey: cert?.key ?? null,
      },
      {
        onSuccess: () => {
          setForm(EMPTY);
          setCert(null);
        },
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
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{row.participantName}</p>
                <p className="text-sm text-muted-foreground">
                  {[row.providerName, row.completedAt && dayOf(locale, row.completedAt)]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Paperclip className="size-3" />
                  {row.certificateFileKey ? t("withProof") : t("withoutProof")}
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
          ))}
        </ul>
      )}
      <div className="space-y-4 border-t bg-muted/30 px-5 py-5">
        <p className="text-sm font-semibold">{t("add")}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="dg-training-name">{t("name")}</Label>
            <Input
              id="dg-training-name"
              value={form.name}
              maxLength={255}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dg-training-provider">{t("provider")}</Label>
            <Input
              id="dg-training-provider"
              value={form.provider}
              maxLength={255}
              placeholder={t("providerPlaceholder")}
              onChange={(e) => setForm({ ...form, provider: e.target.value })}
            />
          </div>
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
        </div>
        <SimpleFileUpload
          label={t("proof")}
          hint={t("proofHint")}
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
