/**
 * Document Parser — Client-side file → text extraction
 *
 * Extracts text from PDFs, DOCX, TXT, and RTF files entirely in the browser.
 * No server-side processing needed.
 *
 * Copied from the rechtsprechung project pattern, adapted for NIS2.
 *
 * Libraries:
 *   - unpdf:   PDF text extraction (lightweight alternative to pdf.js)
 *   - mammoth: DOCX text extraction
 *   - Native File API for TXT/RTF
 *
 * Install:
 *   bun add unpdf mammoth
 *
 * Usage:
 *   import { parseDocument, isSupported } from "@/lib/forms/document-parser";
 *
 *   const text = await parseDocument(file);
 */

// ============================================================================
// Supported types
// ============================================================================

export type SupportedFileType = "pdf" | "docx" | "doc" | "txt" | "rtf";

export const SUPPORTED_MIME_TYPES: Record<string, SupportedFileType> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/msword": "doc",
  "text/plain": "txt",
  "text/rtf": "rtf",
  "application/rtf": "rtf",
};

const SUPPORTED_EXTENSIONS: Record<string, SupportedFileType> = {
  ".pdf": "pdf",
  ".docx": "docx",
  ".doc": "doc",
  ".txt": "txt",
  ".rtf": "rtf",
};

/** File input accept string */
export const ACCEPT_STRING = ".pdf,.docx,.txt,.rtf";

/** Human-readable list */
export const SUPPORTED_FORMATS_LABEL = "PDF, DOCX, TXT";

// ============================================================================
// Public API
// ============================================================================

/**
 * Parse a file and extract its text content.
 * All processing happens client-side in the browser.
 */
export async function parseDocument(file: File): Promise<string> {
  const fileType = getFileType(file);

  if (!fileType) {
    throw new Error(`Nicht unterstütztes Dateiformat: ${file.name}`);
  }

  let rawText: string;

  switch (fileType) {
    case "pdf":
      rawText = await extractPdfText(file);
      break;
    case "docx":
      rawText = await extractDocxText(file);
      break;
    case "doc":
      throw new Error(
        "Das alte .doc Format wird nicht unterstützt. Bitte speichern Sie die Datei als .docx oder .pdf.",
      );
    case "txt":
    case "rtf":
      rawText = await extractTxtText(file);
      break;
    default:
      throw new Error(`Nicht unterstütztes Dateiformat: ${file.name}`);
  }

  return normalizeText(rawText);
}

/** Check if a file type is supported */
export function isSupported(file: File): boolean {
  return getFileType(file) !== null;
}

/** Detect file type from MIME type or extension */
export function getFileType(file: File): SupportedFileType | null {
  // Try MIME type first
  if (file.type && SUPPORTED_MIME_TYPES[file.type]) {
    return SUPPORTED_MIME_TYPES[file.type];
  }

  // Fall back to extension
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  return SUPPORTED_EXTENSIONS[ext] ?? null;
}

// ============================================================================
// Extractors (dynamic imports to avoid bundling unused libs)
// ============================================================================

async function extractPdfText(file: File): Promise<string> {
  const { extractText } = await import("unpdf");
  const arrayBuffer = await file.arrayBuffer();
  const { text } = await extractText(new Uint8Array(arrayBuffer));
  return Array.isArray(text) ? text.join("\n\n") : text;
}

async function extractDocxText(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

async function extractTxtText(file: File): Promise<string> {
  return await file.text();
}

// ============================================================================
// Text normalization
// ============================================================================

/**
 * Clean up extracted text: normalize whitespace, remove control chars,
 * fix common OCR artifacts, truncate if too long.
 */
export function normalizeText(text: string, maxLength = 15000): string {
  let normalized = text
    // Replace multiple spaces with single space
    .replace(/[ \t]+/g, " ")
    // Replace 3+ newlines with double newline
    .replace(/\n{3,}/g, "\n\n")
    // Trim each line
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    // Remove control characters
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    // Remove replacement character
    .replace(/\uFFFD/g, "")
    // Non-breaking space → regular space
    .replace(/\u00A0/g, " ")
    // Fix smart quotes and dashes (common in German documents)
    .replace(/[""„]/g, '"')
    .replace(/[''‚]/g, "'")
    .replace(/…/g, "...")
    .replace(/–/g, "-")
    .replace(/—/g, " - ")
    .trim();

  if (normalized.length > maxLength) {
    normalized = normalized.slice(0, maxLength) + "\n\n[... Text gekürzt]";
  }

  return normalized;
}
