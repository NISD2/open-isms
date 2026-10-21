import "@/lib/server-guard";
import { eq } from "drizzle-orm";
import { companySession } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { epochSeconds } from "@/lib/auth/session-age";
import { mayWalkDurchgang } from "@/lib/billing/access";
import { getClientIp } from "@/lib/client-ip";
import { db } from "@/lib/db";
import { mayExport } from "@/lib/export/may-export";
import { NO_HINTS } from "@/lib/onboarding/hints";
import { user } from "@/schema";
import { createCallerFactory, type TRPCContext } from "@/server/trpc/init";
import { appRouter } from "@/server/trpc/router";
import { assistantAgent } from "./agent";
import { assistantsAllowed } from "./allowed";
import { admitConnection } from "./connections";
import { instanceKey } from "./instance-key";
import { type KeyClaims, readKey } from "./key";
import type { KeyCaller } from "./procedures";

const createCaller = createCallerFactory(appRouter);
/** Every procedure of the app, which the key context could call; the tools never get this one. */
export type AppCaller = ReturnType<typeof createCaller>;
/** What the MCP tools call: the procedures on the key's list (procedures.ts). */
export type Caller = KeyCaller;

/**
 * The person and company behind an access key, or null: a key this instance did not sign, an
 * expired one, one whose version the person has since bumped, one whose connection the person
 * ended, one whose person no longer belongs to the company it was made for, or one in a company
 * whose admin has turned assistants off.
 * Checked on every request, so a removed person's key dies with the membership.
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
  if (!company.companyId || !(await assistantsAllowed(db, company.companyId)))
    return null;
  // Last, as it records the call as the connection's last use: a refused call is no use.
  const owner = { userId: row.id, companyId: claims.cid };
  if (!(await admitConnection(db, claims.con, owner, new Date()))) return null;
  return { row, company, companyId: company.companyId };
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
    userAgent: assistantAgent(claims.client, request.headers.get("user-agent")),
    viaKey: true,
  };
}

/** Who holds a key, and the app's procedures as them. */
export interface KeyHolder {
  readonly caller: Caller;
  readonly userId: string;
  readonly companyId: string;
  readonly role: string;
  /**
   * Whether the company's plan includes the walkthrough (the rule its procedures apply), so the
   * tools can say so in the assistant's language, with the way to unlock it.
   */
  readonly mayWalk: boolean;
  /** Whether the person may export the company's records, which is who may read them (`mayExport`). */
  readonly mayExport: boolean;
  /** As the procedures' own audit rows carry them: the assistant's user agent and the caller's IP. */
  readonly agent: string | null;
  readonly ip: string | null;
}

/** The key's holder, or null when the key opens nothing. */
export async function keyHolder(
  token: string,
  request: Request,
): Promise<KeyHolder | null> {
  const context = await keyContext(token, request);
  if (!context?.session || !context.userId || !context.companyId) return null;
  return {
    caller: createCaller(context),
    userId: context.userId,
    companyId: context.companyId,
    role: context.session.role,
    mayWalk: mayWalkDurchgang(
      context.session.accessLevel,
      isPlatformAdmin(context.session.user.email),
    ),
    mayExport: mayExport(context.session),
    agent: context.userAgent,
    ip: context.ip === "unknown" ? null : context.ip,
  };
}
