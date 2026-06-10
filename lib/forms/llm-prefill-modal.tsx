"use client";

/**
 * LLMPrefillModal — Paste text OR drag-and-drop files, extract structured data, prefill a form
 */
import { useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { Loader2, SparklesIcon, FileUpIcon } from "lucide-react";
import type { UseLLMPrefillReturn } from "./use-llm-prefill";
import {
  parseDocument,
  isSupported,
  ACCEPT_STRING,
  SUPPORTED_FORMATS_LABEL,
} from "./document-parser";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ============================================================================
// Prefill Button
// ============================================================================

interface LLMPrefillButtonProps {
  open: () => void;
  isLoading?: boolean;
  className?: string;
}

export function LLMPrefillButton({
  open,
  isLoading,
  className,
}: LLMPrefillButtonProps) {
  const t = useTranslations("llm");

  return (
    <Button
      type="button"
      variant="outline"
      onClick={open}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <SparklesIcon className="mr-2 h-4 w-4" />
      )}
      {t("title")}
    </Button>
  );
}

// ============================================================================
// Prefill Modal
// ============================================================================

interface LLMPrefillModalProps extends UseLLMPrefillReturn {
  title?: string;
  description?: string;
  placeholder?: string;
  submitLabel?: string;
}

export function LLMPrefillModal({
  isOpen,
  close,
  isLoading,
  error,
  filledCount,
  submit,
  title,
  description,
  placeholder,
  submitLabel,
}: LLMPrefillModalProps) {
  const t = useTranslations("llm");
  const tc = useTranslations("common");

  const resolvedTitle = title ?? t("extractTitle");
  const resolvedDescription = description ?? t("extractDescription");
  const resolvedPlaceholder = placeholder ?? t("extractPlaceholder");
  const resolvedSubmitLabel = submitLabel ?? t("extractButton");

  const [text, setText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const busy = isLoading || isParsing;

  const processFile = useCallback(async (file: File) => {
    if (!isSupported(file)) {
      setParseError(
        t("unsupportedFormat", { name: file.name, formats: SUPPORTED_FORMATS_LABEL }),
      );
      return;
    }

    setIsParsing(true);
    setParseError(null);
    setFileName(file.name);

    try {
      const extracted = await parseDocument(file);
      if (extracted.trim()) {
        setText(extracted);
      } else {
        setParseError(t("noText"));
      }
    } catch (err) {
      setParseError(
        err instanceof Error ? err.message : t("fileError"),
      );
    } finally {
      setIsParsing(false);
    }
  }, [t]);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!busy) setIsDragging(true);
    },
    [busy],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (busy) return;
      const files = e.dataTransfer.files;
      if (files.length > 0) processFile(files[0]);
    },
    [busy, processFile],
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      e.target.value = "";
    },
    [processFile],
  );

  const handleSubmit = async () => {
    await submit(text);
  };

  const handleClose = () => {
    close();
    setText("");
    setFileName(null);
    setParseError(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>{resolvedTitle}</DialogTitle>
          <DialogDescription>{resolvedDescription}</DialogDescription>
        </DialogHeader>

        {/* Drop zone wrapping the textarea */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative rounded-md border transition-colors",
            isDragging
              ? "border-dashed border-primary bg-accent"
              : "border-input",
          )}
        >
          {isDragging && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-accent/90">
              <FileUpIcon className="mr-2 h-5 w-5 text-primary" />
              <p className="text-sm font-medium text-primary">
                {t("dropHere")}
              </p>
            </div>
          )}
          {isParsing && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/90">
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {t("processing")}
              </p>
            </div>
          )}
          <Textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setFileName(null);
            }}
            placeholder={resolvedPlaceholder}
            disabled={busy}
            rows={12}
            className="min-h-[200px] border-0 focus-visible:ring-0 resize-y"
          />
        </div>

        {/* File browse + info */}
        <div className="flex items-center gap-2 text-sm">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
          >
            <FileUpIcon className="mr-1.5 h-3.5 w-3.5" />
            {t("selectFile")}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT_STRING}
            onChange={handleFileInputChange}
            className="hidden"
          />
          {fileName ? (
            <span className="text-muted-foreground">{fileName}</span>
          ) : (
            <span className="text-muted-foreground/50">
              {SUPPORTED_FORMATS_LABEL}
            </span>
          )}
        </div>

        {/* Status */}
        {(error || parseError) && (
          <p className="text-sm text-destructive">{parseError || error}</p>
        )}
        {filledCount > 0 && !error && (
          <p className="text-sm text-green-600">
            {t("fieldsFilled", { count: filledCount })}
          </p>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={busy}>
            {tc("cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={busy || !text.trim()}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? t("extracting") : resolvedSubmitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
