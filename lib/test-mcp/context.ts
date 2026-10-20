import "@/lib/server-guard";
import { eq } from "drizzle-orm";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { epochSeconds } from "@/lib/auth/session-age";
import { getClientIp } from "@/lib/client-ip";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { user } from "@/schema";
import { holderRefusal } from "./holder";
import { readTestKey, testSigningKey } from "./key";

/** Who holds a test key, checked again on every request. */
export interface TestHolder {
  readonly userId: string;
  readonly email: string;
  /** The key's own id, so an audit row names which key made the call. */
  readonly keyId: string;
  readonly ip: string | null;
  readonly userAgent: string | null;
}

/**
 * Derived when used, never when the module loads: the app router imports this file, so a build
 * that has no AUTH_SECRET (the Docker image build) would fail on /api/mcp at import time.
 */
export const testInstanceKey = (): Buffer => testSigningKey(env.AUTH_SECRET);

/**
 * The person behind a key, or null: a key this instance did not sign, an ended one, one made
 * before the person signed out or disconnected their assistants, an address that is not verified,
 * or one that is no longer on the operator list (PLATFORM_ADMIN_EMAILS, read from the process
 * environment: a change reaches a running instance with its next deploy). The rules are
 * `holderRefusal`'s.
 */
export async function holderOf(
  token: string,
  request: Request,
): Promise<TestHolder | null> {
  const claims = readTestKey(testInstanceKey(), token, epochSeconds(new Date()));
  if (!claims) return null;
  const row = await db.query.user.findFirst({
    where: eq(user.id, claims.sub),
    columns: {
      id: true,
      email: true,
      emailVerifiedAt: true,
      mcpKeyVersion: true,
      sessionVersion: true,
    },
  });
  if (!row?.email || holderRefusal(claims, row, isPlatformAdmin) !== null) return null;
  const ip = getClientIp(request.headers);
  return {
    userId: row.id,
    email: row.email,
    keyId: claims.jti,
    ip: ip === "unknown" ? null : ip,
    userAgent: request.headers.get("user-agent")?.slice(0, 200) ?? null,
  };
}
