"use client";

import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";

/** How long the button says "copied" before it offers to copy again. */
const COPIED_MS = 2000;

/**
 * The company's id, to copy: for support, and for an operator who sets PLATFORM_SUPPLIER_COMPANY_ID
 * to their own company without reading it out of the database.
 */
export function OrganizationId({ id }: { readonly id: string }) {
  const t = useTranslations("organization.organizationId");
  const [copied, setCopied] = useState(false);

  // Where the browser refuses the clipboard, the button stays as it is and the id is still one
  // click to select (select-all).
  const copy = () =>
    navigator.clipboard.writeText(id).then(
      () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), COPIED_MS);
      },
      () => {},
    );

  return (
    <div className="mt-6 rounded-3xl border bg-card px-6 py-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{t("label")}</p>
          <code className="mt-1 block break-all font-mono text-sm select-all">{id}</code>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={copy}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? t("copied") : t("copy")}
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{t("hint")}</p>
    </div>
  );
}
