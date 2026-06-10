/**
 * Lightweight server-only guard.
 *
 * Use this INSTEAD of `import "server-only";` in modules that are also imported
 * by CLI scripts (`bun run scripts/...`) — the standard `server-only` package
 * relies on the `react-server` export condition, which Bun does not set, so it
 * throws at script load time.
 *
 * This file does not rely on any export conditions: it just trips at module
 * evaluation if `window` exists (i.e. the module made it into a browser bundle).
 * That is weaker than the build-time protection `server-only` gives Next.js,
 * but it still surfaces accidental client imports loudly on the first page
 * load instead of silently shipping DATABASE_URL / SDK secrets to the browser.
 */
if (typeof window !== "undefined") {
  throw new Error(
    "[server-guard] This module is server-only and was loaded in a browser bundle.",
  );
}

export {};
