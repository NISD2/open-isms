"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Download, CheckCircle2, Lock, Pencil } from "lucide-react";

interface CertificateDownloadProps {
  courseId: string;
  locale: string;
  allCompleted: boolean;
  completedCount: number;
  totalCount: number;
  userName: string | null;
}

export function CertificateDownload({
  courseId,
  locale,
  allCompleted,
  completedCount,
  totalCount,
  userName,
}: CertificateDownloadProps) {
  const t = useTranslations("trainingPortal.certificate");
  const remaining = totalCount - completedCount;
  const router = useRouter();
  const [name, setName] = useState(userName ?? "");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();
  const updateName = trpc.user.updateName.useMutation();

  if (!allCompleted) {
    return (
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="size-4 text-muted-foreground" />
            {t("lockedTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t("lockedText", { remaining, total: totalCount })}
          </p>
          <div className="mt-3 h-2 w-full rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  function handleDownload() {
    window.open(
      `/api/training/certificate?courseId=${courseId}&locale=${locale}`,
      "_blank",
    );
  }

  function startEditing() {
    setDraft(name);
    setEditing(true);
  }

  function handleSave() {
    const trimmed = draft.trim();
    if (!trimmed) return;

    startTransition(async () => {
      try {
        await updateName.mutateAsync({ name: trimmed });
        setName(trimmed);
        setEditing(false);
        toast.success(t("nameSaved"));
        router.refresh();
      } catch {
        toast.error(t("nameSaveError"));
      }
    });
  }

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CheckCircle2 className="size-4 text-primary" />
          {t("completeTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {t("completeText", { total: totalCount })}
        </p>
        <div className="rounded-md border bg-background p-3">
          <label
            htmlFor="certificate-name"
            className="text-xs font-medium text-muted-foreground"
          >
            {t("nameLabel")}
          </label>
          {editing ? (
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <Input
                id="certificate-name"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") setEditing(false);
                }}
                maxLength={255}
                autoFocus
                placeholder={t("namePlaceholder")}
                disabled={isPending}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isPending || draft.trim().length === 0}
                >
                  {t("save")}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditing(false)}
                  disabled={isPending}
                >
                  {t("cancel")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="text-sm font-medium">
                {name || t("noNameSet")}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5"
                onClick={startEditing}
              >
                <Pencil className="size-3.5" />
                {t("edit")}
              </Button>
            </div>
          )}
          <p className="mt-2 text-xs text-muted-foreground">{t("nameHint")}</p>
        </div>
        <Button onClick={handleDownload} className="gap-2" disabled={editing}>
          <Download className="size-4" />
          {t("download")}
        </Button>
        <p className="text-xs text-muted-foreground">
          {editing ? t("finishEditingHint") : t("downloadHint")}
        </p>
      </CardContent>
    </Card>
  );
}
