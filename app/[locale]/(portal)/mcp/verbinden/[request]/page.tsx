import { getTranslations } from "next-intl/server";
import { ConnectAssistant } from "@/components/settings/ConnectAssistant";
import { getSession } from "@/lib/auth";
import { epochSeconds } from "@/lib/auth/session-age";
import { issuer } from "@/lib/mcp/config";
import { instanceKey } from "@/lib/mcp/instance-key";
import { deny, readRequest } from "@/lib/mcp/oauth";
import { api } from "@/lib/trpc/server";

/**
 * Where an AI assistant's sign-in asks the person to allow it (lib/mcp/oauth.ts): which assistant,
 * for which company, as whom, and where the browser goes back to. Allowing hands the assistant a
 * code; declining sends it the refusal.
 */
export default async function ConnectAssistantPage({
  params,
}: {
  params: Promise<{ request: string }>;
}) {
  const { request: raw } = await params;
  const request = readRequest(instanceKey(), raw, epochSeconds(new Date()));
  const [t, session, company] = await Promise.all([
    getTranslations("settings.mcp.connect"),
    getSession(),
    api.assessment.getCompany(),
  ]);

  return (
    <div className="mx-auto max-w-lg py-10">
      {request && company ? (
        <ConnectAssistant
          request={raw}
          client={request.client ?? t("unnamed")}
          company={company.name}
          person={session?.user.name ?? session?.user.email ?? ""}
          returnTo={new URL(request.redirectUri).host}
          denyUrl={deny(request, issuer())}
        />
      ) : (
        <p className="text-sm text-muted-foreground">{t("expired")}</p>
      )}
    </div>
  );
}
