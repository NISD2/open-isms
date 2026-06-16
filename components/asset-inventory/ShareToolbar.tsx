"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ShareToolbar() {
  const t = useTranslations("assetInventory");
  const [copied, setCopied] = useState(false);

  function copyLink() {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function mailtoLink(): string {
    if (typeof window === "undefined") return "";
    const url = window.location.href;
    const subject = encodeURIComponent(t("share.mailSubject"));
    const body = encodeURIComponent(
      t("share.mailBody", { url }),
    );
    return `mailto:?subject=${subject}&body=${body}`;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={copyLink}
        className="gap-1.5"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            {t("share.copied")}
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            {t("share.copyLink")}
          </>
        )}
      </Button>
      <Button variant="outline" size="sm" asChild className="gap-1.5">
        <a href={mailtoLink()}>
          <Mail className="h-3.5 w-3.5" />
          {t("share.sendEmail")}
        </a>
      </Button>
    </div>
  );
}
