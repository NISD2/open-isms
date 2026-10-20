/**
 * The record sendMail leaves for the close-sync to write to Close (./sync). Which
 * message types are recorded is the closed list in ./mail-notes.
 */
import "@/lib/server-guard";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { closeMailLog, user } from "@/schema";
import { closeSettings } from "./close";
import { isLoggedEmailType } from "./mail-notes";

/** The account a mail went to: the one named by the caller, else the one owning the single address. */
const recipientUserId = async (
  to: string | readonly string[],
  named: string | undefined,
): Promise<string | null> => {
  if (named) return named;
  const address = typeof to === "string" ? to : to.length === 1 ? to[0] : undefined;
  if (!address) return null;
  const [row] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(sql`lower(${user.email})`, address.toLowerCase()))
    .limit(1);
  return row?.id ?? null;
};

/**
 * Called by sendMail after a send went out. Never throws: a CRM bookkeeping failure
 * must not fail, or retry, the mail it is about. Off without CLOSE_API_KEY, so an
 * instance that does not use Close keeps no such rows.
 */
export async function recordSentMail(mail: {
  readonly emailType: string;
  readonly to: string | readonly string[];
  readonly recipientUserId?: string;
}): Promise<void> {
  if (!isLoggedEmailType(mail.emailType) || !closeSettings(env)) return;
  try {
    const userId = await recipientUserId(mail.to, mail.recipientUserId);
    if (!userId) return;
    await db.insert(closeMailLog).values({ userId, emailType: mail.emailType });
  } catch (err) {
    console.error(
      "[close] could not record a sent mail:",
      err instanceof Error ? err.name : "unknown error",
    );
  }
}
