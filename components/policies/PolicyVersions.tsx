"use client";

import { History } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc/client";

/**
 * The texts management approved for one policy, newest first, each with its fingerprint. An edit
 * after an approval turns the policy back into a draft; the approved text stays readable here.
 */
export function PolicyVersions({ policyId }: { readonly policyId: string }) {
  const t = useTranslations("policies.versions");
  const [open, setOpen] = useState(false);
  const versions = trpc.policy.versions.useQuery({ policyId }, { enabled: open });

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        data-testid="row-versions"
        aria-label={t("open")}
        onClick={() => setOpen(true)}
      >
        <History className="h-4 w-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>
          {versions.data?.length === 0 && (
            <p className="text-sm text-muted-foreground">{t("none")}</p>
          )}
          <div className="max-h-[60vh] space-y-4 overflow-y-auto">
            {versions.data?.map((v) => (
              <section key={v.id} className="space-y-1 border-b pb-3 last:border-b-0">
                <p className="text-sm font-medium">
                  {t("approved", {
                    date: v.approvedOn,
                    role: v.approverRole.toUpperCase(),
                  })}
                </p>
                <p className="break-all font-mono text-xs text-muted-foreground">
                  SHA-256 {v.contentSha256}
                </p>
                <pre className="whitespace-pre-wrap text-sm">{v.content}</pre>
              </section>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
