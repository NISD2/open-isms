/**
 * Parsing for the manual rollout controls on /api/cron/lifecycle.
 *
 * Extracted from the route so it can be tested directly: this is the layer an
 * operator actually types into, and its failure mode is the expensive one.
 * The rule throughout is FAIL CLOSED — the default when a parameter is absent
 * is "send to everyone due, up to the cap", and those sends are irreversible,
 * so anything we do not positively recognise is rejected rather than ignored.
 * A mistyped safety flag must never quietly mean "safety off".
 */

const DRY_RUN_TRUTHY = ["1", "true", "yes", "on", ""] as const;
const DRY_RUN_FALSY = ["0", "false", "no", "off"] as const;

/** Parameters the endpoint understands. Anything else is an operator typo. */
export const KNOWN_ROLLOUT_PARAMS = ["dryRun", "limit"] as const;

export type RolloutParams =
  | { ok: true; dryRun: boolean; maxPerType: number | undefined }
  | { ok: false; error: string };

export function parseRolloutParams(params: URLSearchParams): RolloutParams {
  // A misspelled parameter NAME is invisible to get() and would read as
  // "absent" — i.e. as a full production run. `?dryrun=1`, one lowercase
  // letter away from the canary, is the exact mistake this catches.
  const known = new Set<string>(KNOWN_ROLLOUT_PARAMS);
  const unknown = [...params.keys()].filter((k) => !known.has(k));
  if (unknown.length > 0) {
    return {
      ok: false,
      error: `Unknown parameter(s): ${unknown.join(", ")}. Did you mean dryRun or limit? (both are case-sensitive)`,
    };
  }

  const rawDryRun = params.get("dryRun");
  const dryRunValue = rawDryRun?.trim().toLowerCase() ?? null;
  if (
    dryRunValue !== null &&
    !(DRY_RUN_TRUTHY as readonly string[]).includes(dryRunValue) &&
    !(DRY_RUN_FALSY as readonly string[]).includes(dryRunValue)
  ) {
    return { ok: false, error: "Unrecognised dryRun value; use dryRun=1 or omit it" };
  }
  // A bare `?dryRun` (value "") asks for one, the way a CLI flag does.
  const dryRun =
    dryRunValue !== null && (DRY_RUN_TRUTHY as readonly string[]).includes(dryRunValue);

  const rawLimit = params.get("limit");
  if (rawLimit === null) return { ok: true, dryRun, maxPerType: undefined };
  // Plain decimal digits only. Number() would also swallow "1e3", "0x10" and
  // "+7"; none of those is something an operator means to type here, and
  // guessing at them is how a ramp step turns into a bigger send than
  // intended. The dispatcher clamps to its own cap regardless.
  const trimmed = rawLimit.trim();
  if (!/^\d+$/.test(trimmed)) {
    return { ok: false, error: "limit must be a whole number of 1 or more" };
  }
  const limit = Number(trimmed);
  if (limit < 1) {
    return { ok: false, error: "limit must be a whole number of 1 or more" };
  }
  return { ok: true, dryRun, maxPerType: limit };
}
