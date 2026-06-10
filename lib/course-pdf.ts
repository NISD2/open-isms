/**
 * Course PDF version tracking and filename mapping.
 * Bump COURSE_PDF_VERSION here when a new PDF is compiled and placed in public/downloads/.
 */
export const COURSE_PDF_VERSION = "v1.0.0";

export const COURSE_PDF_FILES: Record<string, string> = {
  en: `nis2-management-training-${COURSE_PDF_VERSION}-en.pdf`,
  de: `nis2-management-training-${COURSE_PDF_VERSION}-de.pdf`,
};

export function getCoursePdfFilename(locale: string): string | null {
  return COURSE_PDF_FILES[locale] ?? null;
}
