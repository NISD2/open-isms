import "@/lib/server-guard";
import { eq } from "drizzle-orm";
import { companySession } from "@/lib/auth";
import { epochSeconds } from "@/lib/auth/session-age";
import { getClientIp } from "@/lib/client-ip";
import { db } from "@/lib/db";
import { NO_HINTS } from "@/lib/onboarding/hints";
import { user } from "@/schema";
import { createCallerFactory, type TRPCContext } from "@/server/trpc/init";
import { appRouter } from "@/server/trpc/router";
import { assistantAgent } from "./agent";
import { instanceKey } from "./instance-key";
import { type KeyClaims, readKey } from "./key";

const createCaller = createCallerFactory(appRouter);
export type Caller = ReturnType<typeof createCaller>;

/**
 * The person and company behind an access key, or null: a key this instance did not sign, an
 * expired one, one whose version the person has since bumped, or one whose person no longer
 * belongs to the company it was made for. Checked on every request, so a removed person's key dies
 * with the membership.
 */
async function holderOf(claims: KeyClaims) {
  const row = await db.query.user.findFirst({
    where: eq(user.id, claims.sub),
    columns: {
      id: true,
      email: true,
      name: true,
      mcpKeyVersion: true,
      grandfatheredAt: true,
    },
  });
  if (!row || row.mcpKeyVersion !== claims.ver) return null;
  const company = await companySession(row.id, claims.cid, row.grandfatheredAt !== null);
  return company.companyId ? { row, company, companyId: company.companyId } : null;
}

/**
 * The tRPC context for a call from an AI assistant: the shape a signed-in request gets, built from
 * the key instead of the cookie, so every procedure applies the same company, role and access
 * gates. There is no sign-in time, so nothing that asks for a fresh sign-in (deleting the
 * account) passes; `viaKey` keeps the platform operator's procedures out of reach.
 */
async function keyContext(token: string, request: Request): Promise<TRPCContext | null> {
  const claims = readKey(instanceKey(), token, "mcp", epochSeconds(new Date()));
  const holder = claims && (await holderOf(claims));
  if (!claims || !holder) return null;
  const { row, company, companyId } = holder;
  return {
    db,
    session: {
      user: { id: row.id, email: row.email, name: row.name },
      ...company,
      sessionVersion: null,
      authTime: null,
      accountId: row.id,
      hints: { ...NO_HINTS },
      expires: new Date(claims.exp * 1000).toISOString(),
    },
    userId: row.id,
    companyId,
    ip: getClientIp(request.headers),
    // So an assistant's change never reads as the person's own in the browser.
    userAgent: assistantAgent(
      claims.client ?? request.headers.get("user-agent") ?? "key",
    ),
    viaKey: true,
  };
}

/** Who holds a key, and the app's procedures as them. */
export interface KeyHolder {
  readonly caller: Caller;
  readonly userId: string;
  readonly role: string;
}

/** The key's holder, or null when the key opens nothing. */
export async function keyHolder(
  token: string,
  request: Request,
): Promise<KeyHolder | null> {
  const context = await keyContext(token, request);
  if (!context?.session || !context.userId) return null;
  return {
    caller: createCaller(context),
    userId: context.userId,
    role: context.session.role,
  };
}
