## Reporting a vulnerability

Report privately first, to **security@nisd2.eu**. Include what it is, how to reproduce it, the affected path or URL, and your read on the impact.

Acknowledged within 48 hours, critical issues addressed within 7 days. The published timeline is: triage on day 0 to 2, patch developed and reviewed by day 7, released by day 14, public disclosure on the GitHub Security tab between day 14 and 30, coordinated with you. The full policy is [`.github/SECURITY.md`](https://github.com/NISD2/open-isms/blob/main/.github/SECURITY.md).

**In scope:** the application, the published and workspace packages, the reference deployment, the CI and release pipeline, and the migration chains.

**Out of scope:** operational properties of the hosted service such as uptime, marketing copy, anything that needs authenticated admin access already (those are bugs, file them normally), and third-party dependencies, which go to the relevant project. Dependency advisories are watched through Dependabot.

## What is actually in place

Worth stating plainly, because a compliance product that is vague about its own controls has a credibility problem.

### Authorisation

Route authorisation is **default-deny** in `proxy.ts`. Every path is protected unless it appears in a public allowlist, so the failure mode of forgetting an entry is a public page that redirects to sign-in, rather than a protected page that quietly serves data without ever asking for a session.

Tenant isolation is enforced in the tRPC layer: procedures resolve the caller's company from the session and filter on it, and an entity id from the caller is checked against that company before it is read or written. Cross-tenant access is the thing this codebase reviews hardest for, and it has found and fixed real instances of it.

### Sessions

Auth.js v5. Email and password with a bcrypt hash is the default provider, Google OAuth is optional and accepts only Google-verified addresses. Sessions last 8 hours and refresh silently during active use.

The cookie name is derived from `AUTH_URL`'s scheme, which is why a wrong `AUTH_URL` breaks every login in a way that looks like nothing at all. See [Domains and TLS](/docs/self-hosting/domains-and-tls).

### Headers

Security headers come from `next.config.ts`. The Content-Security-Policy is computed per request from the environment the container was started with, so a self-hosted instance names its own storage origin in `connect-src` rather than the one belonging to whoever built the image. `CSP_UPGRADE_INSECURE=1` adds HSTS once you are HTTPS-only.

### The container

Runs as the non-root `node` user. Every service in the compose file binds to loopback by default, and the CI lifecycle job fails if any of them publishes beyond it. The updater container publishes no port at all and is scoped by label to the app container.

### The pipeline

Every push runs gitleaks over the tree. Dependabot watches dependencies. The published image is checked as anonymously pullable during release, which catches a registry misconfiguration before someone else does.

### Code rules that are security rules

No `as any` and no non-null assertions, both enforced in review. No `drizzle-kit push`. Development-only auth is guarded by both an environment variable and a `NODE_ENV` check, so it cannot be enabled in a released image.

## What is not in place

- The audit log is append-only by convention in the application, not by a database grant or trigger. A Postgres superuser can edit it. Checksums make an edit detectable, not impossible. See [Evidence and sign-off](/docs/platform/evidence-and-sign-off).
- Sign-off is a hash chain, not an electronic signature. It is not an advanced or qualified signature under eIDAS, and describing it as one would be wrong.
- There is no penetration-test report to link to.

If any of that changes, this page changes with it.
