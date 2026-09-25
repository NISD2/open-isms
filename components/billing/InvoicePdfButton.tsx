"use client";

import { Download, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";

/** Asks for a short-lived link to our archived copy only when clicked, so no link sits in the page. */
export function InvoicePdfButton({ invoiceId }: { readonly invoiceId: string }) {
  const t = useTranslations("billing.page");
  const pdf = trpc.billing.invoicePdf.useMutation({
    onSuccess: ({ url }) => window.open(url, "_blank", "noopener"),
  });
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pdf.isPending}
      onClick={() => pdf.mutate({ invoiceId })}
    >
      {pdf.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <Download className="h-4 w-4" aria-hidden />
      )}
      {t("download")}
    </Button>
  );
}
