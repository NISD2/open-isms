/**
 * Cron Job: Course follow-up reminders
 *
 * Daily cron that emails users who started a training course and have not
 * returned in 7+ days. Per (user, course) dedup — each course gets at most
 * one follow-up email, ever. If the user later stalls on a different
 * course, that one earns its own (separate) follow-up.
 *
 * Bundles all of a user's unpinged stalled courses into ONE email with a
 * Mom-Test follow-up question. Reuses the existing `notification` table:
 *   entityType   = "course_followup"
 *   recipientId  = user.id
 *   triggerField = "stalled_7d:{courseId}"   ← per-course dedup key
 *   entityId     = user.id
 * One notification row is inserted per course included in the email.
 *
 * Users with `user.emailFollowupsDisabled = true` are skipped entirely.
 *
 * Security: Bearer token from CRON_SECRET env var.
 * Schedule: Vercel Cron at 07:00 UTC (09:00 CET).
 */
import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { notification, user } from "@/schema";
import { logAudit } from "@/lib/audit";
import { env } from "@/lib/env";
import { verifyCronBearer } from "@/lib/cron/auth";
import { getAppUrl } from "@/lib/utils";
import { sendMail, courseFollowupEmail } from "@/lib/mail";
import { loadCourse } from "@/lib/training/course-loader";
import { unsubscribeUrl as buildUnsubscribeUrl } from "@/lib/email/unsubscribe";

export const dynamic = "force-dynamic";

const STALL_DAYS = 7;
const ENTITY_TYPE = "course_followup";
const TRIGGER_PREFIX = "stalled_7d:";
const REPLY_TO = process.env.SUPPORT_EMAIL ?? "support@example.com";

type StalledRow = {
  user_id: string;
  company_id: string;
  course_id: string;
} & Record<string, unknown>;

