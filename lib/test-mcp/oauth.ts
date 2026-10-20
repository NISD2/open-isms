/**
 * The test endpoint's browser sign-in: the instance's own authorization server (lib/mcp/oauth.ts)
 * hands the operator's assistant a code, and this file turns the code into keys. The keys are the
 * test key itself (./key) for an hour at a time plus a refresh key, signed with the test endpoint's
 * own key, so a customer's assistant key never opens this endpoint and these never open the
 * customer's. The sign-in ends 14 days after the operator allowed it, however often it refreshes.
 *
 * Every step asks the same question the endpoint asks on every call (`holderRefusal`): an operator,
 * a verified address, the key version and the sign-in version of the moment the operator allowed
 * it. Signing out, or ending the assistants in Settings, therefore ends the grant at its next
 * refresh, and the key in hand at its next call.
 *
 * Pure: the keys, the time and the lookups that need a database come in as arguments.
 */
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { sign, verify } from "@/lib/mcp/key";
import {
  CODE_SECONDS,
  type ConsentRequest,
  invalidGrant,
  type OtherGrants,
  REFRESH_GRACE_S,
  sha256,
  type TokenDeps,
  type TokenOutcome,
  withParams,
} from "@/lib/mcp/oauth";
import { holderRefusal, type PersonRow } from "./holder";
import { mintTestKey } from "./key";

export const TEST_ACCESS_SECONDS = 60 * 60;
/** The whole life of a browser sign-in, from the operator's Allow. */
export const TEST_GRANT_SECONDS = 14 * 24 * 60 * 60;

const CODE_AUDIENCE = "mcp_test_code";
const REFRESH_AUDIENCE = "mcp_test_refresh";

const CODE = z.object({
  aud: z.literal(CODE_AUDIENCE),
  exp: z.number().int(),
  sub: z.uuid(),
  ver: z.number().int().positive(),
  sv: z.number().int().positive(),
  azp: z.string(),
  redirectUri: z.string(),
  challenge: z.string(),
});

const REFRESH = z.object({
  aud: z.literal(REFRESH_AUDIENCE),
  iat: z.number().int(),
  exp: z.number().int(),
  sub: z.uuid(),
  ver: z.number().int().positive(),
  sv: z.number().int().positive(),
  azp: z.string().max(64),
  jti: z.string().max(64),
  grant: z.object({
    id: z.string().max(32),
    step: z.number().int().nonnegative(),
    since: z.number().int(),
  }),
});

interface Holder {
  readonly sub: string;
  readonly ver: number;
  readonly sv: number;
}

/**
 * The operator allowed it: back to the client with a code for this person at these versions.
 * Signed with the instance key, like every code, but for an audience of its own, so it can be
 * redeemed here and nowhere else.
 */
export function allowTest(
  key: Buffer,
  request: ConsentRequest,
  holder: Holder,
  issuer: string,
  nowS: number,
): string {
  const code = sign(key, {
    aud: CODE_AUDIENCE,
    exp: nowS + CODE_SECONDS,
    ...holder,
    azp: request.azp,
    redirectUri: request.redirectUri,
    challenge: request.challenge,
  });
  return withParams(request.redirectUri, { code, state: request.state, iss: issuer });
}

export interface TestGrantDeps {
  /** The person's row today; undefined when the account is gone. */
  readonly person: (userId: string) => Promise<PersonRow | undefined>;
  readonly isOperator: (email: string) => boolean;
  /** Records a code, or a step of a sign-in's refresh chain, as presented (lib/mcp/oauth.ts). */
  readonly spend: TokenDeps["spend"];
  /** Ends every key and assistant sign-in of the person (a version bump). */
  readonly revoke: (userId: string) => Promise<void>;
}

export interface TestKeys {
  /** The instance key: codes and registrations are signed with it. */
  readonly instance: Buffer;
  /** The test endpoint's key: access and refresh keys are signed with it. */
  readonly test: Buffer;
}

type Grant = z.infer<typeof REFRESH>["grant"];

/** An access key and the grant's next refresh key, neither outliving the sign-in. */
function tokens(
  key: Buffer,
  given: Holder,
  azp: string,
  grant: Grant,
  nowS: number,
): TokenOutcome {
  // Only these three, whatever else the claims it was read from hold.
  const holder: Holder = { sub: given.sub, ver: given.ver, sv: given.sv };
  const left = grant.since + TEST_GRANT_SECONDS - nowS;
  const accessS = Math.min(TEST_ACCESS_SECONDS, left);
  return {
    ok: true,
    body: {
      access_token: mintTestKey(key, holder, nowS, accessS),
      token_type: "Bearer",
      expires_in: accessS,
      refresh_token: sign(key, {
        aud: REFRESH_AUDIENCE,
        iat: nowS,
        exp: nowS + left,
        ...holder,
        azp,
        jti: randomBytes(12).toString("base64url"),
        grant,
      }),
    },
  };
}

const ENDED = "This sign-in ended. Connect again from the assistant.";

const stands = async (holder: Holder, deps: TestGrantDeps): Promise<boolean> =>
  holderRefusal(holder, await deps.person(holder.sub), deps.isOperator) === null;

/**
 * The grants of the test endpoint, for the token endpoint to try before its own. A code or refresh
 * key that is not a test one gets null and goes the way of the instance's own; a test one that
 * does not hold gets the same plain `invalid_grant` whatever the reason.
 */
export const testGrants =
  (keys: TestKeys, deps: TestGrantDeps): OtherGrants =>
  async (form, azp, nowS) => {
    switch (form.get("grant_type")) {
      case "authorization_code": {
        const raw = form.get("code") ?? "";
        const code = verify(keys.instance, raw, CODE, CODE_AUDIENCE, nowS);
        if (!code) return null;
        const redirectUri = form.get("redirect_uri");
        if (
          code.azp !== azp ||
          (redirectUri !== null && redirectUri !== code.redirectUri) ||
          sha256(form.get("code_verifier") ?? "") !== code.challenge
        ) {
          return invalidGrant("The code is not valid for this request.");
        }
        if (!(await deps.spend(sha256(raw), CODE_SECONDS)).first) {
          return invalidGrant("The code was used already.");
        }
        if (!(await stands(code, deps))) return invalidGrant(ENDED);
        const grant = { id: randomBytes(12).toString("base64url"), step: 0, since: nowS };
        return tokens(keys.test, code, azp, grant, nowS);
      }
      case "refresh_token": {
        const claims = verify(
          keys.test,
          form.get("refresh_token") ?? "",
          REFRESH,
          REFRESH_AUDIENCE,
          nowS,
        );
        if (!claims) return null;
        if (claims.azp !== azp) return invalidGrant("The refresh token is not valid.");
        // Before the ledger: a key already ended must not, replayed later, disconnect the
        // assistants connected since (as lib/mcp/oauth.ts does for its own).
        if (!(await stands(claims, deps))) return invalidGrant(ENDED);
        const { grant } = claims;
        const spent = await deps.spend(`${grant.id}.${grant.step}`, TEST_GRANT_SECONDS);
        if (!spent.first && spent.sinceS > REFRESH_GRACE_S) {
          await deps.revoke(claims.sub);
          return invalidGrant(
            "This refresh token was used before, so every assistant of this account was disconnected. Connect again.",
          );
        }
        return tokens(keys.test, claims, azp, { ...grant, step: grant.step + 1 }, nowS);
      }
      default:
        return null;
    }
  };
