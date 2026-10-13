import { sql } from "drizzle-orm";
import { user } from "@/schema";

/**
 * What a credential change ends, spread into the same UPDATE as the change so neither can happen
 * alone: every session (audit M-1) and every key of the person's AI assistants (lib/mcp). A plain
 * sign-out ends sessions only, so signing out of the browser leaves the assistants connected; a
 * new password, a first password or a removed one means the account may have been someone else's
 * until now.
 */
export const revokedByCredentialChange = () => ({
  sessionVersion: sql`${user.sessionVersion} + 1`,
  mcpKeyVersion: sql`${user.mcpKeyVersion} + 1`,
});
