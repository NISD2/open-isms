import { localCallbackPath } from "@/lib/auth/local-path";

/**
 * Where accepting an invite lands. The inviting admin supplies it, and a new account is the
 * admin of its own draft company, so unchecked it let a stranger mail a genuine invite that
 * forwards to a page of their choosing after sign-in. It is checked when the invite is stored
 * and again when it is used, because rows written before the check can hold anything.
 */
export function inviteRedirectPath(raw: string | null): string {
  return localCallbackPath(raw, "/");
}
