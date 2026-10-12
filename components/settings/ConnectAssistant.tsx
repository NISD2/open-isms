"use client";

import { Bot } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";

/** The consent card of an AI assistant's sign-in: allow, or decline back to the assistant. */
export function ConnectAssistant({
  request,
  client,
  company,
  person,
  returnTo,
  denyUrl,
}: {
  request: string;
  client: string;
  company: string;
  person: string;
  returnTo: string;
  denyUrl: string;
}) {
  const t = useTranslations("settings.mcp.connect");
  const allow = trpc.user.allowMcpClient.useMutation({
    onSuccess: ({ url }) => window.location.assign(url),
    onError: (error) => toast.error(error.message || t("failed")),
  });

  return (
    <div className="space-y-5 rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <Bot className="size-6 text-primary" />
        <h1 className="text-xl font-semibold">{t("title")}</h1>
      </div>
      <p>{t("asks", { client, company })}</p>
      <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
        <li>{t("may", { person })}</li>
        <li>{t("mayNot")}</li>
        <li>{t("returnTo", { host: returnTo })}</li>
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={() => allow.mutate({ request })}
          disabled={allow.isPending || allow.isSuccess}
        >
          {t("allow")}
        </Button>
        <Button asChild variant="outline">
          <a href={denyUrl}>{t("deny")}</a>
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{t("disconnectHint")}</p>
    </div>
  );
}
