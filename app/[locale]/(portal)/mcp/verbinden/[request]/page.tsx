import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ConnectTestClient } from "@/components/platform-admin/ConnectTestClient";
import { ConnectAssistant } from "@/components/settings/ConnectAssistant";
import { getSession } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { epochSeconds, isRecentSignIn } from "@/lib/auth/session-age";
import { mayWalkDurchgang } from "@/lib/billing/access";
import { mayExport } from "@/lib/export/access";
import { issuer } from "@/lib/mcp/config";
import { instanceKey } from "@/lib/mcp/instance-key";
import { type ConsentRequest, deny, readRequest } from "@/lib/mcp/oauth";
import { api } from "@/lib/trpc/server";

/**
 * The card of the test endpoint's sign-in (lib/test-mcp/oauth.ts). Anyone signed in can open this
 * page with a request, so anyone but the operator is shown the plain text of an expired request,
 * which says nothing of what it was for.
 */
async function TestConsent({
  raw,
  request,
  now,
}: {
  raw: string;
  request: ConsentRequest;
  now: number;
}) {
  const [t, session] = await Promise.all([
    getTranslations("settings.mcp.connect"),
    getSession(),
  ]);
  const operator = session !== null && isPlatformAdmin(session.user.email);
  return (
    <div className="mx-auto max-w-lg py-10">
      {operator ? (
        <ConnectTestClient
          request={raw}
          client={request.client ?? null}
          person={session.user.name ?? session.user.email ?? ""}
          returnTo={new URL(request.redirectUri).host}
          denyUrl={deny(request, issuer())}
          signedInRecently={isRecentSignIn(session.authTime ?? null, now)}
        />
      ) : (
        <p className="text-sm text-muted-foreground">{t("expired")}</p>
      )}
    </div>
  );
}

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
  const now = epochSeconds(new Date());
  const request = readRequest(instanceKey(), raw, now);
  if (request?.res === "test")
    return <TestConsent raw={raw} request={request} now={now} />;
  const [t, session, company] = await Promise.all([
    getTranslations("settings.mcp.connect"),
    getSession(),
    api.assessment.getCompany(),
  ]);
  // A key works in a company; without one there is nothing to connect yet (as on Settings).
  if (!company) redirect("/onboarding");

  return (
    <div className="mx-auto max-w-lg py-10">
      {request ? (
        <ConnectAssistant
          request={raw}
          client={request.client ?? null}
          company={company.name}
          companyId={company.id}
          allowed={company.assistantsAllowed}
          isAdmin={session?.role === "admin"}
          person={session?.user.name ?? session?.user.email ?? ""}
          returnTo={new URL(request.redirectUri).host}
          denyUrl={deny(request, issuer())}
          mayWalk={
            session !== null &&
            mayWalkDurchgang(session.accessLevel, isPlatformAdmin(session.user.email))
          }
          signedInRecently={isRecentSignIn(session?.authTime ?? null, now)}
          readsRecords={session !== null && mayExport(session)}
        />
      ) : (
        <p className="text-sm text-muted-foreground">{t("expired")}</p>
      )}
    </div>
  );
}
