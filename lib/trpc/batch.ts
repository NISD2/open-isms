/**
 * The most procedures one request to /api/trpc may carry. tRPC runs a batch all at once and each
 * call is its own database work, so without a limit a single unauthenticated GET could start
 * hundreds of queries. The server refuses a longer batch before running any of it; the client
 * splits at the same number, so the app itself never meets the limit.
 */
export const TRPC_MAX_BATCH_SIZE = 20;
