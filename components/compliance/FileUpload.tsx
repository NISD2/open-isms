"use client";

import { useCallback, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileIcon,
  Loader2,
  Trash2,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { formatFileSize } from "@/lib/utils";

interface FileUploadProps {
  requirementStatusId: string;
  disabled?: boolean;
}

async function computeSHA256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function FileUpload({ requirementStatusId, disabled }: FileUploadProps) {
  const t = useTranslations("evidence");
  const locale = useLocale();
  const [uploading, setUploading] = useState(false);

  const utils = trpc.useUtils();
  const { data: files, isLoading } = trpc.evidence.listByRequirementStatus.useQuery(
    { requirementStatusId },
    { enabled: !!requirementStatusId }
  );
  const createUploadUrl = trpc.evidence.createUploadUrl.useMutation();
  const confirmUpload = trpc.evidence.confirmUpload.useMutation();
  const deleteEvidence = trpc.evidence.deleteEvidence.useMutation();

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      try {
        // 1. Get presigned URL
        const { uploadUrl, evidenceId } =
          await createUploadUrl.mutateAsync({
            requirementStatusId,
            fileName: file.name,
            fileType: file.type || "application/octet-stream",
            fileSize: file.size,
          });

        // 2. Upload directly to S3. SSE header must match server-signed value or S3 returns 403.
        const putRes = await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type || "application/octet-stream",
            "x-amz-server-side-encryption": "AES256",
          },
        });
        if (!putRes.ok) {
          const body = await putRes.text().catch(() => "");
          throw new Error(`S3 upload failed: ${putRes.status} ${putRes.statusText} ${body.slice(0, 200)}`);
        }

        // 3. Compute hash + confirm
        const contentHash = await computeSHA256(file);
        await confirmUpload.mutateAsync({ evidenceId, contentHash });

        // 4. Refresh the file list
        utils.evidence.listByRequirementStatus.invalidate({
          requirementStatusId,
        });
      } catch (err) {
        console.error("[evidence upload]", err);
        toast.error(t("uploadFailed"));
      } finally {
        setUploading(false);
        // Reset input
        e.target.value = "";
      }
    },
    [requirementStatusId, createUploadUrl, confirmUpload, utils]
  );

  const handleDelete = useCallback(
    async (evidenceId: string) => {
      try {
        await deleteEvidence.mutateAsync({ evidenceId });
        utils.evidence.listByRequirementStatus.invalidate({
          requirementStatusId,
        });
      } catch {
        toast.error(t("deleteFailed"));
      }
    },
    [deleteEvidence, utils, requirementStatusId, t]
  );

  return (
    <div className="space-y-3">
      {/* Existing files */}
      {isLoading && (
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      )}

      {files && files.length > 0 && (
        <div className="space-y-2">
          {files.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="truncate block">{f.fileName}</span>
                <span className="text-xs text-muted-foreground">
                  {f.uploadedAt ? formatDate(f.uploadedAt, locale) : ""}
                  {f.fileSize ? ` · ${formatFileSize(f.fileSize)}` : ""}
                </span>
              </div>

              {f.downloadUrl && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  asChild
                >
                  <a href={f.downloadUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="h-3.5 w-3.5" />
                  </a>
                </Button>
              )}

              {!disabled && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  data-testid="evidence-delete"
                  onClick={() => handleDelete(f.id)}
                  disabled={deleteEvidence.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload input */}
      {!disabled && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              type="file"
              data-testid="evidence-file-input"
              onChange={handleFileChange}
              disabled={uploading}
              accept=".pdf,.docx,.xlsx,.doc,.xls,.png,.jpg,.jpeg,.gif,.txt,.csv"
            />
          </div>
          {uploading && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t("uploading")}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatDate(date: Date | string, locale: string): string {
  return new Date(date).toLocaleString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
