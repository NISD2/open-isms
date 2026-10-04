"use client";

import { Check, Copy, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * How a buyer passes this page on: from their own mail client, or as a copied link. We never send
 * it ourselves, because a mail from us to their manager would be advertising nobody asked for.
 */
export function ForwardActions({ url }: { readonly url: string }) {
  const t = useTranslations("pricing.approval.forward");
  const [copied, setCopied] = useState(false);
  const mailto = `mailto:?subject=${encodeURIComponent(t("subject"))}&body=${encodeURIComponent(t("body", { url }))}`;
  // Wrapped so a browser without the clipboard API (plain http) rejects instead of throwing.
  const copy = () =>
    Promise.resolve()
      .then(() => navigator.clipboard.writeText(url))
      .then(() => setCopied(true))
      .catch(() => setCopied(false));
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">{t("label")}</span>
      <Button variant="outline" size="sm" asChild>
        <a href={mailto}>
          <Mail className="size-4" />
          {t("email")}
        </a>
      </Button>
      <Button variant="outline" size="sm" onClick={copy}>
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        {copied ? t("copied") : t("copy")}
      </Button>
    </div>
  );
}
