/**
 * Every lifecycle email type the dispatcher runs, in run order. Adding a
 * campaign = one module under emails/ + one entry here. Keys are forever:
 * they are the dedup identity in the notification table, so retire a type by
 * removing it here, never by reusing its key.
 */

import { activationNudge } from "./emails/activation-nudge";
import type { LifecycleEmailType } from "./types";

export const LIFECYCLE_EMAIL_TYPES: readonly LifecycleEmailType[] = [activationNudge];
