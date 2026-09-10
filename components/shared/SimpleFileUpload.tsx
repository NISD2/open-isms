// biome-ignore-all lint/a11y/useSemanticElements: drop zone is a drag target, not a button
"use client";

// On the suppression above: the drop zone near the bottom of this file is a
// drag-and-drop target. A real <button> would still need the drop handlers,
// and role/tabIndex/the Enter-Space handler already give it button semantics.
// The rule reports on a JSX attribute, which cannot carry a targeted
// suppression, hence the file-scoped one. Inherited from the lint backlog by
// touching this file — the change here is the Content-Type fix (audit F-4),
// not a rewrite of the widget. Worth doing properly on its own.

import { FileText, Loader2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { exceedsUploadLimit, MAX_UPLOAD_MB } from "@/lib/storage/limits";
import { userFacingError } from "@/lib/trpc/error-message";
import { cn } from "@/lib/utils";

interface SimpleFileUploadProps {
  /** Called with the S3 file key after successful upload */
  onUploaded: (fileKey: string, fileName: string) => void;
  /** Called when file is removed */
  onRemoved?: () => void;
  /** Get presigned upload URL — caller provides the tRPC mutation */
  getUploadUrl: (file: {
    fileName: string;
    contentType: string;
    fileSize: number;
  }) => Promise<{
    uploadUrl: string;
    fileKey: string;
    /**
     * The content type the server actually signed into `uploadUrl`, when it
     * differs from what we asked for. Content-Type is a signed header, so the
     * PUT has to echo the signed value or S3 answers 403. Handlers that pin
     * the type with a Zod regex sign exactly what they were given and can
     * leave this unset (audit F-4).
     */
    contentType?: string;
  }>;
  /** Current file key (for edit mode) */
  currentFileKey?: string | null;
  /** Currently uploaded file name for display */
  currentFileName?: string | null;
  /** Accepted file types */
  accept?: string;
  /** Label text */
  label?: string;
  /** Hint text shown in the drop zone */
  hint: string;
  /** Loading/uploading text */
  uploadingText: string;
  /** Error text shown when the reason is not one we can name. */
  errorText: string;
  /** Error text for a file above the storage limit. Takes a `size` param. */
  tooLargeText?: (maxMb: number) => string;
  /** Remove button text */
  removeText: string;
  disabled?: boolean;
}

export function SimpleFileUpload({
  onUploaded,
  onRemoved,
  getUploadUrl,
  currentFileKey,
  currentFileName,
  accept = ".pdf,.png,.jpg,.jpeg,.doc,.docx",
  label,
  hint,
  uploadingText,
  errorText,
  tooLargeText,
  removeText,
  disabled = false,
}: SimpleFileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(currentFileName ?? null);
  const [hasFile, setHasFile] = useState(!!currentFileKey);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    // Caught here rather than at the presigner, which throws a bare Error the
    // client can only render as a generic failure.
    if (exceedsUploadLimit(file.size)) {
      setError(tooLargeText ? tooLargeText(MAX_UPLOAD_MB) : errorText);
      return;
    }
    setUploading(true);
    try {
      const requestedType = file.type || "application/octet-stream";
      const { uploadUrl, fileKey, contentType } = await getUploadUrl({
        fileName: file.name,
        contentType: requestedType,
        fileSize: file.size,
      });
      const res = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": contentType ?? requestedType,
          "x-amz-server-side-encryption": "AES256",
        },
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(
          `Upload failed: ${res.status} ${res.statusText} ${body.slice(0, 200)}`,
        );
      }
      setFileName(file.name);
      setHasFile(true);
      onUploaded(fileKey, file.name);
    } catch (err) {
      console.error("[file upload]", err);
      // Same rule as the evidence uploader: the server's own wording when the
      // server chose it, the generic string otherwise. The S3 PUT failure
      // thrown above deliberately falls into "otherwise" — its text carries
      // the storage response, which is not for the reader.
      setError(userFacingError(err, errorText));
    } finally {
      setUploading(false);
    }
  }

  function handleRemove() {
    setFileName(null);
    setHasFile(false);
    if (inputRef.current) inputRef.current.value = "";
    onRemoved?.();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div className="space-y-1.5">
      {label && <p className="text-sm font-medium">{label}</p>}
      {hasFile && fileName ? (
        <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm truncate flex-1">{fileName}</span>
          {!disabled && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={handleRemove}
            >
              <X className="h-3 w-3 mr-1" />
              {removeText}
            </Button>
          )}
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => !disabled && !uploading && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          className={cn(
            "flex flex-col items-center gap-1.5 rounded-md border-2 border-dashed p-4 transition-colors cursor-pointer",
            disabled
              ? "opacity-50 cursor-not-allowed"
              : "hover:border-primary/50 hover:bg-muted/30",
          )}
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="h-5 w-5 text-muted-foreground" />
          )}
          <span className="text-xs text-muted-foreground">
            {uploading ? uploadingText : hint}
          </span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
