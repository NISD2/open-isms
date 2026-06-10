"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";

/**
 * Detects ?download=1 after sign-in callback, triggers the PDF download,
 * then strips the query param to stay on the training page.
 */
export function DownloadTrigger() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();

  useEffect(() => {
    if (searchParams.get("download") !== "1") return;

    // Start the file download in the current locale
    window.location.href = `/api/download/course-pdf?locale=${locale}`;

    // Strip the download param to stay on the training page
    const timer = setTimeout(() => {
      router.replace("/training/nis2-ceo");
    }, 1500);

    return () => clearTimeout(timer);
  }, [searchParams, router]);

  return null;
}
