Terminate TLS in front of the application. The container listens on port 3000 inside, is published on `APP_PORT` outside, runs as the non-root `node` user, and ships security headers from `next.config.ts` plus a Content-Security-Policy computed per request.

Two ways to do it: the bundled Caddy profile, or your own reverse proxy.

## The bundled proxy

```ini
COMPOSE_PROFILES=minio,proxy,backup
APP_DOMAIN=isms.example.com
STORAGE_DOMAIN=storage.example.com
AUTH_URL=https://isms.example.com
NEXT_PUBLIC_APP_URL=https://isms.example.com
AWS_S3_ENDPOINT=https://storage.example.com
```

```bash
docker compose --profile proxy up -d
```

Caddy obtains and renews certificates on its own. **Both names must already resolve to this server before the first start**, or the certificate order fails and you get a TLS error rather than a page.

Two names, not one, when you use the bundled MinIO: evidence uploads go from the browser straight to the object store using a URL signed for one exact hostname, so the store needs a public name of its own. `STORAGE_DOMAIN` and `AWS_S3_ENDPOINT` have to be the same `https://` address.

The shipped Caddyfile answers 404 for `/api/health` on the public side. The version it reports is convenient for you and equally convenient for anyone matching instances against a published advisory; Docker's own healthcheck runs inside the container and does not need the route to be public. Delete those two lines if you point an external uptime monitor at it, and prefer authenticating that monitor.

## Your own proxy

Proxy to the app container on port 3000 and forward the usual headers. Two requirements beyond the obvious:

- The upload endpoint accepts files, so allow a request body large enough for real evidence documents. The bundled Caddyfile sets 100 MB on the storage host.
- Do not cache `/api/*`.

## AUTH_URL is the trap

Auth.js derives its session cookie name from this URL's scheme: `__Secure-authjs.session-token` on `https`, the bare name on `http`. The middleware then looks for that exact cookie. Set it to `http://` while users reach you over `https` and every login redirects back to the sign-in page with no error message anywhere, because the cookie the browser holds is not the cookie the server asks for.

Set `AUTH_URL` to the URL your users actually type, and confirm one login works before you walk away.

## HSTS

```ini
CSP_UPGRADE_INSECURE=1
```

Set this only once you are HTTPS-only with a real certificate. It turns on HSTS with a two-year max-age, which pins HTTPS for that hostname in every browser that visits over TLS. Turning it on early, or on a hostname you later need to serve over plain HTTP, is not something you can undo from the server side.

## Order of operations

1. Point DNS at the server and wait for it to resolve.
2. Set `APP_DOMAIN`, `STORAGE_DOMAIN`, `AUTH_URL`, `NEXT_PUBLIC_APP_URL`, `AWS_S3_ENDPOINT`.
3. Start with the `proxy` profile and watch the certificate order in `docker compose logs proxy`.
4. Sign in.
5. Upload one evidence file.
6. Only then set `CSP_UPGRADE_INSECURE=1` and restart.
