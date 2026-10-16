"use client";

import { Check, Copy, KeyRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { RECENT_SIGN_IN_S } from "@/lib/auth/session-age";
import { trpc } from "@/lib/trpc/client";
import { signInAgain } from "./ConnectAssistant";
import { McpConnections } from "./McpConnections";

/**
 * Connecting AI assistants (MCP, lib/mcp): a key to paste into an assistant that has no sign-in of
 * its own, shown once, the assistants connected now, each with its own way out, and one button
 * that ends them all.
 * Every tool works in the Durchgang, so an account that may not walk it gets no key, only the way
 * there; disconnecting stays, for assistants connected before the walk was locked again.
 */
export function McpKeySettings({
  docsUrl,
  mayWalk,
  companyId,
  allowed,
  isAdmin,
}: {
  docsUrl: string;
  mayWalk: boolean;
  /** The company this page shows; the key is made for it, or refused if another is open now. */
  companyId: string;
  /** Whether the company's admin lets its people connect assistants. */
  allowed: boolean;
  isAdmin: boolean;
}) {
  const t = useTranslations("settings.mcp");
  const usable = mayWalk && allowed;
  const [key, setKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const utils = trpc.useUtils();
  const create = trpc.user.createMcpKey.useMutation({
    onSuccess: (result) => {
      setKey(result.key);
      setCopied(false);
      void utils.user.mcpConnections.invalidate();
    },
    // A key asks for a sign-in from the last few minutes; that answer is shown on the card.
    onError: (error) => {
      if (error.message === "reauth") return;
      toast.error(
        error.message === "assistants_off"
          ? t("off")
          : error.data?.code === "CONFLICT"
            ? t("companyChanged")
            : t("failed"),
      );
    },
  });
  const needsSignIn = create.error?.message === "reauth";
  const disconnect = trpc.user.disconnectMcp.useMutation({
    onSuccess: () => {
      setKey(null);
      toast.success(t("disconnected"));
      void utils.user.mcpConnections.invalidate();
    },
    onError: () => toast.error(t("failed")),
  });

  // Absent on a plain-http self-host; the key stays selectable in its field.
  const copy = async () => {
    if (!key) return;
    try {
      await navigator.clipboard.writeText(key);
      setCopied(true);
    } catch {
      toast.error(t("copyFailed"));
    }
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

      {!mayWalk && (
        <p className="mb-4 rounded-lg border bg-muted/40 px-4 py-3 text-sm">
          {t("locked")}{" "}
          <Link
            href="/durchgang/nis2"
            className="font-medium underline underline-offset-2"
          >
            {t("toWalk")}
          </Link>
        </p>
      )}

      {mayWalk && !allowed && (
        <p className="mb-4 rounded-lg border bg-muted/40 px-4 py-3 text-sm">
          {isAdmin ? t("offAdmin") : t("off")}
        </p>
      )}

      {needsSignIn && (
        <p className="mb-4 rounded-lg border bg-muted/40 px-4 py-3 text-sm">
          {t("reauth", { minutes: RECENT_SIGN_IN_S / 60 })}
        </p>
      )}

      <McpConnections onKeyEnded={() => setKey(null)} />

      <div className="flex flex-wrap gap-2">
        {usable && needsSignIn && (
          <Button type="button" onClick={signInAgain}>
            {t("signInAgain")}
          </Button>
        )}
        {usable && !needsSignIn && (
          <Button
            type="button"
            onClick={() => create.mutate({ companyId })}
            disabled={create.isPending || disconnect.isPending}
          >
            <KeyRound className="size-4" />
            {key ? t("createAgain") : t("create")}
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={() => disconnect.mutate()}
          disabled={create.isPending || disconnect.isPending}
        >
          {t("disconnect")}
        </Button>
      </div>
      {usable && <p className="mt-2 text-xs text-muted-foreground">{t("replaceNote")}</p>}
    </div>
  );
}
