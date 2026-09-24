/**
 * The one rule that decides whether the manual billing harness exists at all.
 *
 * It lives here rather than in the route so the page and the endpoint cannot drift apart: a page
 * that renders while its endpoint refuses is a bug report, and an endpoint that answers while the
 * page is gone is a hole.
 *
 * The rule is deny by default and derived from the environment rather than from a flag someone
 * might set by accident. The harness is on only when the configured Qonto host IS the sandbox.
 * There is no value of this variable that both enables the harness and points it at a real
 * account, so the worst case of a misconfigured deploy is invoices in a shared test environment.
 */

export const QONTO_SANDBOX_HOST = "thirdparty-sandbox.staging.qonto.co";

export const isSandboxHarnessEnabled = (env: NodeJS.ProcessEnv = process.env): boolean =>
  (env.QONTO_API_BASE ?? "").includes(QONTO_SANDBOX_HOST);
