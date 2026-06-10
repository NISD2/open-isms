"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SimpleFileUploadProps {
  /** Called with the S3 file key after successful upload */
  onUploaded: (fileKey: string, fileName: string) => void;
  /** Called when file is removed */
  onRemoved?: () => void;
  /** Get presigned upload URL — caller provides the tRPC mutation */
  getUploadUrl: (file: { fileName: string; contentType: string; fileSize: number }) => Promise<{
    uploadUrl: string;
    fileKey: string;
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
  /** Error text */
  errorText: string;
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
    setUploading(true);
    try {
      const { uploadUrl, fileKey } = await getUploadUrl({
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
        fileSize: file.size,
      });
      const res = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type || "application/octet-stream",
          "x-amz-server-side-encryption": "AES256",
        },
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`Upload failed: ${res.status} ${res.statusText} ${body.slice(0, 200)}`);
      }
      setFileName(file.name);
      setHasFile(true);
      onUploaded(fileKey, file.name);
    } catch (err) {
      console.error("[file upload]", err);
      setError(errorText);
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
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={handleRemove}>
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
