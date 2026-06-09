/**
 * Deadline Math Engine — Pure date computation for compliance deadlines
 *
 * Zero side effects. All functions are deterministic and easily testable.
 * This is the most legally critical code in the platform — under NIS2 Art. 38,
 * management faces personal liability for missed compliance deadlines.
 */
import {
  addMonths,
  addYears,
  addDays,
  differenceInCalendarDays,
  startOfDay,
} from "date-fns";

// ---------------------------------------------------------------------------
// Types — match the DB enum values exactly
// ---------------------------------------------------------------------------

export type Frequency =
  | "one-time"
  | "monthly"
  | "quarterly"
  | "semi-annual"
  | "annual"
  | "every-3-years"
  | "on-change"
  | "ongoing";

export const PRIORITIES = ["P0", "P1", "P2", "P3"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const IMPORTANCES = ["mandatory", "recommended", "enhanced"] as const;
export type Importance = (typeof IMPORTANCES)[number];

export type Urgency = "info" | "warning" | "urgent" | "critical";

// ---------------------------------------------------------------------------
// Core Deadline Computation
// ---------------------------------------------------------------------------

/** Frequency → months mapping. null means no calendar recurrence. */
const FREQUENCY_MONTHS: Record<Frequency, number | null> = {
  "one-time": null,
  monthly: 1,
  quarterly: 3,
  "semi-annual": 6,
  annual: 12,
  "every-3-years": 36,
  "on-change": null,
  ongoing: null,
};

/**
 * Compute the next review date based on frequency.
 * Returns null for frequencies without calendar recurrence (one-time, on-change, ongoing).
 */
export function computeNextReviewDate(
  completedAt: Date,
  frequency: Frequency,
): Date | null {
  const months = FREQUENCY_MONTHS[frequency];
  if (months === null) return null;
  return months >= 12 && months % 12 === 0
    ? addYears(completedAt, months / 12)
    : addMonths(completedAt, months);
}

/**
 * Compute the initial deadline for a requirement based on the assessment start date
 * and the requirement's priority tier.
 *
 * P0 = Immediate (30 days grace for onboarding)
 * P1 = Within 3 months
 * P2 = Within 6 months
 * P3 = Within 12 months
 */
export function computeInitialDeadline(
  assessmentStartedAt: Date,
  priority: Priority,
): Date {
  switch (priority) {
    case "P0": return addDays(assessmentStartedAt, 30);
    case "P1": return addMonths(assessmentStartedAt, 3);
    case "P2": return addMonths(assessmentStartedAt, 6);
    case "P3": return addYears(assessmentStartedAt, 1);
  }
}

// ---------------------------------------------------------------------------
// Urgency Classification
// ---------------------------------------------------------------------------

/**
 * Determine notification urgency based on days until deadline, priority, and importance.
 *
 * - critical: overdue AND mandatory (highest legal risk)
 * - urgent: overdue, OR <7 days remaining, OR P0 priority
 * - warning: 7-30 days remaining, OR P1 priority
 * - info: >30 days remaining (routine)
 */
export function computeUrgency(
  daysRemaining: number,
  priority: Priority,
  importance: Importance,
): Urgency {
  if (daysRemaining < 0 && importance === "mandatory") return "critical";
  if (daysRemaining < 0) return "urgent";
  if (daysRemaining <= 7 || priority === "P0") return "urgent";
  if (daysRemaining <= 30 || priority === "P1") return "warning";
  return "info";
}

// ---------------------------------------------------------------------------
// Reminder Schedule
// ---------------------------------------------------------------------------

/**
 * Get the reminder offsets (days before deadline) appropriate for a given frequency.
 * Shorter frequencies get fewer, closer reminders to avoid noise.
 * Longer frequencies get earlier heads-up.
 *
 * Returns negative numbers (days before the deadline).
 */
function getReminderOffsets(frequency: Frequency): number[] {
  switch (frequency) {
    case "monthly":
      return [-7, -1];
    case "quarterly":
      return [-30, -7, -1];
    case "semi-annual":
      return [-60, -30, -7];
    case "annual":
      return [-90, -30, -7];
    case "every-3-years":
      return [-180, -90, -30];
    default:
      // one-time, on-change, ongoing — shouldn't normally be called, but safe default
      return [-30, -7];
  }
}

/**
 * Compute notification schedule dates from a review date and frequency.
 * Filters out dates that are already in the past.
 *
 * Returns objects with scheduledFor, triggerField (e.g. "reminder_30d"),
 * and urgency level.
 */
export function computeNotificationSchedule(
  reviewDate: Date,
  frequency: Frequency,
  priority: Priority,
  importance: Importance,
  now: Date = new Date(),
): Array<{
  scheduledFor: Date;
  triggerField: string;
  urgency: Urgency;
}> {
  const offsets = getReminderOffsets(frequency);
  const today = startOfDay(now);

  return offsets
    .map((offset) => {
      const scheduledFor = addDays(reviewDate, offset);
      const daysRemaining = differenceInCalendarDays(
        startOfDay(reviewDate),
        startOfDay(scheduledFor),
      );
      return {
        scheduledFor,
        triggerField: offset === -1
          ? "reminder_1d"
          : offset === -7
            ? "reminder_7d"
            : offset === -30
              ? "reminder_30d"
              : offset === -60
                ? "reminder_60d"
                : offset === -90
                  ? "reminder_90d"
                  : `reminder_${Math.abs(offset)}d`,
        urgency: computeUrgency(daysRemaining, priority, importance),
      };
    })
    .filter((n) => startOfDay(n.scheduledFor) >= today);
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

/**
 * Compute days until a deadline from a reference date.
 * Positive = days remaining, negative = days overdue.
 */
export function daysUntilDeadline(deadline: Date, now?: Date): number {
  const today = startOfDay(now ?? new Date());
  return differenceInCalendarDays(startOfDay(deadline), today);
}

/**
 * Check if a frequency produces recurring deadlines (vs one-time or event-driven).
 */
export function isRecurringFrequency(frequency: Frequency): boolean {
  return FREQUENCY_MONTHS[frequency] !== null;
}

/**
 * Format a deadline date as an ISO date string (YYYY-MM-DD) for DB storage.
 */
export function toDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}
