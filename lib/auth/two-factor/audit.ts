import "@/lib/server-guard";
import { logAudit } from "@/lib/audit";
import type { TwoFactorRequirement } from "./policy";

/** What happened to a person's second factor. Never carries a secret or a code. */
export type TwoFactorEvent =
  | {
      readonly kind: "enabled";
      readonly how: "settings" | "sign_in";
      readonly requiredBy: TwoFactorRequirement;
    }
  | { readonly kind: "disabled"; readonly confirmedWith: "app" | "recovery" }
  | {
      readonly kind: "recovery_code_used";
      readonly at: "sign_in" | "settings";
      readonly recoveryCodesLeft: number;
    }
  | { readonly kind: "recovery_codes_replaced" }
  | { readonly kind: "reset"; readonly reason: string; readonly wasEnabled: boolean };

const DESCRIPTIONS: Record<TwoFactorEvent["kind"], string> = {
  enabled: "Two-factor sign-in turned on",
  disabled: "Two-factor sign-in turned off",
  recovery_code_used: "A two-factor recovery code was used",
  recovery_codes_replaced: "New two-factor recovery codes made",
  reset: "Two-factor sign-in reset by a platform admin",
};

/**
 * One audit row per event, about `subjectId`. The person's own events go under their open company,
 * as their other actions do; a platform admin's reset goes under no company, as every operator
 * action across tenants does, with the admin as the actor.
 */
export function auditTwoFactor(
  event: TwoFactorEvent,
  who: {
    readonly subjectId: string;
    readonly actorId: string;
    readonly companyId: string | null;
    readonly ip: string;
    readonly userAgent: string | null;
  },
): void {
  const { kind, ...facts } = event;
  void logAudit({
    companyId: kind === "reset" ? null : who.companyId,
    userId: who.actorId,
    action: `user.two_factor_${kind}`,
    entityType: "user",
    entityId: who.subjectId,
    description: DESCRIPTIONS[kind],
    newValue: facts,
    ipAddress: who.ip === "unknown" ? null : who.ip,
    userAgent: who.userAgent,
  });
}
