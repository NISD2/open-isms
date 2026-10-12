"use client";

import { Check, Copy, KeyRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc/client";

/**
 * Connecting AI assistants (MCP, lib/mcp): a key to paste into an assistant that has no sign-in of
 * its own, shown once, and one button that ends the key and every assistant connected before.
 */
export function McpKeySettings({ docsUrl }: { docsUrl: string }) {
  const t = useTranslations("settings.mcp");
  const [key, setKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const create = trpc.user.createMcpKey.useMutation({
    onSuccess: (result) => {
      setKey(result.key);
      setCopied(false);
    },
    onError: () => toast.error(t("failed")),
  });
  const disconnect = trpc.user.disconnectMcp.useMutation({
    onSuccess: () => {
      setKey(null);
      toast.success(t("disconnected"));
    },
    onError: () => toast.error(t("failed")),
  });

  const copy = async () => {
    if (!key) return;
    await navigator.clipboard.writeText(key);
    setCopied(true);
  };

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold">{t("title")}</h2>
      <p className="mb-2 text-sm text-muted-foreground">{t("description")}</p>
      <p className="mb-4 text-sm text-muted-foreground">
        {t("signIn")}{" "}
        <a href={docsUrl} className="underline underline-offset-2">
          {t("howTo")}
        </a>
      </p>

      {key && (
        <div className="mb-4 space-y-2 rounded-lg border bg-muted/40 p-4">
          <p className="text-sm font-medium">{t("created")}</p>
          <div className="flex gap-2">
            <Input
              readOnly
              value={key}
              className="font-mono text-xs"
              aria-label={t("keyLabel")}
            />
            <Button type="button" variant="outline" onClick={copy}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? t("copied") : t("copy")}
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={() => create.mutate()}
          disabled={create.isPending || disconnect.isPending}
        >
          <KeyRound className="size-4" />
          {key ? t("createAgain") : t("create")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => disconnect.mutate()}
          disabled={create.isPending || disconnect.isPending}
        >
          {t("disconnect")}
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{t("replaceNote")}</p>
    </div>
  );
}
