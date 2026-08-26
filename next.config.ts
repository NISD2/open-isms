import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { LEGACY_REDIRECTS } from "./lib/content/legacy-redirects";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  devIndicators: false,
  output: "standalone",
  productionBrowserSourceMaps: false,
  // The static-page-generation worker spawns a fresh Node process that loads
  // the compiled bundle into a new heap before rendering anything. Two flags
  // attack that:
  //   preloadEntriesOnStart=false  — stops the worker from loading every
  //   page module up-front; load lazily per render instead.
  //   serverSourceMaps=false       — drops the source-map cost from server
  //   bundles (saves real memory on app-router builds with many routes).
  //
  // The `cpus:1 + workerThreads:false` legacy from the pages-router era is
  // gone — those flags do not gate App Router static-gen concurrency.
  experimental: {
    preloadEntriesOnStart: false,
    serverSourceMaps: false,
  },
  // Heavy, server-only modules are externalized so they're `require()`d at
  // runtime instead of being baked into the standalone bundle. Without this,
  // the static-gen worker's boot RSS includes ALL of these even when the
  // pages it renders never touch them. (sharp, @react-pdf/renderer, and
  // @aws-sdk/client-s3 are on Next 16's auto-external list — listed below
  // for clarity rather than necessity.)
  serverExternalPackages: [
    "pg",
    "pdfkit",
    "sharp",
    "@react-pdf/renderer",
    "@aws-sdk/client-s3",
    "@aws-sdk/s3-request-presigner",
    "@ai-sdk/xai",
    "google-auth-library",
    "resend",
    "mammoth",
    "docx",
    "unpdf",
  ],
  // disposable.ts reads these .txt files via readFileSync at module-load
  // time. Without explicit tracing they are NOT copied into .next/standalone,
  // so auth crashes on prod with ENOENT and Google login breaks. Glob applies
  // to every route to cover the auth handler + register route + any future
  // caller of isDisposableEmail.
  outputFileTracingIncludes: {
    "**/*": [
      "./lib/auth/disposable-domains.txt",
      "./lib/auth/disposable-domains-local.txt",
      "./lib/auth/disposable-mx-hosts.txt",
    ],
  },
  transpilePackages: [
    "@nisd2/grc-data-model",
    "@nisd2/incident-notification-schema",
    "@nisd2/isms-schema",
    "@nisd2/isms-trpc",
    "@nisd2/isms-ui",
    "@nisd2/isms-lib",
    "@nisd2/nis2-supply-chain-questionnaire-schema",
  ],
  // Skip TypeScript checking during the production build. `bun run typecheck`
  // runs separately in dev / pre-commit; tsc inside `next build` doubled
  // memory use and triggered SIGKILL on the Coolify build host.
  typescript: { ignoreBuildErrors: true },
  async headers() {
    // Baseline security headers — applied to every response.
    // CSP intentionally permissive on script-src to accommodate Next.js
    // inline runtime scripts and the self-hosted Umami analytics. Tighten
    // when we move to nonce-based CSP in a follow-up.
    //
    // Both HSTS and CSP `upgrade-insecure-requests` are gated behind
    // CSP_UPGRADE_INSECURE=1. HSTS over HTTP is a no-op by spec, but
    // sending it from an HTTP staging URL still pins HTTPS for two years
    // once a user later visits the same hostname over HTTPS. Skip both
    // until the deployment is HTTPS-only with a real TLS cert.
    const httpsHardened = process.env.CSP_UPGRADE_INSECURE === "1";
    // Evidence uploads PUT directly to presigned S3 URLs from the browser,
    // so connect-src must include the storage origin. Derive it from the
    // same env that configures the S3 client (custom endpoint = MinIO in
    // the e2e stack; otherwise the bucket's virtual-host AWS origin).
    // Without this the browser silently blocks every evidence upload.
    const s3Origin =
      process.env.AWS_S3_ENDPOINT ??
      `https://${process.env.AWS_S3_BUCKET ?? "nisd2-dev-evidence"}.s3.${process.env.AWS_S3_REGION ?? "eu-north-1"}.amazonaws.com`;
    // Analytics is operator-configured and off by default, so its origin has
    // to come from the same env that renders the tag. Hardcoding ours would
    // both leak to us and block a self-hoster's own endpoint.
    const analyticsOrigin = process.env.ANALYTICS_SCRIPT_URL
      ? (URL.parse(process.env.ANALYTICS_SCRIPT_URL)?.origin ?? "")
      : "";
    const cspDirectives = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${analyticsOrigin} https://accounts.google.com`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      `connect-src 'self' ${analyticsOrigin} https://accounts.google.com ${s3Origin}`,
      "frame-src 'self' https://accounts.google.com https://www.youtube.com https://www.youtube-nocookie.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self' https://accounts.google.com",
      ...(httpsHardened ? ["upgrade-insecure-requests"] : []),
    ];
    const commonHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value:
          "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=()",
      },
      { key: "Content-Security-Policy", value: cspDirectives.join("; ") },
      ...(httpsHardened
        ? [
            {
              key: "Strict-Transport-Security",
              value: "max-age=63072000; includeSubDomains; preload",
            },
          ]
        : []),
    ];
    return [
      { source: "/(.*)", headers: commonHeaders },
      {
        // Tighter referrer policy for the bearer-token-protected supplier
        // access route. The token lives in the URL path; without
        // `no-referrer`, an outbound click from this page would leak the
        // token via the Referer header to the destination site.
        source: "/:locale/supplier-access/:path*",
        headers: [{ key: "Referrer-Policy", value: "no-referrer" }],
      },
    ];
  },
  async redirects() {
    return [
      // RFC 8615 well-known: password managers (iOS/Safari, Chrome, 1Password)
      // deep-link here to send a user to the change-password flow. There is no
      // logged-in change-password page yet, so point at the email reset flow.
      // permanent:false (307) so it can be repointed once such a page exists.
      { source: "/.well-known/change-password", destination: "/auth/forgot-password", permanent: false },
      // Merge overlapping pages — consolidate SEO authority
      { source: "/bsi-registrierung-anleitung", destination: "/nis2-registrierung", permanent: true },
      { source: "/en/bsi-registrierung-anleitung", destination: "/en/nis2-registrierung", permanent: true },
      { source: "/anforderungen-checkliste", destination: "/nis2-requirements", permanent: true },
      { source: "/en/anforderungen-checkliste", destination: "/en/nis2-requirements", permanent: true },
      { source: "/nis2-was-tun", destination: "/umsetzung-mittelstand", permanent: true },
      { source: "/en/nis2-was-tun", destination: "/en/umsetzung-mittelstand", permanent: true },
      // Short URL for lead gen
      { source: "/check", destination: "/applicability", permanent: false },
      { source: "/en/check", destination: "/en/applicability", permanent: false },
      // Renamed: /5-schritte and /5-steps → /nis2-roadmap (April 2026)
      { source: "/5-schritte", destination: "/nis2-roadmap", permanent: true },
      { source: "/en/5-schritte", destination: "/en/nis2-roadmap", permanent: true },
      { source: "/5-steps", destination: "/nis2-roadmap", permanent: true },
      { source: "/en/5-steps", destination: "/en/nis2-roadmap", permanent: true },
      // Risk-assessment landing localized June 2026 — old un-localized
      // EN/NL slugs redirect to the canonical localized paths so any
      // accidental backlinks to /en/risikobewertung land correctly.
      { source: "/en/risikobewertung", destination: "/en/risk-assessment", permanent: true },
      { source: "/nl/risikobewertung", destination: "/nl/risicobeoordeling", permanent: true },
      // Keyword variants → canonical pages (May 2026)
      { source: "/nis2-compliance-software", destination: "/features", permanent: true },
      { source: "/en/nis2-compliance-software", destination: "/en/features", permanent: true },
      { source: "/nl/nis2-compliance-software", destination: "/nl/features", permanent: true },
      { source: "/nis2-compliance-tool", destination: "/nis2-tool", permanent: true },
      { source: "/en/nis2-compliance-tool", destination: "/en/nis2-tool", permanent: true },
      { source: "/nl/nis2-compliance-tool", destination: "/nl/nis2-tool", permanent: true },
      // Docs hub migration — entries land in lib/content/legacy-redirects.ts
      // when an info page moves under /docs. Empty array today; non-breaking.
      ...LEGACY_REDIRECTS,
    ];
  },
};

export default withNextIntl(nextConfig);
