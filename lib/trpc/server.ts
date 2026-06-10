import "@/lib/server-guard";

import { createCallerFactory, createTRPCContext } from "@/server/trpc/init";
import { appRouter } from "@/server/trpc/router";

const createCaller = createCallerFactory(appRouter);

/**
 * Server-side tRPC caller for use in Server Components.
 * Lazy-evaluated to handle the async context creation.
 */
export const api = createCaller(createTRPCContext);
