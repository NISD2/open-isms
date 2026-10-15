import "@/lib/server-guard";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { type McpConnectionKind, mcpConnection } from "@/schema";

/** Whose connection, in which company: every read and write here is held to both. */
interface Owner {
  readonly userId: string;
  readonly companyId: string;
}

const owned = ({ userId, companyId }: Owner) =>
  and(eq(mcpConnection.userId, userId), eq(mcpConnection.companyId, companyId));

const open = (now: Date) =>
  and(isNull(mcpConnection.endedAt), gt(mcpConnection.expiresAt, now));

/** A new connection's row; its id goes into every key and sign-in token it is given. */
export async function openConnection(
  db: DbOrTx,
  connection: Owner & {
    readonly kind: McpConnectionKind;
    readonly client: string | null;
    readonly keyVersion: number;
    readonly expiresAt: Date;
  },
  now: Date,
): Promise<string> {
  const [row] = await db
    .insert(mcpConnection)
    .values({ ...connection, createdAt: now })
    .returning({ id: mcpConnection.id });
  if (!row) throw new Error("mcp_connection insert returned no row");
  return row.id;
}

/** How often a connection's last use is written: to the minute is all Settings shows. */
const USE_RESOLUTION_MS = 60_000;

/** Whether the connection is still open for this person in this company, recording the call as its last use. */
export async function admitConnection(
  db: DbOrTx,
  id: string,
  owner: Owner,
  now: Date,
): Promise<boolean> {
  const [row] = await db
    .select({ lastUsedAt: mcpConnection.lastUsedAt })
    .from(mcpConnection)
    .where(and(eq(mcpConnection.id, id), owned(owner), open(now)));
  if (!row) return false;
  if (!row.lastUsedAt || now.getTime() - row.lastUsedAt.getTime() >= USE_RESOLUTION_MS) {
    await db
      .update(mcpConnection)
      .set({ lastUsedAt: now })
      .where(eq(mcpConnection.id, id));
  }
  return true;
}

/** Whether the connection is still open, without counting it as used: the token endpoint's check. */
export async function connectionOpen(
  db: DbOrTx,
  id: string,
  owner: Owner,
  now: Date,
): Promise<boolean> {
  const [row] = await db
    .select({ id: mcpConnection.id })
    .from(mcpConnection)
    .where(and(eq(mcpConnection.id, id), owned(owner), open(now)));
  return row !== undefined;
}

/** The person's open connections in the company, newest first, under their current key version. */
export const connectionsOf = (db: DbOrTx, owner: Owner, keyVersion: number, now: Date) =>
  db
    .select({
      id: mcpConnection.id,
      kind: mcpConnection.kind,
      client: mcpConnection.client,
      createdAt: mcpConnection.createdAt,
      lastUsedAt: mcpConnection.lastUsedAt,
      expiresAt: mcpConnection.expiresAt,
    })
    .from(mcpConnection)
    .where(and(owned(owner), open(now), eq(mcpConnection.keyVersion, keyVersion)))
    .orderBy(desc(mcpConnection.createdAt));

/** Ends one of the person's connections; false when it is not theirs here or already over. */
export async function endConnection(
  db: DbOrTx,
  id: string,
  owner: Owner,
  now: Date,
): Promise<boolean> {
  const ended = await db
    .update(mcpConnection)
    .set({ endedAt: now })
    .where(and(eq(mcpConnection.id, id), owned(owner), open(now)))
    .returning({ id: mcpConnection.id });
  return ended.length > 0;
}

/** Ends the person's pasted keys in the company: a new key takes the old one's place. */
export const endKeys = (db: DbOrTx, owner: Owner, now: Date) =>
  db
    .update(mcpConnection)
    .set({ endedAt: now })
    .where(and(owned(owner), open(now), eq(mcpConnection.kind, "key")));
