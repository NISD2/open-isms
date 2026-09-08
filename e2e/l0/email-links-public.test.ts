/**
 * L0: the pages people reach FROM an email are reachable without signing in.
 *
 * These pages carry their credential in the URL (an HMAC token), not in a
 * cookie, because they are opened from a mail client by someone who may have
 * no account session and, in the unsubscribe case, may be actively trying to
 * stop hearing from us. Behind the default-deny gate they redirect to
 * /auth/signin, which for an unsubscribe surface is worse than a dead link:
 * it reads as being made to log in before you are allowed to leave, which is
 * both a bad look and a consent problem.
 *
 * That is not hypothetical. /email/preferences shipped to production missing
 * from the bypass list and 307'd to the sign-in page; /email/unsubscribed,
 * added earlier, was in the list and worked. Nothing caught it, because the
 * browser suite signs in before it does anything and so never sees the
 * signed-out path. This test reads the allowlist itself.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "bun:test";

const proxySource = readFileSync(join(import.meta.dir, "../../proxy.ts"), "utf8");

/**
 * Every page whose only credential is a token in the URL. Add a new one here
 * at the same time as you add its route, and this test tells you if you
 * forgot the proxy.
 */
const EMAIL_LINK_PAGES = ["/email/unsubscribed", "/email/preferences"] as const;

describe("email-link landing pages bypass the auth gate", () => {
  for (const path of EMAIL_LINK_PAGES) {
    test(`${path} is in the proxy bypass list`, () => {
      expect(proxySource).toContain(`pathname.startsWith("${path}")`);
    });
  }

  test("the bypass list is checked before the default-deny gate", () => {
    const bypassAt = proxySource.indexOf('pathname.startsWith("/email/');
    const denyAt = proxySource.indexOf("Default-deny");
    expect(bypassAt).toBeGreaterThan(-1);
    expect(denyAt).toBeGreaterThan(-1);
    expect(bypassAt).toBeLessThan(denyAt);
  });
});
