import "@/lib/server-guard";
import { env } from "@/lib/env";
import { signingKey } from "./key";

/** This instance's signing key for MCP keys, derived from its AUTH_SECRET. */
export const instanceKey = (): Buffer => signingKey(env.AUTH_SECRET);
