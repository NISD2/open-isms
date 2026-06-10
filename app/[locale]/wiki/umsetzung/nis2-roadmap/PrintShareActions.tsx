"use client";

import { Printer, Mail } from "lucide-react";

interface Props {
  printLabel: string;
  shareLabel: string;
  shareSubject: string;
  shareBody: string;
}

export function PrintShareActions({
  printLabel,
  shareLabel,
  shareSubject,
  shareBody,
}: Props) {
  function handlePrint() {
    window.print();
  }

  function handleShare() {
    const url = window.location.href;
    const body = shareBody.replace("%URL%", url);
    const href = `mailto:?subject=${encodeURIComponent(shareSubject)}&body=${encodeURIComponent(body)}`;
    window.location.href = href;
  }

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <button
        type="button"
        onClick={handlePrint}
        className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
      >
        <Printer className="size-4" />
        {printLabel}
      </button>
      <button
        type="button"
        onClick={handleShare}
        className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
      >
        <Mail className="size-4" />
        {shareLabel}
      </button>
    </div>
  );
}
