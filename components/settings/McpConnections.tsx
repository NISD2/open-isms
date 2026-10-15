"use client";

import { Bot, KeyRound } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";

const BERLIN = "Europe/Berlin";

/**
 * The person's connected assistants in this company, each with its own way out: the pasted key
 * and every assistant that signed in. Ending one leaves the others connected.
 */
export function McpConnections() {
  const t = useTranslations("settings.mcp.connections");
  const tm = useTranslations("settings.mcp");
  const locale = useLocale();
  const utils = trpc.useUtils();
  const connections = trpc.user.mcpConnections.useQuery();
  const end = trpc.user.endMcpConnection.useMutation({
    onSettled: () => utils.user.mcpConnections.invalidate(),
    onError: () => toast.error(tm("failed")),
  });

  const day = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: BERLIN });
  const moment = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: BERLIN,
  });

  const rows = connections.data ?? [];
  if (connections.isPending) return null;

  return (
    <div className="mb-4">
      <h3 className="mb-2 text-sm font-medium">{t("title")}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("none")}</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {rows.map((row) => {
            const name = row.kind === "key" ? t("key") : (row.client ?? t("unnamed"));
            const Icon = row.kind === "key" ? KeyRound : Bot;
            return (
              <li key={row.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <Icon className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {t("since", { date: day.format(new Date(row.createdAt)) })}
                    {" · "}
                    {row.lastUsedAt
                      ? t("lastUsed", { date: moment.format(new Date(row.lastUsedAt)) })
                      : t("neverUsed")}
                  </span>
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={end.isPending}
                  onClick={() =>
                    end.mutate(
                      { id: row.id },
                      { onSuccess: () => toast.success(t("ended", { name })) },
                    )
                  }
                >
                  {t("end")}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
