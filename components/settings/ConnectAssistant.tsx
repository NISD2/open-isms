"use client";

import { Bot } from "lucide-react";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { RECENT_SIGN_IN_S } from "@/lib/auth/session-age";
import { trpc } from "@/lib/trpc/client";

/** Signs out and back in, landing on the page the person is on, as account deletion does. */
export const signInAgain = () =>
  signOut({
    callbackUrl: `/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`,
  });

/**
 * The consent card of an AI assistant's sign-in: allow, or decline back to the assistant. An
 * account that may not walk the Durchgang, where every tool works, is shown the way there and can
 * only decline. Allowing asks for a sign-in from the last few minutes (user.allowMcpClient), so
 * an older session is sent to sign in again and comes back to this page.
 */
export function ConnectAssistant({
  request,
  client,
  company,
  person,
  returnTo,
  denyUrl,
  mayWalk,
  signedInRecently,
}: {
  request: string;
  /** The name the assistant gave itself when it registered; null when it gave none. */
  client: string | null;
  company: string;
  person: string;
  returnTo: string;
  denyUrl: string;
  mayWalk: boolean;
  signedInRecently: boolean;
}) {
  const t = useTranslations("settings.mcp.connect");
  const tm = useTranslations("settings.mcp");
  const allow = trpc.user.allowMcpClient.useMutation({
    onSuccess: ({ url }) => window.location.assign(url),
    // A sign-in that aged on the page is answered on the card; otherwise the request ran out.
    onError: (error) => {
      if (error.message === "reauth") return;
      toast.error(error.data?.code === "BAD_REQUEST" ? t("expired") : t("failed"));
    },
  });
  const needsSignIn = !signedInRecently || allow.error?.message === "reauth";

  return (
    <div className="space-y-5 rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <Bot className="size-6 text-primary" />
        <h1 className="text-xl font-semibold">{t("title")}</h1>
      </div>
      <p>{t("asks", { client: client ?? t("unnamed"), company })}</p>
      {mayWalk ? (
        <>
          {/* Where the access goes is the one fact a client cannot choose, so it comes first. */}
          {/* Anyone can register a client under any name, so the warning stands on every request. */}
          <p className="rounded-lg border bg-muted/40 px-4 py-3 text-sm">
            <span className="font-medium">{t("returnTo", { host: returnTo })}</span>
            {client && <> {t("selfNamed", { client })}</>} {t("onlyYou")}
          </p>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            <li>{t("may", { person })}</li>
            <li>{t("mayNot")}</li>
          </ul>
          {needsSignIn && (
            <p className="rounded-lg border bg-muted/40 px-4 py-3 text-sm">
              {tm("reauth", { minutes: RECENT_SIGN_IN_S / 60 })}
            </p>
          )}
        </>
      ) : (
        <p className="rounded-lg border bg-muted/40 px-4 py-3 text-sm">{tm("locked")}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {mayWalk && needsSignIn ? (
          <Button type="button" onClick={signInAgain}>
            {tm("signInAgain")}
          </Button>
        ) : mayWalk ? (
          <Button
            type="button"
            onClick={() => allow.mutate({ request })}
            disabled={allow.isPending || allow.isSuccess}
          >
            {t("allow")}
          </Button>
        ) : (
          <Button asChild>
            <Link href="/durchgang/nis2">{tm("toWalk")}</Link>
          </Button>
        )}
        <Button asChild variant="outline">
          <a href={denyUrl}>{t("deny")}</a>
        </Button>
      </div>
      {mayWalk && <p className="text-xs text-muted-foreground">{t("disconnectHint")}</p>}
    </div>
  );
}