export async function GET(req: NextRequest) {
  if (!env.CRON_SECRET) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  // Audit EW-3 (2026-06-11): constant-time bearer comparison via
  // verifyCronBearer. Removes the per-byte timing side channel on the
  // previous string compare.
  if (!verifyCronBearer(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const stats = {
    stalled_pairs: 0,
    eligible_users: 0,
    deduped_pairs: 0,
    emails_sent: 0,
    skipped_no_email: 0,
    skipped_unsubscribed: 0,
    skipped_unknown_course: 0,
  };

  try {
    const now = new Date();
    const stallCutoff = new Date(now.getTime() - STALL_DAYS * 24 * 60 * 60 * 1000);

    // 1. Find (user_id, company_id, course_id) tuples where:
    //    - the user has at least one incomplete lesson in this course
    //    - the latest activity on any lesson of this course is older than the stall cutoff
    //    company_id is required so we can scope notification rows per tenant.
    //    A user with no companyId yet is excluded here.
    const stalledResult = await db.execute<StalledRow>(sql`
      SELECT
        user_id,
        company_id,
        course_id
      FROM training_lesson_progress
      WHERE company_id IS NOT NULL
      GROUP BY user_id, company_id, course_id
      HAVING
        MAX(updated_at) <= ${stallCutoff}
        AND BOOL_OR(completed = false)
    `);
    const stalledRows = stalledResult.rows;
    stats.stalled_pairs = stalledRows.length;

    // 2. Group stalled courses per user.
    const stalledByUser = new Map<string, { companyId: string; courseIds: string[] }>();
    for (const row of stalledRows) {
      const existing = stalledByUser.get(row.user_id);
      if (existing) {
        existing.courseIds.push(row.course_id);
      } else {
        stalledByUser.set(row.user_id, {
          companyId: row.company_id,
          courseIds: [row.course_id],
        });
      }
    }
    if (stalledByUser.size === 0) {
      const elapsed = Date.now() - startTime;
      return NextResponse.json({ ok: true, elapsed, stats });
    }

    // 3. Per-course dedup. Pull every prior course_followup notification for
    //    the candidate users. Each row's triggerField encodes the courseId
    //    we pinged about ("stalled_7d:{courseId}"). The presence of a row
    //    means "we already asked this user about this course, ever" — there
    //    is no time window. If we want them to be pingable again about the
    //    same course, the operator deletes the row by hand.
    const userIds = Array.from(stalledByUser.keys());
    const priorFollowups = await db.query.notification.findMany({
      where: and(
        eq(notification.entityType, ENTITY_TYPE),
        inArray(notification.recipientId, userIds),
      ),
      columns: { recipientId: true, triggerField: true },
    });
    const alreadyPinged = new Set<string>();
    for (const n of priorFollowups) {
      if (n.recipientId && n.triggerField.startsWith(TRIGGER_PREFIX)) {
        const courseId = n.triggerField.slice(TRIGGER_PREFIX.length);
        alreadyPinged.add(`${n.recipientId}:${courseId}`);
      }
    }

    // 4. Filter each user's stalled courses to only those they've never
    //    been pinged about. If a user has zero unpinged courses remaining,
    //    they drop out of the run entirely.
    const filtered = new Map<string, { companyId: string; courseIds: string[] }>();
    for (const [uId, meta] of stalledByUser) {
      const unpinged = meta.courseIds.filter(
        (cId) => !alreadyPinged.has(`${uId}:${cId}`),
      );
      stats.deduped_pairs += meta.courseIds.length - unpinged.length;
      if (unpinged.length > 0) {
        filtered.set(uId, { companyId: meta.companyId, courseIds: unpinged });
      }
    }
    const candidateIds = Array.from(filtered.keys());
    if (candidateIds.length === 0) {
      const elapsed = Date.now() - startTime;
      return NextResponse.json({ ok: true, elapsed, stats });
    }

    // 5. Look up emails + names. Users who opted out of follow-up emails
    //    drop out here.
    const users = await db.query.user.findMany({
      where: inArray(user.id, candidateIds),
      columns: {
        id: true,
        email: true,
        name: true,
        emailFollowupsDisabled: true,
      },
    });
    stats.eligible_users = users.length;

    // 6. Build per-user emails. Course titles are loaded lazily; unknown
    //    courses (rows in DB for a course no longer in the filesystem
    //    catalog) are skipped silently rather than failing the cron.
    const appUrl = getAppUrl();
    const courseTitleCache = new Map<string, string | null>();
    async function getTitle(courseId: string): Promise<string | null> {
      const cached = courseTitleCache.get(courseId);
      if (cached !== undefined) return cached;
      try {
        const course = await loadCourse(courseId);
        const title = course.title.en;
        courseTitleCache.set(courseId, title);
        return title;
      } catch {
        courseTitleCache.set(courseId, null);
        return null;
      }
    }

    for (const u of users) {
      if (u.emailFollowupsDisabled) {
        stats.skipped_unsubscribed++;
        continue;
      }
      if (!u.email) {
        stats.skipped_no_email++;
        continue;
      }
      const meta = filtered.get(u.id);
      if (!meta) continue;

      const courseList: Array<{ title: string; resumeUrl: string }> = [];
      const courseIdsForRows: string[] = [];
      for (const courseId of meta.courseIds) {
        const title = await getTitle(courseId);
        if (!title) {
          stats.skipped_unknown_course++;
          continue;
        }
        courseList.push({
          title,
          resumeUrl: `${appUrl}/training/courses/${encodeURIComponent(courseId)}`,
        });
        courseIdsForRows.push(courseId);
      }
      if (courseList.length === 0) continue;

      const unsubUrl = buildUnsubscribeUrl(u.id);
      const email = courseFollowupEmail({
        recipientName: u.name,
        courses: courseList,
        unsubscribeUrl: unsubUrl,
      });

      // Insert one notification row PER COURSE before sending. Each row is
      // the dedup record for that (user, course) pair — once present, this
      // course never earns a follow-up email again for this user. Inserting
      // pre-send prevents two concurrent cron runs from double-sending.
      // Trade-off: if the send fails, the dedup rows remain and the user
      // won't be retried for those courses. The audit log captures failures
      // for ops to manually delete + retry. Same pattern as the deadline
      // cron in this codebase.
      const insertedRows = await db
        .insert(notification)
        .values(
          courseIdsForRows.map((courseId, idx) => ({
            companyId: meta.companyId,
            recipientId: u.id,
            entityType: ENTITY_TYPE,
            entityId: u.id,
            triggerField: `${TRIGGER_PREFIX}${courseId}`,
            subject: email.subject,
            body: courseList[idx].title,
            channel: "email" as const,
            status: "sent" as const,
            scheduledFor: now,
            sentAt: now,
            urgency: "info" as const,
            escalationLevel: 0,
          })),
        )
        .returning({ id: notification.id });
      const firstNotificationId = insertedRows[0]?.id ?? null;

      sendMail({
        to: u.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
        replyTo: REPLY_TO,
        unsubscribeUrl: unsubUrl,
      })
        .then((result) => {
          if (!result.success) {
            logAudit({
              companyId: meta.companyId,
              userId: u.id,
              action: "email.course_followup_failed",
              entityType: "notification",
              entityId: firstNotificationId,
              description: `Course follow-up to ${u.email} failed`,
            });
          }
        })
        .catch((err) => {
          logAudit({
            companyId: meta.companyId,
            userId: u.id,
            action: "email.course_followup_failed",
            entityType: "notification",
            entityId: firstNotificationId,
            description: `Course follow-up to ${u.email} threw: ${err instanceof Error ? err.message : "unknown"}`,
          });
        });

      stats.emails_sent++;
    }

    const elapsed = Date.now() - startTime;
    logAudit({
      companyId: null,
      userId: null,
      action: "cron.course_reminders",
      entityType: "system",
      entityId: null,
      description: `Course-reminder cron completed in ${elapsed}ms: ${JSON.stringify(stats)}`,
    });
    return NextResponse.json({ ok: true, elapsed, stats });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logAudit({
      companyId: null,
      userId: null,
      action: "cron.course_reminders.error",
      entityType: "system",
      entityId: null,
      description: `Course-reminder cron failed: ${message}`,
    });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
